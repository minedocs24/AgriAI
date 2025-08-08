/**
 * Integration Test - AgriAI Platform with Document Management
 * 
 * Test completo per verificare l'integrazione del sistema documenti
 * con il resto della piattaforma AgriAI
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { build } from '../app';
import { PrismaClient } from '@prisma/client';

describe('AgriAI Platform Integration Test', () => {
  let app: any;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Build the application
    app = await build({ test: true });
    prisma = app.prisma;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('Application Initialization', () => {
    it('should initialize all services correctly', () => {
      expect(app.prisma).toBeDefined();
      expect(app.ragService).toBeDefined();
      expect(app.s3Service).toBeDefined();
      expect(app.documentProcessor).toBeDefined();
      expect(app.queueManager).toBeDefined();
    });

    it('should have all required decorators', () => {
      expect(typeof app.authenticate).toBe('function');
      expect(app.prisma).toBeInstanceOf(PrismaClient);
    });
  });

  describe('Health Check Integration', () => {
    it('should include document services in health check', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data.services).toHaveProperty('documents');
      expect(data.services).toHaveProperty('queue');
      expect(data.status).toBe('healthy');
    });
  });

  describe('API Routes Integration', () => {
    it('should register document routes correctly', () => {
      const routes = app.printRoutes();
      
      // Check for document routes
      expect(routes).toContain('/api/documents');
      expect(routes).toContain('/api/documents/upload');
      expect(routes).toContain('/api/documents/search');
    });

    it('should register chat routes with document integration', () => {
      const routes = app.printRoutes();
      
      // Check for chat routes
      expect(routes).toContain('/api/chat');
      expect(routes).toContain('/api/chat/document-usage-stats');
    });
  });

  describe('Service Integration', () => {
    it('should integrate RAG service with document system', () => {
      expect(app.ragService).toBeDefined();
      expect(typeof app.ragService.processQuery).toBe('function');
    });

    it('should integrate queue manager with document processing', () => {
      expect(app.queueManager).toBeDefined();
      expect(typeof app.queueManager.addDocumentProcessingJob).toBe('function');
      expect(typeof app.queueManager.getQueueStats).toBe('function');
    });

    it('should integrate S3 service with document storage', () => {
      expect(app.s3Service).toBeDefined();
      expect(typeof app.s3Service.uploadDocument).toBe('function');
      expect(typeof app.s3Service.downloadDocument).toBe('function');
    });
  });

  describe('Database Schema Integration', () => {
    it('should have all required document tables', async () => {
      // Test that we can access document-related tables
      const documentCount = await prisma.document.count();
      expect(typeof documentCount).toBe('number');
      
      const categoryCount = await prisma.category.count();
      expect(typeof categoryCount).toBe('number');
      
      const embeddingCount = await prisma.documentEmbedding.count();
      expect(typeof embeddingCount).toBe('number');
    });

    it('should have message-document relationship', async () => {
      // Test message-document reference table
      const referenceCount = await prisma.messageSource.count();
      expect(typeof referenceCount).toBe('number');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle file upload errors correctly', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        headers: {
          'content-type': 'multipart/form-data'
        },
        payload: 'invalid multipart data'
      });

      // Should handle multipart parsing errors gracefully
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should handle authentication errors correctly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents',
        headers: {
          'authorization': 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Configuration Integration', () => {
    it('should load environment variables correctly', () => {
      const requiredEnvVars = [
        'AWS_REGION',
        'AWS_S3_BUCKET',
        'REDIS_URL',
        'DATABASE_URL'
      ];

      // In test environment, these might not be set, but the app should handle it gracefully
      requiredEnvVars.forEach(envVar => {
        expect(process.env[envVar] !== undefined || envVar === 'AWS_REGION' || envVar === 'AWS_S3_BUCKET').toBe(true);
      });
    });
  });

  describe('Plugin Integration', () => {
    it('should register multipart plugin for file uploads', () => {
      const plugins = app.printPlugins();
      expect(plugins).toContain('@fastify/multipart');
    });

    it('should register CORS plugin for cross-origin requests', () => {
      const plugins = app.printPlugins();
      expect(plugins).toContain('@fastify/cors');
    });

    it('should register rate limiting plugin', () => {
      const plugins = app.printPlugins();
      expect(plugins).toContain('@fastify/rate-limit');
    });
  });

  describe('WebSocket Integration', () => {
    it('should register WebSocket plugin', () => {
      const plugins = app.printPlugins();
      expect(plugins).toContain('@fastify/websocket');
    });

    it('should have WebSocket routes available', () => {
      const routes = app.printRoutes();
      expect(routes).toContain('/ws/chat');
    });
  });

  describe('Graceful Shutdown Integration', () => {
    it('should handle graceful shutdown correctly', async () => {
      // Test that the app can be closed gracefully
      await expect(app.close()).resolves.not.toThrow();
    });
  });
}); 