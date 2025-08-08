import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { build } from '../app';
import { PrismaClient } from '@prisma/client';

describe('Chat System Integration Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    // Build test app
    app = await build({ test: true });
    prisma = app.prisma;
    
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'chat-test@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Chat',
        lastName: 'Test',
        userType: 'PUBLIC',
        emailVerified: true
      }
    });

    // Generate auth token
    authToken = app.jwt.sign({ userId: testUser.id });
  });

  afterEach(async () => {
    // Cleanup
    if (prisma) {
      await prisma.message.deleteMany();
      await prisma.conversation.deleteMany();
      await prisma.user.deleteMany();
    }
    await app.close();
  });

  describe('Chat API Endpoints', () => {
    it('should create new conversation and process message with RAG', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          content: 'Quali sono i requisiti per la certificazione biologica?',
          context: {
            userType: 'member',
            farmType: 'biologico'
          }
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.payload);
      expect(data).toHaveProperty('userMessage');
      expect(data).toHaveProperty('aiMessage');
      expect(data).toHaveProperty('conversation');
      
      expect(data.userMessage.content).toBe('Quali sono i requisiti per la certificazione biologica?');
      expect(data.userMessage.sender).toBe('user');
      expect(data.aiMessage.sender).toBe('ai');
      expect(data.aiMessage.confidence).toBeGreaterThan(0);
      expect(data.conversation.id).toBeDefined();
    });

    it('should continue existing conversation with context', async () => {
      // First message
      const firstResponse = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          content: 'Dimmi qualcosa sulla rotazione delle colture'
        }
      });

      const firstData = JSON.parse(firstResponse.payload);
      const conversationId = firstData.conversation.id;

      // Follow-up message
      const secondResponse = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          content: 'Quali sono i benefici principali?',
          conversationId: conversationId
        }
      });

      expect(secondResponse.statusCode).toBe(200);
      
      const secondData = JSON.parse(secondResponse.payload);
      expect(secondData.conversation.id).toBe(conversationId);
      expect(secondData.conversation.messageCount).toBe(4); // 2 user + 2 ai
    });

    it('should handle agricultural queries with RAG sources', async () => {
      const queries = [
        'Normative PAC 2023',
        'Certificazione biologica',
        'Tecnologie IoT agricole',
        'Bandi PNRR agricoltura'
      ];

      for (const query of queries) {
        const response = await app.inject({
          method: 'POST',
          url: '/api/chat/query',
          headers: {
            authorization: `Bearer ${authToken}`
          },
          payload: {
            content: query,
            context: {
              userType: 'member',
              expertise: 'avanzato'
            }
          }
        });

        expect(response.statusCode).toBe(200);
        
        const data = JSON.parse(response.payload);
        expect(data.aiMessage.content).toBeTruthy();
        expect(data.aiMessage.confidence).toBeGreaterThan(0);
        expect(data.aiMessage.processingTime).toBeGreaterThan(0);
      }
    });

    it('should reject empty messages', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          content: '   '
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        payload: {
          content: 'Test message'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Conversation Management', () => {
    it('should get user conversations with pagination', async () => {
      // Create test conversations
      await prisma.conversation.createMany({
        data: [
          {
            userId: testUser.id,
            title: 'Test Conversation 1',
            status: 'ACTIVE',
            messageCount: 2
          },
          {
            userId: testUser.id,
            title: 'Test Conversation 2',
            status: 'ACTIVE',
            messageCount: 4
          }
        ]
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/chat/conversations',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.payload);
      expect(data).toHaveProperty('conversations');
      expect(data).toHaveProperty('pagination');
      expect(data.conversations).toHaveLength(2);
    });

    it('should support conversation pagination', async () => {
      // Create multiple conversations
      await prisma.conversation.createMany({
        data: Array.from({ length: 25 }, (_, i) => ({
          userId: testUser.id,
          title: `Test Conversation ${i + 1}`,
          status: 'ACTIVE',
          messageCount: 2
        }))
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/chat/conversations?page=1&limit=10',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.payload);
      expect(data.conversations).toHaveLength(10);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBe(25);
    });
  });

  describe('Feedback System', () => {
    it('should submit feedback for AI messages', async () => {
      // Create conversation and message
      const conversation = await prisma.conversation.create({
        data: {
          userId: testUser.id,
          status: 'ACTIVE'
        }
      });

      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: 'Test AI response',
          sender: 'AI',
          confidence: 0.8
        }
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          messageId: message.id,
          rating: 5,
          comment: 'Excellent response!'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
    });
  });

  describe('RAG Integration', () => {
    it('should process agricultural queries with context awareness', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          content: 'Quali sono i requisiti per la certificazione biologica?',
          context: {
            userType: 'member',
            farmType: 'biologico',
            location: 'Toscana',
            expertise: 'intermedio'
          }
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.payload);
      expect(data.aiMessage.content).toContain('certificazione');
      expect(data.aiMessage.confidence).toBeGreaterThan(0.1);
      expect(data.aiMessage.processingTime).toBeGreaterThan(0);
    });

    it('should handle queries with different agricultural topics', async () => {
      const topics = [
        { query: 'PAC 2023 normative', expected: 'pac' },
        { query: 'Certificazione BIO', expected: 'certificazione' },
        { query: 'IoT smart farming', expected: 'tecnologia' },
        { query: 'Bandi PNRR agricoli', expected: 'finanziamento' }
      ];

      for (const topic of topics) {
        const response = await app.inject({
          method: 'POST',
          url: '/api/chat/query',
          headers: {
            authorization: `Bearer ${authToken}`
          },
          payload: {
            content: topic.query
          }
        });

        expect(response.statusCode).toBe(200);
        
        const data = JSON.parse(response.payload);
        expect(data.aiMessage.content).toBeTruthy();
        expect(data.aiMessage.confidence).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          content: 'Performance test query'
        }
      });

      const responseTime = Date.now() - startTime;
      
      expect(response.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      
      const data = JSON.parse(response.payload);
      expect(data.aiMessage.processingTime).toBeLessThan(2000); // Processing should be under 2 seconds
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        app.inject({
          method: 'POST',
          url: '/api/chat/query',
          headers: {
            authorization: `Bearer ${authToken}`
          },
          payload: {
            content: `Concurrent query ${i + 1}`
          }
        })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          // Missing required content field
          context: { userType: 'public' }
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should sanitize user input', async () => {
      const maliciousInput = '<script>alert("xss")</script>Legittima domanda agricola';
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          content: maliciousInput
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.payload);
      expect(data.userMessage.content).not.toContain('<script>');
    });
  });

  describe('Health Check', () => {
    it('should provide system health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.payload);
      expect(data.status).toBe('healthy');
      expect(data.services).toHaveProperty('database');
      expect(data.services).toHaveProperty('rag');
      expect(data.services).toHaveProperty('websocket');
    });
  });
}); 