import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import { build } from './helper';
import { PrismaClient } from '@prisma/client';

describe('WebSocket Chat Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let testUser: any;
  let authToken: string;
  let wsUrl: string;

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
    
    // Start server and get WebSocket URL
    await app.listen({ port: 0 });
    const address = app.server.address();
    const port = typeof address === 'object' && address ? address.port : 3000;
    wsUrl = `ws://localhost:${port}/ws/chat?token=${authToken}`;
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

  describe('WebSocket Connection', () => {
    it('should establish connection with valid token', (done) => {
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        ws.close();
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should reject connection with invalid token', (done) => {
      const invalidWsUrl = `ws://localhost:${app.server.address()?.port}/ws/chat?token=invalid_token`;
      const ws = new WebSocket(invalidWsUrl);
      
      ws.on('close', (code) => {
        expect(code).toBe(1000); // Connection closed
        done();
      });

      ws.on('error', () => {
        // Expected error for invalid token
        done();
      });
    });

    it('should send welcome message on connection', (done) => {
      const ws = new WebSocket(wsUrl);
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'user_presence') {
          expect(message.data.status).toBe('connected');
          expect(message.data.userId).toBe(testUser.id);
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Chat Messages', () => {
    it('should handle chat message via WebSocket', (done) => {
      const ws = new WebSocket(wsUrl);
      let messageReceived = false;
      
      ws.on('open', () => {
        // Send chat message
        ws.send(JSON.stringify({
          type: 'chat_message',
          content: 'Hello via WebSocket',
          context: {
            userType: 'public'
          }
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'message_response' && !messageReceived) {
          messageReceived = true;
          expect(message.data).toHaveProperty('userMessage');
          expect(message.data).toHaveProperty('aiMessage');
          expect(message.data).toHaveProperty('conversation');
          expect(message.data.userMessage.content).toBe('Hello via WebSocket');
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should handle conversation context in WebSocket messages', (done) => {
      const ws = new WebSocket(wsUrl);
      let conversationId: string;
      let messagesReceived = 0;
      
      ws.on('open', () => {
        // Send first message
        ws.send(JSON.stringify({
          type: 'chat_message',
          content: 'Prima domanda'
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'message_response') {
          messagesReceived++;
          
          if (messagesReceived === 1) {
            // First message response
            conversationId = message.data.conversation.id;
            
            // Send follow-up message
            ws.send(JSON.stringify({
              type: 'chat_message',
              content: 'Seconda domanda',
              conversationId: conversationId
            }));
          } else if (messagesReceived === 2) {
            // Second message response
            expect(message.data.conversation.id).toBe(conversationId);
            expect(message.data.conversation.messageCount).toBe(4);
            ws.close();
            done();
          }
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Typing Indicators', () => {
    it('should broadcast typing indicators to conversation participants', (done) => {
      const ws1 = new WebSocket(wsUrl);
      
      // Create second user for testing
      prisma.user.create({
        data: {
          email: 'test2@example.com',
          passwordHash: 'hashed_password',
          firstName: 'Test2',
          lastName: 'User2',
          userType: 'PUBLIC',
          emailVerified: true
        }
      }).then(user2 => {
        const token2 = app.jwt.sign({ userId: user2.id });
        const wsUrl2 = `ws://localhost:${app.server.address()?.port}/ws/chat?token=${token2}`;
        const ws2 = new WebSocket(wsUrl2);
        
        let conversationId: string;
        
        ws1.on('open', () => {
          // Create conversation with first message
          ws1.send(JSON.stringify({
            type: 'chat_message',
            content: 'Start conversation'
          }));
        });

        ws1.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'message_response') {
            conversationId = message.data.conversation.id;
            
            // Second user joins conversation and starts typing
            ws2.send(JSON.stringify({
              type: 'typing_start',
              conversationId: conversationId
            }));
          }
        });

        ws1.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'typing_start') {
            expect(message.data.conversationId).toBe(conversationId);
            expect(message.data.userId).toBe(user2.id);
            ws1.close();
            ws2.close();
            done();
          }
        });
      });
    });

    it('should auto-stop typing after timeout', (done) => {
      const ws = new WebSocket(wsUrl);
      let conversationId: string;
      
      ws.on('open', () => {
        // Create conversation
        ws.send(JSON.stringify({
          type: 'chat_message',
          content: 'Test conversation'
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'message_response') {
          conversationId = message.data.conversation.id;
          
          // Start typing
          ws.send(JSON.stringify({
            type: 'typing_start',
            conversationId: conversationId
          }));
        } else if (message.type === 'typing_stop') {
          expect(message.data.conversationId).toBe(conversationId);
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    }, 10000); // Longer timeout for this test
  });

  describe('Real-time Updates', () => {
    it('should receive real-time message updates', (done) => {
      const ws = new WebSocket(wsUrl);
      let updateReceived = false;
      
      ws.on('open', () => {
        // Simulate external message update (e.g., from HTTP API)
        setTimeout(() => {
          // This would normally be triggered by the ChatController
          app.websocketManager?.sendToUser(testUser.id, {
            type: 'message_response',
            data: {
              userMessage: {
                id: 'test-id',
                content: 'External message',
                timestamp: new Date().toISOString(),
                sender: 'user'
              },
              aiMessage: {
                id: 'test-ai-id',
                content: 'External AI response',
                timestamp: new Date().toISOString(),
                sender: 'ai',
                confidence: 0.9
              },
              conversation: {
                id: 'test-conv-id',
                title: 'External Conversation',
                messageCount: 2
              }
            }
          });
        }, 100);
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'message_response' && !updateReceived) {
          updateReceived = true;
          expect(message.data.userMessage.content).toBe('External message');
          expect(message.data.aiMessage.content).toBe('External AI response');
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Connection Management', () => {
    it('should handle multiple simultaneous connections', (done) => {
      const connections: WebSocket[] = [];
      let connectedCount = 0;
      const totalConnections = 3;
      
      for (let i = 0; i < totalConnections; i++) {
        const ws = new WebSocket(wsUrl);
        connections.push(ws);
        
        ws.on('open', () => {
          connectedCount++;
          if (connectedCount === totalConnections) {
            // All connections established
            connections.forEach(conn => conn.close());
            done();
          }
        });

        ws.on('error', (error) => {
          done(error);
        });
      }
    });

    it('should cleanup on disconnection', (done) => {
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        // Check if user is connected
        expect(app.websocketManager?.isUserConnected(testUser.id)).toBe(true);
        
        ws.close();
      });

      ws.on('close', () => {
        // Check if user is cleaned up after disconnection
        setTimeout(() => {
          expect(app.websocketManager?.isUserConnected(testUser.id)).toBe(false);
          done();
        }, 100);
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should handle connection errors gracefully', (done) => {
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        // Send malformed message
        ws.send('invalid json');
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'error') {
          expect(message.data.message).toBeTruthy();
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        // Expected error, test passed
        done();
      });
    });
  });

  describe('Health Check', () => {
    it('should provide WebSocket health status', async () => {
      const ws = new WebSocket(wsUrl);
      
      // Wait for connection
      await new Promise((resolve) => {
        ws.on('open', resolve);
      });

      const response = await app.inject({
        method: 'GET',
        url: '/ws/health'
      });

      expect(response.statusCode).toBe(200);
      
      const data = JSON.parse(response.payload);
      expect(data.status).toBe('healthy');
      expect(data.connectedUsers).toBeGreaterThanOrEqual(1);
      expect(data.timestamp).toBeTruthy();

      ws.close();
    });
  });

  describe('Conversation Rooms', () => {
    it('should join and leave conversation rooms', (done) => {
      const ws = new WebSocket(wsUrl);
      let conversationId: string;
      
      ws.on('open', () => {
        // Create conversation
        ws.send(JSON.stringify({
          type: 'chat_message',
          content: 'Join room test'
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'message_response') {
          conversationId = message.data.conversation.id;
          
          // Verify user is in conversation room
          const conversationUsers = app.websocketManager?.getConversationUsers(conversationId);
          expect(conversationUsers).toContain(testUser.id);
          
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });
});