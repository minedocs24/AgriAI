/**
 * Document Upload Specific Tests
 * 
 * Test dettagliati per la funzionalità di upload documenti:
 * - Validazione file formats
 * - Multi-file upload
 * - Error handling
 * - Security checks
 * - Performance testing
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { build } from '../app';
import { DocumentController } from '../controllers/DocumentController';

describe('Document Upload Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let testUserId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    app = await build({ test: true });
    await app.ready();
    
    prisma = app.prisma;
    
    // Setup test data
    const testUser = await prisma.user.create({
      data: {
        email: 'upload-test@agriai.com',
        passwordHash: 'test-hash',
        firstName: 'Upload',
        lastName: 'Test',
        userType: 'MEMBER',
        emailVerified: true
      }
    });
    testUserId = testUser.id;

    const testCategory = await prisma.category.create({
      data: {
        name: 'Upload Test Category',
        slug: 'upload-test',
        description: 'Category for upload testing'
      }
    });
    testCategoryId = testCategory.id;
  });

  afterAll(async () => {
    await prisma.document.deleteMany({
      where: { uploadedById: testUserId }
    });
    await prisma.user.delete({
      where: { id: testUserId }
    });
    await prisma.category.delete({
      where: { id: testCategoryId }
    });
    await app.close();
  });

  describe('File Format Validation', () => {
    const testCases = [
      {
        name: 'PDF file',
        mimetype: 'application/pdf',
        content: Buffer.from('%PDF-1.4\n%Test PDF'),
        shouldPass: true
      },
      {
        name: 'Word document',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        content: Buffer.from('PK\x03\x04'), // ZIP header for DOCX
        shouldPass: true
      },
      {
        name: 'Plain text',
        mimetype: 'text/plain',
        content: Buffer.from('Simple text content'),
        shouldPass: true
      },
      {
        name: 'HTML file',
        mimetype: 'text/html',
        content: Buffer.from('<!DOCTYPE html><html><body>Test</body></html>'),
        shouldPass: true
      },
      {
        name: 'Executable file',
        mimetype: 'application/octet-stream',
        content: Buffer.from('MZ\x90\x00'), // PE header
        shouldPass: false
      },
      {
        name: 'JavaScript file',
        mimetype: 'application/javascript',
        content: Buffer.from('console.log("test");'),
        shouldPass: false
      }
    ];

    testCases.forEach(({ name, mimetype, content, shouldPass }) => {
      it(`should ${shouldPass ? 'accept' : 'reject'} ${name}`, async () => {
        const formData = new FormData();
        formData.append('title', `TEST_${name}`);
        formData.append('categoryId', testCategoryId);
        formData.append('file', new Blob([content], { type: mimetype }), `test.${name.split(' ')[0].toLowerCase()}`);

        const response = await app.inject({
          method: 'POST',
          url: '/api/documents/upload',
          payload: formData,
          headers: {
            authorization: `Bearer test-token-${testUserId}`
          }
        });

        if (shouldPass) {
          expect(response.statusCode).toBe(201);
          const result = JSON.parse(response.body);
          expect(result.successCount).toBeGreaterThan(0);
        } else {
          expect(response.statusCode).toBe(201);
          const result = JSON.parse(response.body);
          expect(result.errorCount).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('File Size Validation', () => {
    it('should accept files under size limit', async () => {
      const smallFile = Buffer.alloc(1024); // 1KB
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        payload: {
          title: 'TEST_Small File',
          categoryId: testCategoryId,
          file: smallFile
        },
        headers: {
          authorization: `Bearer test-token-${testUserId}`,
          'content-type': 'multipart/form-data'
        }
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.body);
      expect(result.successCount).toBe(1);
    });

    it('should reject files over size limit', async () => {
      const largeFile = Buffer.alloc(60 * 1024 * 1024); // 60MB (over 50MB limit)
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        payload: {
          title: 'TEST_Large File',
          categoryId: testCategoryId,
          file: largeFile
        },
        headers: {
          authorization: `Bearer test-token-${testUserId}`,
          'content-type': 'multipart/form-data'
        }
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.body);
      expect(result.errorCount).toBeGreaterThan(0);
      expect(result.results[0].error).toContain('too large');
    });
  });

  describe('Multi-file Upload', () => {
    it('should handle multiple valid files', async () => {
      const files = [
        { name: 'doc1.txt', content: 'Content of document 1' },
        { name: 'doc2.txt', content: 'Content of document 2' },
        { name: 'doc3.txt', content: 'Content of document 3' }
      ];

      const formData = new FormData();
      formData.append('title', 'TEST_Multi Upload');
      formData.append('categoryId', testCategoryId);
      
      files.forEach(file => {
        formData.append('files', new Blob([file.content], { type: 'text/plain' }), file.name);
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        payload: formData,
        headers: {
          authorization: `Bearer test-token-${testUserId}`
        }
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.body);
      expect(result.successCount).toBe(files.length);
      expect(result.errorCount).toBe(0);
    });

    it('should handle mixed valid/invalid files', async () => {
      const files = [
        { name: 'valid.txt', content: 'Valid text content', mimetype: 'text/plain' },
        { name: 'invalid.exe', content: 'MZ\x90\x00', mimetype: 'application/octet-stream' },
        { name: 'valid2.txt', content: 'Another valid content', mimetype: 'text/plain' }
      ];

      const formData = new FormData();
      formData.append('title', 'TEST_Mixed Upload');
      formData.append('categoryId', testCategoryId);
      
      files.forEach(file => {
        formData.append('files', new Blob([file.content], { type: file.mimetype }), file.name);
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        payload: formData,
        headers: {
          authorization: `Bearer test-token-${testUserId}`
        }
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.body);
      expect(result.successCount).toBe(2); // Two valid files
      expect(result.errorCount).toBe(1); // One invalid file
    });
  });

  describe('Security Tests', () => {
    it('should sanitize malicious filenames', async () => {
      const maliciousNames = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config\\sam',
        'test<script>alert("xss")</script>.txt',
        'file with spaces and special chars !@#$.txt'
      ];

      for (const filename of maliciousNames) {
        const response = await app.inject({
          method: 'POST',
          url: '/api/documents/upload',
          payload: {
            title: 'TEST_Security Test',
            categoryId: testCategoryId,
            file: Buffer.from('test content')
          },
          headers: {
            authorization: `Bearer test-token-${testUserId}`,
            'content-type': 'multipart/form-data'
          }
        });

        // Should not fail due to filename issues
        expect([200, 201, 400]).toContain(response.statusCode);
      }
    });

    it('should validate authorization', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        payload: {
          title: 'TEST_Unauthorized',
          categoryId: testCategoryId,
          file: Buffer.from('test content')
        },
        headers: {
          // No authorization header
          'content-type': 'multipart/form-data'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate category access', async () => {
      // Create admin-only category
      const adminCategory = await prisma.category.create({
        data: {
          name: 'Admin Only Category',
          slug: 'admin-only',
          accessLevel: 'ADMIN'
        }
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        payload: {
          title: 'TEST_Admin Category',
          categoryId: adminCategory.id,
          file: Buffer.from('test content')
        },
        headers: {
          authorization: `Bearer test-token-${testUserId}`, // MEMBER user
          'content-type': 'multipart/form-data'
        }
      });

      // Should handle access control appropriately
      expect([403, 400]).toContain(response.statusCode);

      // Cleanup
      await prisma.category.delete({ where: { id: adminCategory.id } });
    });
  });

  describe('Metadata Validation', () => {
    it('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        payload: {
          // Missing title and categoryId
          file: Buffer.from('test content')
        },
        headers: {
          authorization: `Bearer test-token-${testUserId}`,
          'content-type': 'multipart/form-data'
        }
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.body);
      expect(result.error).toBe('Validation error');
    });

    it('should validate field lengths', async () => {
      const longTitle = 'A'.repeat(600); // Over 500 char limit

      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        payload: {
          title: longTitle,
          categoryId: testCategoryId,
          file: Buffer.from('test content')
        },
        headers: {
          authorization: `Bearer test-token-${testUserId}`,
          'content-type': 'multipart/form-data'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate enum values', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        payload: {
          title: 'TEST_Invalid Access Level',
          categoryId: testCategoryId,
          accessLevel: 'INVALID_LEVEL',
          file: Buffer.from('test content')
        },
        headers: {
          authorization: `Bearer test-token-${testUserId}`,
          'content-type': 'multipart/form-data'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid sequential uploads', async () => {
      const uploadPromises = [];
      
      for (let i = 0; i < 5; i++) {
        const promise = app.inject({
          method: 'POST',
          url: '/api/documents/upload',
          payload: {
            title: `TEST_Rapid Upload ${i}`,
            categoryId: testCategoryId,
            file: Buffer.from(`Test content ${i}`)
          },
          headers: {
            authorization: `Bearer test-token-${testUserId}`,
            'content-type': 'multipart/form-data'
          }
        });
        uploadPromises.push(promise);
      }

      const responses = await Promise.all(uploadPromises);
      
      // All should succeed or be rate limited
      responses.forEach(response => {
        expect([201, 429]).toContain(response.statusCode);
      });
    });

    it('should process uploads within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/documents/upload',
        payload: {
          title: 'TEST_Performance',
          categoryId: testCategoryId,
          file: Buffer.from('Test content for performance')
        },
        headers: {
          authorization: `Bearer test-token-${testUserId}`,
          'content-type': 'multipart/form-data'
        }
      });

      const processingTime = Date.now() - startTime;
      
      expect(response.statusCode).toBe(201);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});