import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { build } from './helper';
import { PrismaClient } from '@prisma/client';

describe('Chat API Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    app = await build({ test: true });
    prisma = app.prisma;
    
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
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

  describe('POST /api/chat/query', () => {
    it('should create new conversation and send message', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          content: 'Ciao, come stai?',
          context: {
            userType: 'public',
            location: 'Italia'
          }
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.payload);
      expect(data).toHaveProperty('userMessage');
      expect(data).toHaveProperty('aiMessage');
      expect(data).toHaveProperty('conversation');
      
      expect(data.userMessage.content).toBe('Ciao, come stai?');
      expect(data.userMessage.sender).toBe('user');
      expect(data.aiMessage.sender).toBe('ai');
      expect(data.aiMessage.confidence).toBeGreaterThan(0);
      expect(data.conversation.id).toBeDefined();
    });

    it('should continue existing conversation', async () => {
      // Create initial conversation
      const firstResponse = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          content: 'Prima domanda'
        }
      });

      const firstData = JSON.parse(firstResponse.payload);
      const conversationId = firstData.conversation.id;

      // Continue conversation
      const secondResponse = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          content: 'Seconda domanda',
          conversationId: conversationId
        }
      });

      expect(secondResponse.statusCode).toBe(200);
      
      const secondData = JSON.parse(secondResponse.payload);
      expect(secondData.conversation.id).toBe(conversationId);
      expect(secondData.conversation.messageCount).toBe(4); // 2 user + 2 ai
    });

    it('should reject empty message', async () => {
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

    it('should reject unauthenticated request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        payload: {
          content: 'Test message'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle RAG context correctly', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          content: 'Quali sono i requisiti per la certificazione BIO?',
          context: {
            userType: 'member',
            farmType: 'biologico',
            expertise: 'intermedio'
          }
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.payload);
      expect(data.aiMessage.content).toContain('certificazione');
      expect(data.aiMessage.sources).toBeDefined();
    });

    it('should track message sources for RAG responses', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          content: 'Normative PAC 2023'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.payload);
      if (data.aiMessage.sources && data.aiMessage.sources.length > 0) {
        const source = data.aiMessage.sources[0];
        expect(source).toHaveProperty('id');
        expect(source).toHaveProperty('title');
        expect(source).toHaveProperty('content');
        expect(source).toHaveProperty('score');
        expect(source).toHaveProperty('relevance');
      }
    });
  });

  describe('GET /api/chat/conversations', () => {
    beforeEach(async () => {
      // Create test conversations
      const conv1 = await prisma.conversation.create({
        data: {
          userId: testUser.id,
          title: 'Test Conversation 1',
          status: 'ACTIVE',
          messageCount: 2
        }
      });

      const conv2 = await prisma.conversation.create({
        data: {
          userId: testUser.id,
          title: 'Test Conversation 2',
          status: 'ACTIVE',
          messageCount: 4
        }
      });

      // Add messages to conversations
      await prisma.message.createMany({
        data: [
          {
            conversationId: conv1.id,
            content: 'First message',
            sender: 'USER'
          },
          {
            conversationId: conv1.id,
            content: 'AI response',
            sender: 'AI',
            confidence: 0.9
          },
          {
            conversationId: conv2.id,
            content: 'Another message',
            sender: 'USER'
          },
          {
            conversationId: conv2.id,
            content: 'Another AI response',
            sender: 'AI',
            confidence: 0.8
          }
        ]
      });
    });

    it('should get user conversations', async () => {
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
      
      const conversation = data.conversations[0];
      expect(conversation).toHaveProperty('id');
      expect(conversation).toHaveProperty('title');
      expect(conversation).toHaveProperty('messageCount');
      expect(conversation).toHaveProperty('lastMessage');
    });

    it('should support pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/chat/conversations?page=1&limit=1',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.payload);
      expect(data.conversations).toHaveLength(1);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(1);
      expect(data.pagination.total).toBe(2);
    });

    it('should only return user\'s conversations', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          passwordHash: 'hashed_password',
          firstName: 'Other',
          lastName: 'User',
          userType: 'PUBLIC',
          emailVerified: true
        }
      });

      // Create conversation for other user
      await prisma.conversation.create({
        data: {
          userId: otherUser.id,
          title: 'Other User Conversation',
          status: 'ACTIVE'
        }
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
      expect(data.conversations).toHaveLength(2); // Only original user's conversations
    });
  });

  describe('POST /api/chat/feedback', () => {
    let messageId: string;

    beforeEach(async () => {
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

      messageId = message.id;
    });

    it('should submit feedback for message', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          messageId: messageId,
          rating: 5,
          comment: 'Excellent response!'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);

      // Verify feedback was saved
      const feedback = await prisma.messageFeedback.findFirst({
        where: { messageId: messageId }
      });
      expect(feedback).toBeTruthy();
      expect(feedback?.rating).toBe(5);
      expect(feedback?.comment).toBe('Excellent response!');
    });

    it('should reject feedback for non-existent message', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          messageId: '00000000-0000-0000-0000-000000000000',
          rating: 3
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject feedback for other user\'s message', async () => {
      // Create another user and their message
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          password: 'hashed_password',
          firstName: 'Other',
          lastName: 'User',
          userType: 'PUBLIC',
          isActive: true,
          emailVerified: true
        }
      });

      const otherConversation = await prisma.conversation.create({
        data: {
          userId: otherUser.id,
          status: 'ACTIVE'
        }
      });

      const otherMessage = await prisma.message.create({
        data: {
          conversationId: otherConversation.id,
          content: 'Other user message',
          sender: 'AI'
        }
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/feedback',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          messageId: otherMessage.id,
          rating: 3
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('RAG Integration Tests', () => {
    it('should process agricultural queries with context', async () => {
      const queries = [
        'Quali sono i requisiti per la PAC 2023?',
        'Come ottenere la certificazione biologica?',
        'Tecnologie IoT per l\'irrigazione intelligente',
        'Bandi PNRR per l\'agricoltura sostenibile'
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

    it('should handle conversation context correctly', async () => {
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

      // Follow-up message with implicit context
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
      expect(secondData.aiMessage.content).toContain('rotazione');
    });

    it('should track confidence scores correctly', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          content: 'Domanda molto specifica sui micronutrienti del terreno argilloso in clima mediterraneo'
        }
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.payload);
      expect(data.aiMessage.confidence).toBeGreaterThan(0);
      expect(data.aiMessage.confidence).toBeLessThanOrEqual(1);
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
    it('should handle RAG service failures gracefully', async () => {
      // Mock RAG service to throw error
      jest.spyOn(app.ragService, 'processQuery').mockRejectedValue(new Error('RAG service error'));

      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/query',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          content: 'Test query with RAG error'
        }
      });

      expect(response.statusCode).toBe(500);
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
});