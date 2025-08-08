/**
 * AgriAI S3 Service
 * 
 * Service per gestire tutte le operazioni AWS S3:
 * - Upload documenti con struttura organizzata
 * - Download file per processing
 * - Gestione permessi e sicurezza
 * - Cleanup e lifecycle management
 * - Pre-signed URLs per accesso diretto
 */

import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetObjectAttributesCommand,
  CopyObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';
import { Readable } from 'stream';

interface UploadOptions {
  metadata?: Record<string, string>;
  contentType?: string;
  cacheControl?: string;
  storageClass?: 'STANDARD' | 'STANDARD_IA' | 'GLACIER' | 'DEEP_ARCHIVE';
  serverSideEncryption?: 'AES256' | 'aws:kms';
}

interface UploadResult {
  key: string;
  etag: string;
  versionId?: string;
  size: number;
  checksum: string;
  url: string;
}

interface DownloadResult {
  body: Readable;
  contentType: string;
  contentLength: number;
  lastModified: Date;
  etag: string;
  metadata: Record<string, string>;
}

interface ListResult {
  objects: Array<{
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
    storageClass: string;
  }>;
  nextToken?: string;
  totalCount: number;
}

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || 'agriai-documents';
    this.region = process.env.AWS_REGION || 'eu-west-1';
    
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
  }

  /**
   * Upload document con struttura organizzata
   */
  async uploadDocument(
    documentId: string,
    file: Buffer | Readable,
    mimeType: string,
    originalFilename: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Generate organized S3 key
      const fileExtension = path.extname(originalFilename);
      const sanitizedFilename = this.sanitizeFilename(originalFilename);
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      const s3Key = `documents/${year}/${month}/${documentId}/${sanitizedFilename}`;

      // Calculate checksum
      const buffer = file instanceof Buffer ? file : await this.streamToBuffer(file as Readable);
      const checksum = this.calculateChecksum(buffer);

      // Prepare upload parameters
      const uploadParams = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          documentId,
          originalFilename,
          checksum,
          uploadDate: new Date().toISOString(),
          ...options.metadata
        },
        CacheControl: options.cacheControl || 'max-age=86400',
        StorageClass: options.storageClass || 'STANDARD',
        ServerSideEncryption: options.serverSideEncryption || 'AES256'
      };

      // Handle large files with multipart upload
      if (buffer.length > 100 * 1024 * 1024) { // 100MB
        return await this.multipartUpload(uploadParams, buffer);
      }

      // Standard upload for smaller files
      const command = new PutObjectCommand(uploadParams);
      const result = await this.s3Client.send(command);

      const url = this.getPublicUrl(s3Key);

      return {
        key: s3Key,
        etag: result.ETag!,
        versionId: result.VersionId,
        size: buffer.length,
        checksum,
        url
      };

    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Download document da S3
   */
  async downloadDocument(key: string): Promise<DownloadResult> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const result = await this.s3Client.send(command);

      if (!result.Body) {
        throw new Error('Document body is empty');
      }

      return {
        body: result.Body as Readable,
        contentType: result.ContentType || 'application/octet-stream',
        contentLength: result.ContentLength || 0,
        lastModified: result.LastModified || new Date(),
        etag: result.ETag || '',
        metadata: result.Metadata || {}
      };

    } catch (error) {
      console.error('S3 download error:', error);
      throw new Error(`S3 download failed: ${error.message}`);
    }
  }

  /**
   * Download document come Buffer
   */
  async downloadDocumentAsBuffer(key: string): Promise<Buffer> {
    const download = await this.downloadDocument(key);
    return await this.streamToBuffer(download.body);
  }

  /**
   * Verifica esistenza documento
   */
  async documentExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Elimina documento da S3
   */
  async deleteDocument(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  /**
   * Lista documenti con filtri
   */
  async listDocuments(
    prefix: string = 'documents/',
    maxKeys: number = 1000,
    continuationToken?: string
  ): Promise<ListResult> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken
      });

      const result = await this.s3Client.send(command);

      return {
        objects: (result.Contents || []).map(obj => ({
          key: obj.Key!,
          size: obj.Size || 0,
          lastModified: obj.LastModified || new Date(),
          etag: obj.ETag || '',
          storageClass: obj.StorageClass || 'STANDARD'
        })),
        nextToken: result.NextContinuationToken,
        totalCount: result.KeyCount || 0
      };

    } catch (error) {
      console.error('S3 list error:', error);
      throw new Error(`S3 list failed: ${error.message}`);
    }
  }

  /**
   * Genera pre-signed URL per accesso temporaneo
   */
  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600 // 1 hour
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Pre-signed URL error:', error);
      throw new Error(`Failed to generate pre-signed URL: ${error.message}`);
    }
  }

  /**
   * Genera pre-signed URL per upload diretto
   */
  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<{ url: string; fields: Record<string, string> }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      return {
        url,
        fields: {
          'Content-Type': contentType
        }
      };
    } catch (error) {
      console.error('Pre-signed upload URL error:', error);
      throw new Error(`Failed to generate pre-signed upload URL: ${error.message}`);
    }
  }

  /**
   * Ottieni metadati documento
   */
  async getDocumentMetadata(key: string): Promise<Record<string, any>> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const result = await this.s3Client.send(command);

      return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata,
        storageClass: result.StorageClass,
        serverSideEncryption: result.ServerSideEncryption
      };
    } catch (error) {
      console.error('Get metadata error:', error);
      throw new Error(`Failed to get document metadata: ${error.message}`);
    }
  }

  /**
   * Copia documento
   */
  async copyDocument(sourceKey: string, destKey: string): Promise<void> {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucketName,
        Key: destKey,
        CopySource: `${this.bucketName}/${sourceKey}`
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('S3 copy error:', error);
      throw new Error(`S3 copy failed: ${error.message}`);
    }
  }

  /**
   * Sposta documento (copia + elimina originale)
   */
  async moveDocument(sourceKey: string, destKey: string): Promise<void> {
    await this.copyDocument(sourceKey, destKey);
    await this.deleteDocument(sourceKey);
  }

  /**
   * Cleanup documenti orfani o vecchi
   */
  async cleanupOrphanedDocuments(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const listResult = await this.listDocuments();
      let deletedCount = 0;

      for (const obj of listResult.objects) {
        if (obj.lastModified < cutoffDate) {
          // Additional check to ensure document is truly orphaned
          // This would require database query to verify document still exists
          await this.deleteDocument(obj.key);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Cleanup error:', error);
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }

  // Helper methods
  private async multipartUpload(uploadParams: any, buffer: Buffer): Promise<UploadResult> {
    const partSize = 100 * 1024 * 1024; // 100MB parts
    const parts = [];
    
    // Initiate multipart upload
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: uploadParams.Bucket,
      Key: uploadParams.Key,
      ContentType: uploadParams.ContentType,
      Metadata: uploadParams.Metadata
    });

    const createResult = await this.s3Client.send(createCommand);
    const uploadId = createResult.UploadId!;

    try {
      // Upload parts
      const totalParts = Math.ceil(buffer.length / partSize);
      
      for (let i = 0; i < totalParts; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, buffer.length);
        const partBuffer = buffer.slice(start, end);

        const uploadPartCommand = new UploadPartCommand({
          Bucket: uploadParams.Bucket,
          Key: uploadParams.Key,
          PartNumber: i + 1,
          UploadId: uploadId,
          Body: partBuffer
        });

        const partResult = await this.s3Client.send(uploadPartCommand);
        parts.push({
          ETag: partResult.ETag!,
          PartNumber: i + 1
        });
      }

      // Complete multipart upload
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: uploadParams.Bucket,
        Key: uploadParams.Key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts }
      });

      const result = await this.s3Client.send(completeCommand);

      return {
        key: uploadParams.Key,
        etag: result.ETag!,
        versionId: result.VersionId,
        size: buffer.length,
        checksum: this.calculateChecksum(buffer),
        url: this.getPublicUrl(uploadParams.Key)
      };

    } catch (error) {
      // Abort multipart upload on error
      const abortCommand = new AbortMultipartUploadCommand({
        Bucket: uploadParams.Bucket,
        Key: uploadParams.Key,
        UploadId: uploadId
      });

      await this.s3Client.send(abortCommand);
      throw error;
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }

  calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  private getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Get bucket information
   */
  async getBucketInfo(): Promise<{
    name: string;
    region: string;
    totalObjects: number;
    totalSize: number;
  }> {
    try {
      const listResult = await this.listDocuments('', 1000);
      
      const totalSize = listResult.objects.reduce((sum, obj) => sum + obj.size, 0);

      return {
        name: this.bucketName,
        region: this.region,
        totalObjects: listResult.totalCount,
        totalSize
      };
    } catch (error) {
      console.error('Get bucket info error:', error);
      throw new Error(`Failed to get bucket info: ${error.message}`);
    }
  }

  /**
   * Test S3 connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.listDocuments('', 1);
      return true;
    } catch (error) {
      console.error('S3 connection test failed:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalObjects: number;
    totalSize: number;
    bucketName: string;
    region: string;
  }> {
    try {
      const bucketInfo = await this.getBucketInfo();
      return {
        totalObjects: bucketInfo.totalObjects,
        totalSize: bucketInfo.totalSize,
        bucketName: bucketInfo.name,
        region: bucketInfo.region
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalObjects: 0,
        totalSize: 0,
        bucketName: this.bucketName,
        region: this.region
      };
    }
  }
}

export default S3Service;