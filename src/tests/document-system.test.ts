/**
 * AgriAI Document System Tests
 * 
 * Test completi per il sistema di gestione documenti:
 * - Upload multi-file con validazione
 * - Processing asincrono e estrazione testo
 * - Search semantico e tradizionale
 * - Queue management e error handling
 * - S3 integration e file management
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { build } from '../app';
import { DocumentController } from '../controllers/DocumentController';
import { S3Service } from '../services/S3Service';
import { DocumentProcessor } from '../services/DocumentProcessor';
import { QueueManager } from '../queue/documentQueue';
import fs from 'fs';
import path from 'path';

describe('Document System Integration Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let s3Service: S3Service;
  let documentProcessor: DocumentProcessor;
  let queueManager: QueueManager;
  let testUserId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    // Initialize test app and services
    app = await build({ test: true });
    await app.ready();
    
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/agriai_test'
        }
      }
    });

    s3Service = new S3Service();
    documentProcessor = new DocumentProcessor(prisma);
    queueManager = new QueueManager(prisma);

    // Create test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
    await prisma.$disconnect();
    await queueManager.shutdown();
  });

  beforeEach(async () => {
    // Clean up any test documents before each test
    await prisma.document.deleteMany({
      where: {
        title: { startsWith: 'TEST_' }
      }
    });
  });

  async function setupTestData() {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@agriai.com',
        passwordHash: 'test-hash',
        firstName: 'Test',
        lastName: 'User',
        userType: 'ADMIN',
        emailVerified: true
      }
    });
    testUserId = testUser.id;

    // Create test category
    const testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Category for testing',
        accessLevel: 'PUBLIC'
      }
    });
    testCategoryId = testCategory.id;
  }

  async function cleanupTestData() {
    // Clean up test data
    await prisma.document.deleteMany({
      where: { uploadedById: testUserId }
    });
    await prisma.user.delete({
      where: { id: testUserId }
    });
    await prisma.category.delete({
      where: { id: testCategoryId }
    });
  }

  describe('Document Upload', () => {
    it('should successfully upload a PDF document', async () => {
      // Create test PDF buffer
      const testPdfContent = Buffer.from('%PDF-1.4\nTest PDF content for AgriAI system');
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        payload: {
          title: 'TEST_Sample PDF Document',
          description: 'Test PDF upload',
          categoryId: testCategoryId,
          author: 'Test Author',
          accessLevel: 'PUBLIC',
          priority: 'normal'
        },
        headers: {
          authorization: `Bearer ${generateTestToken(testUserId)}`,
          'content-type': 'multipart/form-data'
        }
      });

      expect(response.statusCode).toBe(201);
      
      const result = JSON.parse(response.body);
      expect(result.message).toBe('Upload completed');
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(0);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].document).toHaveProperty('id');
      expect(result.results[0].document.status).toBe('PROCESSING');
    });

    it('should reject unsupported file types', async () => {
      const testExecutableContent = Buffer.from('MZ\x90\x00'); // PE executable header
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        payload: {
          title: 'TEST_Malicious File',
          categoryId: testCategoryId
        },
        headers: {
          authorization: `Bearer ${generateTestToken(testUserId)}`,
          'content-type': 'multipart/form-data'
        }
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.body);
      expect(result.errorCount).toBeGreaterThan(0);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toContain('Unsupported file type');
    });

    it('should handle multiple file uploads', async () => {
      const files = [
        { name: 'test1.txt', content: 'Test document 1 content' },
        { name: 'test2.txt', content: 'Test document 2 content' }
      ];
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        payload: {
          title: 'TEST_Multiple Files',
          categoryId: testCategoryId
        },
        headers: {
          authorization: `Bearer ${generateTestToken(testUserId)}`,
          'content-type': 'multipart/form-data'
        }
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.body);
      expect(result.successCount).toBe(files.length);
    });
  });

  describe('Document Processing', () => {
    let testDocumentId: string;

    beforeEach(async () => {
      // Create a test document for processing
      const document = await prisma.document.create({
        data: {
          title: 'TEST_Processing Document',
          description: 'Document for processing tests',
          contentType: 'FILE',
          categoryId: testCategoryId,
          uploadedById: testUserId,
          status: 'PROCESSING',
          extractionStatus: 'PENDING',
          indexingStatus: 'PENDING',
          fileMimeType: 'text/plain',
          filePath: 'test/path/document.txt'
        }
      });
      testDocumentId = document.id;
    });

    it('should extract text from document', async () => {
      // Mock S3 service to return test content
      jest.spyOn(s3Service, 'downloadDocumentAsBuffer').mockResolvedValue(
        Buffer.from('This is test content for text extraction. It contains important agricultural information about PAC policies and sustainable farming practices.')
      );

      const result = await documentProcessor.processDocument(testDocumentId);

      expect(result.success).toBe(true);
      expect(result.extractedText).toBeTruthy();
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.chunks.length).toBeGreaterThan(0);
      expect(result.analysis).toHaveProperty('summary');
      expect(result.analysis).toHaveProperty('keywords');
    });

    it('should create RAG-optimized chunks', async () => {
      const longText = 'This is a very long document about agricultural policies. '.repeat(100);
      
      jest.spyOn(s3Service, 'downloadDocumentAsBuffer').mockResolvedValue(
        Buffer.from(longText)
      );

      const result = await documentProcessor.processDocument(testDocumentId);

      expect(result.success).toBe(true);
      expect(result.chunks.length).toBeGreaterThan(1);
      
      // Check chunk properties
      result.chunks.forEach(chunk => {
        expect(chunk).toHaveProperty('chunkIndex');
        expect(chunk).toHaveProperty('text');
        expect(chunk).toHaveProperty('startChar');
        expect(chunk).toHaveProperty('endChar');
        expect(chunk).toHaveProperty('tokenCount');
        expect(chunk.text.length).toBeLessThanOrEqual(1200); // Max chunk size with overlap
      });
    });

    it('should handle processing errors gracefully', async () => {
      // Mock S3 service to throw error
      jest.spyOn(s3Service, 'downloadDocumentAsBuffer').mockRejectedValue(
        new Error('S3 download failed')
      );

      const result = await documentProcessor.processDocument(testDocumentId);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      
      // Check document status in database
      const document = await prisma.document.findUnique({
        where: { id: testDocumentId }
      });
      expect(document?.status).toBe('FAILED');
    });
  });

  describe('Document Search', () => {
    let searchTestDocs: string[] = [];

    beforeAll(async () => {
      // Create test documents for search
      const docs = [
        {
          title: 'TEST_PAC Policy Document',
          content: 'This document explains the Common Agricultural Policy (PAC) and its implementation in Italy.',
          keywords: ['pac', 'policy', 'agriculture']
        },
        {
          title: 'TEST_Sustainable Farming Guide',
          content: 'Guide to sustainable farming practices and organic certification processes.',
          keywords: ['sustainable', 'organic', 'farming']
        },
        {
          title: 'TEST_IoT in Agriculture',
          content: 'Internet of Things applications for modern agricultural monitoring and automation.',
          keywords: ['iot', 'technology', 'monitoring']
        }
      ];

      for (const docData of docs) {
        const doc = await prisma.document.create({
          data: {
            title: docData.title,
            description: docData.content,
            contentType: 'TEXT',
            categoryId: testCategoryId,
            uploadedById: testUserId,
            status: 'PUBLISHED',
            extractionStatus: 'COMPLETED',
            indexingStatus: 'COMPLETED',
            contentExtracted: docData.content,
            wordCount: docData.content.split(' ').length,
            accessLevel: 'PUBLIC'
          }
        });
        searchTestDocs.push(doc.id);

        // Create mock embeddings for semantic search
        await prisma.documentEmbedding.create({
          data: {
            documentId: doc.id,
            chunkIndex: 0,
            chunkText: docData.content,
            embeddingModel: 'test-model',
            tokenCount: docData.content.split(' ').length
          }
        });
      }
    });

    afterAll(async () => {
      // Clean up search test docs
      await prisma.documentEmbedding.deleteMany({
        where: { documentId: { in: searchTestDocs } }
      });
      await prisma.document.deleteMany({
        where: { id: { in: searchTestDocs } }
      });
    });

    it('should perform traditional text search', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=agriculture&semantic=false',
        headers: {
          authorization: `Bearer ${generateTestToken(testUserId)}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.searchType).toBe('fulltext');
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0]).toHaveProperty('title');
      expect(result.results[0]).toHaveProperty('category');
    });

    it('should perform semantic search', async () => {
      // Mock the semantic search to return test results
      jest.spyOn(documentProcessor, 'semanticSearch').mockResolvedValue([
        {
          document: {
            id: searchTestDocs[0],
            title: 'TEST_PAC Policy Document',
            description: 'PAC policy content',
            category: { name: 'Test Category' },
            author: 'Test Author',
            publishedAt: new Date()
          },
          chunk: {
            chunkIndex: 0,
            text: 'This document explains the Common Agricultural Policy',
            startChar: 0,
            endChar: 50,
            tokenCount: 10,
            metadata: {}
          },
          similarity: 0.85,
          relevantSection: 'Common Agricultural Policy implementation',
          context: 'This document explains the Common Agricultural Policy...'
        }
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=agricultural policy&semantic=true',
        headers: {
          authorization: `Bearer ${generateTestToken(testUserId)}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.searchType).toBe('semantic');
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0]).toHaveProperty('similarity');
      expect(result.results[0]).toHaveProperty('relevantSection');
    });

    it('should filter search results by category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/documents/search?query=farming&categories[]=${testCategoryId}`,
        headers: {
          authorization: `Bearer ${generateTestToken(testUserId)}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.results.every((doc: any) => doc.category?.id === testCategoryId)).toBe(true);
    });
  });

  describe('Queue Management', () => {
    it('should add job to processing queue', async () => {
      const job = await queueManager.addDocumentProcessingJob({
        documentId: 'test-doc-id',
        priority: 'normal',
        userId: testUserId
      });

      expect(job).toBeTruthy();
      expect(job.data.documentId).toBe('test-doc-id');
      expect(job.data.priority).toBe('normal');
    });

    it('should get queue statistics', async () => {
      const stats = await queueManager.getQueueStats();

      expect(stats).toHaveProperty('waiting');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(typeof stats.waiting).toBe('number');
    });

    it('should handle job prioritization', async () => {
      // Add jobs with different priorities
      const lowPriorityJob = await queueManager.addDocumentProcessingJob({
        documentId: 'low-priority',
        priority: 'low',
        userId: testUserId
      });

      const highPriorityJob = await queueManager.addDocumentProcessingJob({
        documentId: 'high-priority',
        priority: 'high',
        userId: testUserId
      });

      // High priority job should have higher priority value
      expect(highPriorityJob.opts.priority).toBeGreaterThan(lowPriorityJob.opts.priority!);
    });
  });

  describe('S3 Integration', () => {
    it('should test S3 connection', async () => {
      const isConnected = await s3Service.testConnection();
      expect(typeof isConnected).toBe('boolean');
    });

    it('should upload and download files', async () => {
      const testContent = Buffer.from('Test file content for S3 integration');
      const documentId = 'test-s3-doc';
      const filename = 'test-file.txt';

      // Skip if S3 is not configured for tests
      if (!process.env.AWS_S3_BUCKET) {
        console.log('Skipping S3 test - no bucket configured');
        return;
      }

      // Upload
      const uploadResult = await s3Service.uploadDocument(
        documentId,
        testContent,
        'text/plain',
        filename
      );

      expect(uploadResult).toHaveProperty('key');
      expect(uploadResult).toHaveProperty('etag');
      expect(uploadResult).toHaveProperty('size');
      expect(uploadResult.size).toBe(testContent.length);

      // Download
      const downloadResult = await s3Service.downloadDocumentAsBuffer(uploadResult.key);
      expect(downloadResult.toString()).toBe(testContent.toString());

      // Cleanup
      await s3Service.deleteDocument(uploadResult.key);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid document IDs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/invalid-uuid',
        headers: {
          authorization: `Bearer ${generateTestToken(testUserId)}`
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle unauthorized access', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate upload parameters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        payload: {
          // Missing required fields
        },
        headers: {
          authorization: `Bearer ${generateTestToken(testUserId)}`
        }
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.body);
      expect(result.error).toBe('Validation error');
    });
  });

  // Helper functions
  function generateTestToken(userId: string): string {
    // In a real test environment, generate a proper JWT token
    return `test-token-${userId}`;
  }
});