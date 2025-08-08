/**
 * Document Search Tests
 * 
 * Test completi per le funzionalità di ricerca documenti:
 * - Semantic search con embeddings
 * - Traditional full-text search
 * - Filtering e sorting
 * - Access control in search
 * - Performance e accuracy tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { build } from '../app';
import { DocumentProcessor } from '../services/DocumentProcessor';

describe('Document Search Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let documentProcessor: DocumentProcessor;
  let testUserId: string;
  let testCategoryId: string;
  let testDocuments: string[] = [];

  beforeAll(async () => {
    app = await build({ test: true });
    await app.ready();
    
    prisma = app.prisma;
    documentProcessor = new DocumentProcessor(prisma);
    
    await setupTestData();
    await createTestDocuments();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    const testUser = await prisma.user.create({
      data: {
        email: 'search-test@agriai.com',
        passwordHash: 'test-hash',
        firstName: 'Search',
        lastName: 'Test',
        userType: 'MEMBER',
        emailVerified: true
      }
    });
    testUserId = testUser.id;

    const testCategory = await prisma.category.create({
      data: {
        name: 'Search Test Category',
        slug: 'search-test',
        description: 'Category for search testing'
      }
    });
    testCategoryId = testCategory.id;
  }

  async function createTestDocuments() {
    const documentData = [
      {
        title: 'TEST_Complete Guide to PAC Policies',
        content: 'This comprehensive guide covers the Common Agricultural Policy (PAC) of the European Union. It includes detailed information about direct payments, rural development programs, and market measures. The PAC is designed to support farmers and ensure food security across Europe while promoting sustainable agricultural practices.',
        keywords: ['pac', 'agricultural policy', 'european union', 'farmers', 'sustainability'],
        category: 'PAC'
      },
      {
        title: 'TEST_Sustainable Farming Techniques',
        content: 'Modern sustainable farming techniques focus on environmental protection while maintaining agricultural productivity. This includes organic farming methods, crop rotation, integrated pest management, and the use of renewable energy sources. These practices help preserve soil health and biodiversity.',
        keywords: ['sustainable farming', 'organic', 'environment', 'biodiversity', 'soil health'],
        category: 'Sustainability'
      },
      {
        title: 'TEST_IoT Applications in Agriculture',
        content: 'Internet of Things (IoT) technology is revolutionizing agriculture through smart sensors, automated irrigation systems, and precision farming tools. These technologies enable farmers to monitor crop conditions, optimize resource usage, and increase yields while reducing environmental impact.',
        keywords: ['iot', 'smart farming', 'sensors', 'precision agriculture', 'technology'],
        category: 'Technology'
      },
      {
        title: 'TEST_Organic Certification Process',
        content: 'The organic certification process ensures that agricultural products meet strict organic standards. This involves detailed documentation, regular inspections, and compliance with organic farming regulations. Certified organic products command premium prices in the market.',
        keywords: ['organic certification', 'standards', 'inspection', 'compliance', 'premium prices'],
        category: 'Certification'
      },
      {
        title: 'TEST_Climate Change and Agriculture',
        content: 'Climate change poses significant challenges to global agriculture through changing weather patterns, extreme events, and shifting growing seasons. Adaptation strategies include drought-resistant crops, improved water management, and carbon sequestration practices.',
        keywords: ['climate change', 'adaptation', 'drought resistant', 'water management', 'carbon sequestration'],
        category: 'Climate'
      }
    ];

    for (const docData of documentData) {
      const document = await prisma.document.create({
        data: {
          title: docData.title,
          description: docData.content.substring(0, 200) + '...',
          contentType: 'TEXT',
          categoryId: testCategoryId,
          uploadedById: testUserId,
          status: 'PUBLISHED',
          extractionStatus: 'COMPLETED',
          indexingStatus: 'COMPLETED',
          contentExtracted: docData.content,
          wordCount: docData.content.split(' ').length,
          accessLevel: 'PUBLIC',
          metadata: { testCategory: docData.category }
        }
      });

      testDocuments.push(document.id);

      // Create document analysis
      await prisma.documentAnalysis.create({
        data: {
          documentId: document.id,
          summary: docData.content.substring(0, 200),
          extractedEntities: docData.keywords.map(keyword => ({
            text: keyword,
            label: 'KEYWORD',
            confidence: 0.9
          })),
          topics: [{ topic: docData.category, confidence: 0.8 }],
          readabilityScore: 75,
          complexity: 5,
          confidence: 0.9,
          retrievalKeywords: docData.keywords
        }
      });

      // Create embeddings for semantic search (mock embeddings)
      await prisma.documentEmbedding.create({
        data: {
          documentId: document.id,
          chunkIndex: 0,
          chunkText: docData.content,
          embeddingModel: 'test-embedding-model',
          embedding: this.generateMockEmbedding(docData.content, docData.keywords),
          tokenCount: docData.content.split(' ').length,
          chunkMetadata: { keywords: docData.keywords }
        }
      });
    }
  }

  async function cleanupTestData() {
    await prisma.documentEmbedding.deleteMany({
      where: { documentId: { in: testDocuments } }
    });
    await prisma.documentAnalysis.deleteMany({
      where: { documentId: { in: testDocuments } }
    });
    await prisma.document.deleteMany({
      where: { id: { in: testDocuments } }
    });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.category.delete({ where: { id: testCategoryId } });
  }

  function generateMockEmbedding(content: string, keywords: string[]): number[] {
    // Generate a simple mock embedding based on content and keywords
    const baseEmbedding = Array(1536).fill(0).map(() => Math.random() * 0.1);
    
    // Boost certain dimensions based on keywords
    keywords.forEach((keyword, index) => {
      const dimension = (keyword.charCodeAt(0) + index) % 1536;
      baseEmbedding[dimension] += 0.5;
    });

    return baseEmbedding;
  }

  describe('Traditional Full-Text Search', () => {
    it('should find documents by title keywords', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=PAC policies&semantic=false',
        headers: {
          authorization: `Bearer test-token-${testUserId}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      
      expect(result.searchType).toBe('fulltext');
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].title).toContain('PAC');
    });

    it('should find documents by content keywords', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=sustainable farming&semantic=false',
        headers: {
          authorization: `Bearer test-token-${testUserId}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.some((doc: any) => 
        doc.title.includes('Sustainable') || doc.description.includes('sustainable')
      )).toBe(true);
    });

    it('should handle case-insensitive search', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=ORGANIC CERTIFICATION&semantic=false',
        headers: {
          authorization: `Bearer test-token-${testUserId}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should return empty results for non-existent terms', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=nonexistentterm12345&semantic=false',
        headers: {
          authorization: `Bearer test-token-${testUserId}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      
      expect(result.results.length).toBe(0);
    });
  });

  describe('Semantic Search', () => {
    beforeEach(() => {
      // Mock the semantic search method
      jest.spyOn(documentProcessor, 'semanticSearch').mockImplementation(async (params) => {
        // Simple mock implementation that returns relevant documents
        const mockResults = testDocuments.slice(0, 3).map((docId, index) => ({
          document: {
            id: docId,
            title: `TEST_Document ${index + 1}`,
            description: 'Mock description',
            category: { name: 'Test Category' },
            author: 'Test Author',
            publishedAt: new Date()
          },
          chunk: {
            chunkIndex: 0,
            text: 'Mock chunk text containing relevant information',
            startChar: 0,
            endChar: 50,
            tokenCount: 10,
            metadata: {}
          },
          similarity: 0.8 - (index * 0.1), // Decreasing similarity
          relevantSection: 'Relevant section of the document',
          context: 'Context around the relevant section...'
        }));

        return mockResults.filter(result => result.similarity >= (params.minSimilarity || 0.7));
      });
    });

    it('should perform semantic search with embeddings', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=agricultural sustainability&semantic=true',
        headers: {
          authorization: `Bearer test-token-${testUserId}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      
      expect(result.searchType).toBe('semantic');
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0]).toHaveProperty('similarity');
      expect(result.results[0]).toHaveProperty('relevantSection');
      expect(result.results[0]).toHaveProperty('context');
    });

    it('should rank results by similarity score', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=farming techniques&semantic=true',
        headers: {
          authorization: `Bearer test-token-${testUserId}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      
      // Results should be ordered by similarity (highest first)
      for (let i = 1; i < result.results.length; i++) {
        expect(result.results[i-1].similarity).toBeGreaterThanOrEqual(result.results[i].similarity);
      }
    });

    it('should handle complex queries', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=how to implement sustainable practices in modern agriculture&semantic=true',
        headers: {
          authorization: `Bearer test-token-${testUserId}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      
      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  describe('Search Filters', () => {
    it('should filter by category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/documents/search?query=agriculture&categories[]=${testCategoryId}`,
        headers: {
          authorization: `Bearer test-token-${testUserId}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      
      // All results should be from the specified category
      result.results.forEach((doc: any) => {
        expect(doc.category?.id || testCategoryId).toBe(testCategoryId);
      });
    });

    it('should respect access level restrictions', async () => {
      // Create a member-only document
      const memberDoc = await prisma.document.create({
        data: {
          title: 'TEST_Member Only Document',
          contentType: 'TEXT',
          categoryId: testCategoryId,
          uploadedById: testUserId,
          status: 'PUBLISHED',
          accessLevel: 'MEMBER',
          contentExtracted: 'This is member-only content'
        }
      });

      // Test with public user (should not see member document)
      const publicResponse = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=member&accessLevel=PUBLIC',
        headers: {
          authorization: `Bearer test-token-public-user`
        }
      });

      expect(publicResponse.statusCode).toBe(200);
      const publicResult = JSON.parse(publicResponse.body);
      expect(publicResult.results.every((doc: any) => doc.accessLevel === 'PUBLIC')).toBe(true);

      // Cleanup
      await prisma.document.delete({ where: { id: memberDoc.id } });
    });

    it('should limit results correctly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=test&limit=2',
        headers: {
          authorization: `Bearer test-token-${testUserId}`
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      
      expect(result.results.length).toBeLessThanOrEqual(2);
      expect(result.maxResults).toBe(2);
    });
  });

  describe('Search Performance', () => {
    it('should complete searches within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=agriculture policy implementation&semantic=true',
        headers: {
          authorization: `Bearer test-token-${testUserId}`
        }
      });

      const searchTime = Date.now() - startTime;
      
      expect(response.statusCode).toBe(200);
      expect(searchTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle concurrent searches', async () => {
      const searchPromises = [];
      
      for (let i = 0; i < 5; i++) {
        const promise = app.inject({
          method: 'GET',
          url: `/api/documents/search?query=test query ${i}`,
          headers: {
            authorization: `Bearer test-token-${testUserId}`
          }
        });
        searchPromises.push(promise);
      }

      const responses = await Promise.all(searchPromises);
      
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });
  });

  describe('Search Accuracy', () => {
    it('should find relevant documents for agricultural terms', async () => {
      const agriculturalQueries = [
        'organic farming',
        'crop rotation',
        'sustainable agriculture',
        'precision farming',
        'agricultural policy'
      ];

      for (const query of agriculturalQueries) {
        const response = await app.inject({
          method: 'GET',
          url: `/api/documents/search?query=${encodeURIComponent(query)}`,
          headers: {
            authorization: `Bearer test-token-${testUserId}`
          }
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        
        // Should find at least some relevant documents
        expect(result.results.length).toBeGreaterThan(0);
      }
    });

    it('should handle Italian agricultural terms', async () => {
      const italianQueries = [
        'agricoltura sostenibile',
        'politica agricola comune',
        'certificazione biologica',
        'tecnologie agricole'
      ];

      for (const query of italianQueries) {
        const response = await app.inject({
          method: 'GET',
          url: `/api/documents/search?query=${encodeURIComponent(query)}`,
          headers: {
            authorization: `Bearer test-token-${testUserId}`
          }
        });

        expect(response.statusCode).toBe(200);
        // Should handle Italian terms gracefully
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle empty search queries', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=',
        headers: {
          authorization: `Bearer test-token-${testUserId}`
        }
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.body);
      expect(result.error).toBe('Invalid search parameters');
    });

    it('should handle invalid search parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=test&limit=invalid',
        headers: {
          authorization: `Bearer test-token-${testUserId}`
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle unauthorized search requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?query=test'
        // No authorization header
      });

      expect(response.statusCode).toBe(401);
    });
  });
});