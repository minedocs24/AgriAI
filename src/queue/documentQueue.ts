/**
 * AgriAI Document Queue Manager
 * 
 * Gestisce la coda per il processing asincrono dei documenti:
 * - Queue Bull.js con Redis backend
 * - Job prioritization e retry logic
 * - Progress tracking e notifications
 * - Error handling e dead letter queue
 * - Monitoring e metrics
 * - Scalable worker processes
 */

import Queue from 'bull';
import { PrismaClient } from '@prisma/client';
import { DocumentProcessor } from '../services/DocumentProcessor';
import { S3Service } from '../services/S3Service';
import Redis from 'ioredis';

interface DocumentProcessingJobData {
  documentId: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  userId: string;
  isReprocessing?: boolean;
  attempts?: number;
  metadata?: Record<string, any>;
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

interface JobResult {
  documentId: string;
  success: boolean;
  processingTime: number;
  extractedText?: string;
  wordCount?: number;
  chunksCreated?: number;
  error?: string;
  completedAt: Date;
}

export class QueueManager {
  private documentQueue: Queue.Queue<DocumentProcessingJobData>;
  private cleanupQueue: Queue.Queue;
  private notificationQueue: Queue.Queue;
  private redis: Redis;
  private prisma: PrismaClient;
  private documentProcessor: DocumentProcessor;
  private s3Service: S3Service;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    // Initialize services
    this.documentProcessor = new DocumentProcessor(prisma);
    this.s3Service = new S3Service();

    // Initialize queues
    this.initializeQueues();
    this.setupWorkers();
    this.setupEventHandlers();
  }

  private initializeQueues(): void {
    const redisConfig = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0')
      }
    };

    // Main document processing queue
    this.documentQueue = new Queue<DocumentProcessingJobData>('document-processing', {
      ...redisConfig,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        delay: 0
      },
      settings: {
        stalledInterval: 30 * 1000, // 30 seconds
        maxStalledCount: 1
      }
    });

    // Cleanup queue for maintenance tasks
    this.cleanupQueue = new Queue('document-cleanup', {
      ...redisConfig,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 2
      }
    });

    // Notification queue for user updates
    this.notificationQueue = new Queue('document-notifications', {
      ...redisConfig,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 3
      }
    });
  }

  private setupWorkers(): void {
    // Document processing worker
    this.documentQueue.process('process-document', 5, async (job) => {
      return await this.processDocumentJob(job);
    });

    // Cleanup worker
    this.cleanupQueue.process('cleanup-failed', async (job) => {
      return await this.cleanupFailedDocuments(job);
    });

    this.cleanupQueue.process('cleanup-orphaned', async (job) => {
      return await this.cleanupOrphanedFiles(job);
    });

    // Notification worker
    this.notificationQueue.process('send-notification', 10, async (job) => {
      return await this.sendNotification(job);
    });
  }

  private setupEventHandlers(): void {
    // Document queue events
    this.documentQueue.on('completed', async (job, result) => {
      console.log(`Document processing completed: ${job.data.documentId}`);
      await this.handleJobCompleted(job, result);
    });

    this.documentQueue.on('failed', async (job, err) => {
      console.error(`Document processing failed: ${job.data.documentId}`, err);
      await this.handleJobFailed(job, err);
    });

    this.documentQueue.on('progress', async (job, progress) => {
      await this.updateJobProgress(job, progress);
    });

    this.documentQueue.on('stalled', async (job) => {
      console.warn(`Document processing stalled: ${job.data.documentId}`);
      await this.handleJobStalled(job);
    });

    // Error handling
    this.documentQueue.on('error', (error) => {
      console.error('Document queue error:', error);
    });
  }

  /**
   * Add document processing job to queue
   */
  async addDocumentProcessingJob(data: DocumentProcessingJobData): Promise<Queue.Job<DocumentProcessingJobData>> {
    try {
      const priority = this.getPriorityValue(data.priority);
      
      const job = await this.documentQueue.add('process-document', data, {
        priority,
        delay: data.priority === 'critical' ? 0 : 1000, // Critical jobs start immediately
        jobId: `doc-${data.documentId}-${Date.now()}`, // Unique job ID
        attempts: data.isReprocessing ? 1 : 3 // Single attempt for reprocessing
      });

      // Log job creation
      await this.logJobEvent(data.documentId, 'queued', {
        jobId: job.id,
        priority: data.priority,
        userId: data.userId
      });

      return job;
    } catch (error) {
      console.error('Failed to add document processing job:', error);
      throw new Error(`Queue job creation failed: ${error.message}`);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.documentQueue.getWaiting(),
        this.documentQueue.getActive(),
        this.documentQueue.getCompleted(),
        this.documentQueue.getFailed(),
        this.documentQueue.getDelayed()
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused: 0 // Bull.js doesn't have a getPaused method
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      throw new Error(`Queue stats retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get job status by document ID
   */
  async getJobStatus(documentId: string): Promise<any> {
    try {
      // Find jobs for this document
      const jobs = await this.documentQueue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, 100);
      const documentJobs = jobs.filter(job => job.data.documentId === documentId);

      if (documentJobs.length === 0) {
        return { status: 'not_found' };
      }

      // Get the most recent job
      const latestJob = documentJobs.sort((a, b) => b.timestamp - a.timestamp)[0];
      
      return {
        status: await latestJob.getState(),
        progress: latestJob.progress(),
        data: latestJob.data,
        opts: latestJob.opts,
        returnvalue: latestJob.returnvalue,
        failedReason: latestJob.failedReason,
        finishedOn: latestJob.finishedOn,
        processedOn: latestJob.processedOn
      };
    } catch (error) {
      console.error('Failed to get job status:', error);
      throw new Error(`Job status retrieval failed: ${error.message}`);
    }
  }

  /**
   * Cancel job by document ID
   */
  async cancelJob(documentId: string): Promise<boolean> {
    try {
      const jobs = await this.documentQueue.getJobs(['waiting', 'active', 'delayed'], 0, 100);
      const documentJobs = jobs.filter(job => job.data.documentId === documentId);

      let cancelled = false;
      for (const job of documentJobs) {
        await job.remove();
        cancelled = true;
      }

      if (cancelled) {
        await this.logJobEvent(documentId, 'cancelled', { reason: 'user_request' });
      }

      return cancelled;
    } catch (error) {
      console.error('Failed to cancel job:', error);
      throw new Error(`Job cancellation failed: ${error.message}`);
    }
  }

  /**
   * Retry failed job
   */
  async retryJob(documentId: string): Promise<Queue.Job<DocumentProcessingJobData> | null> {
    try {
      const jobs = await this.documentQueue.getJobs(['failed'], 0, 100);
      const failedJob = jobs.find(job => job.data.documentId === documentId);

      if (!failedJob) {
        return null;
      }

      // Create new job with retry flag
      const retryJobData: DocumentProcessingJobData = {
        ...failedJob.data,
        attempts: (failedJob.data.attempts || 0) + 1,
        metadata: {
          ...failedJob.data.metadata,
          retryOf: failedJob.id,
          retryAt: new Date().toISOString()
        }
      };

      const newJob = await this.addDocumentProcessingJob(retryJobData);
      
      // Remove the failed job
      await failedJob.remove();

      return newJob;
    } catch (error) {
      console.error('Failed to retry job:', error);
      throw new Error(`Job retry failed: ${error.message}`);
    }
  }

  // Worker methods
  private async processDocumentJob(job: Queue.Job<DocumentProcessingJobData>): Promise<JobResult> {
    const { documentId, userId, isReprocessing } = job.data;
    const startTime = Date.now();

    try {
      // Update job progress
      await job.progress(10);
      
      // Update document status
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'PROCESSING',
          extractionStatus: 'PROCESSING',
          indexingStatus: 'PROCESSING'
        }
      });

      await job.progress(20);

      // Process the document
      const result = await this.documentProcessor.processDocument(documentId);

      if (!result.success) {
        throw new Error(result.error || 'Document processing failed');
      }

      await job.progress(90);

      // Send notification to user
      await this.notificationQueue.add('send-notification', {
        type: 'document_processed',
        userId,
        documentId,
        success: true,
        metadata: {
          wordCount: result.wordCount,
          chunksCreated: result.chunks.length,
          processingTime: result.processingTime
        }
      });

      await job.progress(100);

      const processingTime = Date.now() - startTime;

      return {
        documentId,
        success: true,
        processingTime,
        extractedText: result.extractedText.substring(0, 1000), // Truncate for storage
        wordCount: result.wordCount,
        chunksCreated: result.chunks.length,
        completedAt: new Date()
      };

    } catch (error) {
      console.error(`Document processing job failed for ${documentId}:`, error);

      // Update document status to failed
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
          extractionStatus: 'FAILED',
          indexingStatus: 'FAILED'
        }
      });

      // Send failure notification
      await this.notificationQueue.add('send-notification', {
        type: 'document_failed',
        userId,
        documentId,
        success: false,
        error: error.message
      });

      throw error;
    }
  }

  private async cleanupFailedDocuments(job: Queue.Job): Promise<{ cleanedCount: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7); // Clean up failed documents older than 7 days

      const failedDocuments = await this.prisma.document.findMany({
        where: {
          status: 'FAILED',
          updatedAt: { lt: cutoffDate }
        }
      });

      let cleanedCount = 0;

      for (const doc of failedDocuments) {
        // Clean up S3 files
        if (doc.filePath) {
          try {
            await this.s3Service.deleteDocument(doc.filePath);
          } catch (s3Error) {
            console.warn(`Failed to delete S3 file for document ${doc.id}:`, s3Error);
          }
        }

        // Soft delete the document
        await this.prisma.document.update({
          where: { id: doc.id },
          data: { deletedAt: new Date() }
        });

        cleanedCount++;
      }

      return { cleanedCount };
    } catch (error) {
      console.error('Cleanup failed documents job failed:', error);
      throw error;
    }
  }

  private async cleanupOrphanedFiles(job: Queue.Job): Promise<{ cleanedFiles: number }> {
    try {
      // Get all S3 files
      const s3Files = await this.s3Service.listDocuments();
      
      // Get all document file paths from database
      const documents = await this.prisma.document.findMany({
        where: { deletedAt: null },
        select: { filePath: true }
      });

      const dbFilePaths = new Set(documents.map(doc => doc.filePath).filter(Boolean));
      let cleanedFiles = 0;

      // Find and delete orphaned files
      for (const file of s3Files.objects) {
        if (!dbFilePaths.has(file.key)) {
          try {
            await this.s3Service.deleteDocument(file.key);
            cleanedFiles++;
          } catch (deleteError) {
            console.warn(`Failed to delete orphaned file ${file.key}:`, deleteError);
          }
        }
      }

      return { cleanedFiles };
    } catch (error) {
      console.error('Cleanup orphaned files job failed:', error);
      throw error;
    }
  }

  private async sendNotification(job: Queue.Job): Promise<void> {
    const { type, userId, documentId, success, metadata, error } = job.data;

    try {
      // In a real implementation, this would send emails, push notifications, etc.
      console.log(`Sending notification: ${type} to user ${userId} for document ${documentId}`);
      
      // Log notification in database
      await this.logJobEvent(documentId, 'notification_sent', {
        notificationType: type,
        userId,
        success,
        error,
        metadata
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      throw notificationError;
    }
  }

  // Event handlers
  private async handleJobCompleted(job: Queue.Job<DocumentProcessingJobData>, result: JobResult): Promise<void> {
    await this.logJobEvent(job.data.documentId, 'completed', {
      jobId: job.id,
      processingTime: result.processingTime,
      wordCount: result.wordCount,
      chunksCreated: result.chunksCreated
    });
  }

  private async handleJobFailed(job: Queue.Job<DocumentProcessingJobData>, error: Error): Promise<void> {
    await this.logJobEvent(job.data.documentId, 'failed', {
      jobId: job.id,
      error: error.message,
      attempts: job.attemptsMade,
      failedAt: new Date().toISOString()
    });
  }

  private async updateJobProgress(job: Queue.Job<DocumentProcessingJobData>, progress: number): Promise<void> {
    // Could store progress in Redis or database for real-time updates
    await this.redis.setex(`job_progress:${job.data.documentId}`, 300, progress.toString());
  }

  private async handleJobStalled(job: Queue.Job<DocumentProcessingJobData>): Promise<void> {
    await this.logJobEvent(job.data.documentId, 'stalled', {
      jobId: job.id,
      stalledAt: new Date().toISOString()
    });
  }

  // Helper methods
  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'critical': return 100;
      case 'high': return 75;
      case 'normal': return 50;
      case 'low': return 25;
      default: return 50;
    }
  }

  private async logJobEvent(documentId: string, event: string, metadata: any): Promise<void> {
    try {
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          processingLogs: {
            push: {
              timestamp: new Date(),
              level: 'info',
              event,
              metadata
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to log job event:', error);
    }
  }

  /**
   * Schedule recurring jobs
   */
  async scheduleRecurringJobs(): Promise<void> {
    try {
      // Daily cleanup of failed documents
      await this.cleanupQueue.add('cleanup-failed', {}, {
        repeat: { cron: '0 2 * * *' }, // 2 AM daily
        jobId: 'daily-cleanup-failed'
      });

      // Weekly cleanup of orphaned files
      await this.cleanupQueue.add('cleanup-orphaned', {}, {
        repeat: { cron: '0 3 * * 0' }, // 3 AM Sunday
        jobId: 'weekly-cleanup-orphaned'
      });

      console.log('Recurring jobs scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule recurring jobs:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await Promise.all([
        this.documentQueue.close(),
        this.cleanupQueue.close(),
        this.notificationQueue.close()
      ]);
      
      await this.redis.disconnect();
      console.log('Queue manager shut down gracefully');
    } catch (error) {
      console.error('Error during queue manager shutdown:', error);
      throw error;
    }
  }
}

export default QueueManager;