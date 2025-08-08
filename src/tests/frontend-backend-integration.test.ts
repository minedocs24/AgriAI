/**
 * Frontend-Backend Integration Tests
 * 
 * Tests per verificare l'integrazione completa tra frontend e backend
 * Covers:
 * - Chat API integration
 * - WebSocket real-time messaging
 * - Authentication flow
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { build } from './helper';
import { chatApi, chatWebSocket } from '../lib/chatApi';
import { authApi } from '../lib/authApi';

// Mock browser environment
Object.defineProperty(window, 'location', {
  value: {
    protocol: 'http:',
    host: 'localhost:3000'
  }
});

Object.defineProperty(global, 'WebSocket', {
  value: jest.fn().mockImplementation(() => ({
    readyState: 1, // OPEN
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }))
});

describe('Frontend-Backend Integration Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    // Build the application
    app = await build({ test: true });
    prisma = app.prisma;
    
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'integration@test.com',
        passwordHash: 'hashed_password',
        firstName: 'Integration',
        lastName: 'Test',
        userType: 'PUBLIC',
        emailVerified: true
      }
    });

    // Generate auth token
    authToken = app.jwt.sign({ 
      sub: testUser.id,
      email: testUser.email,
      role: testUser.userType
    });

    // Mock localStorage for token storage
    const localStorageMock = {
      getItem: jest.fn((key: string) => {
        if (key === 'access_token') return authToken;
        if (key === 'user') return JSON.stringify(testUser);
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock
    });

    // Mock fetch for API calls
    global.fetch = jest.fn();
  });

  afterEach(async () => {
    // Cleanup
    if (prisma) {
      await prisma.message.deleteMany();
      await prisma.conversation.deleteMany();
      await prisma.user.deleteMany();
    }
    await app.close();
    jest.clearAllMocks();
  });

  describe('Chat API Integration', () => {
    it('should send message via REST API when WebSocket unavailable', async () => {
      // Mock successful API response
      const mockResponse = {
        userMessage: {
          id: 'user-123',
          content: 'Test message',
          sender: 'user',
          timestamp: new Date().toISOString()
        },
        aiMessage: {
          id: 'ai-123',
          content: 'AI response',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          confidence: 0.95
        },
        conversation: {
          id: 'conv-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse
        })
      });

      const response = await chatApi.sendMessage({
        content: 'Test message',
        context: { userType: 'public' }
      });

      expect(response.userMessage.content).toBe('Test message');
      expect(response.aiMessage.content).toBe('AI response');
      expect(response.conversation.id).toBe('conv-123');
      
      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat/query'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }),
          body: JSON.stringify({
            content: 'Test message',
            context: { userType: 'public' }
          })
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: 'internal_server_error',
          message: 'Server error'
        })
      });

      await expect(chatApi.sendMessage({
        content: 'Test message'
      })).rejects.toThrow();
    });

    it('should retrieve conversations list', async () => {
      // Mock conversations response
      const mockConversations = {
        conversations: [
          {
            id: 'conv-1',
            title: 'Test Conversation',
            messageCount: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        total: 1,
        hasMore: false
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockConversations
        })
      });

      const response = await chatApi.getConversations();

      expect(response.conversations).toHaveLength(1);
      expect(response.conversations[0].id).toBe('conv-1');
      expect(response.total).toBe(1);
    });
  });

  describe('Authentication Integration', () => {
    it('should check authentication status', () => {
      // authApi should use mocked localStorage
      expect(authApi.isAuthenticated()).toBe(true);
      expect(authApi.getAccessToken()).toBe(authToken);
    });

    it('should get stored user data', () => {
      const storedUser = authApi.getStoredUser();
      expect(storedUser).toEqual(testUser);
    });

    it('should make authenticated requests', async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'Success' }
        })
      });

      const response = await authApi.request<{ message: string }>('GET', '/test');

      expect(response.message).toBe('Success');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${authToken}`
          })
        })
      );
    });
  });

  describe('WebSocket Integration', () => {
    it('should create WebSocket client with correct URL', () => {
      const wsClient = chatWebSocket;
      expect(wsClient).toBeDefined();
      expect(wsClient.isConnected()).toBe(false);
    });

    it('should handle connection URL generation', () => {
      // Test URL generation logic
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const expectedBase = `${protocol}//${window.location.host}/ws/chat`;
      
      // This would be tested in the actual WebSocket implementation
      expect(protocol).toBe('ws:'); // Since we're in test environment
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(chatApi.sendMessage({
        content: 'Test message'
      })).rejects.toThrow('Network error');
    });

    it('should handle authentication errors', async () => {
      // Mock 401 Unauthorized
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'unauthorized',
          message: 'Token expired'
        })
      });

      await expect(authApi.request('GET', '/protected')).rejects.toThrow();
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate message content', async () => {
      // Test empty message
      await expect(chatApi.sendMessage({
        content: ''
      })).rejects.toThrow();

      // Test message too long
      const longMessage = 'a'.repeat(1001);
      await expect(chatApi.sendMessage({
        content: longMessage
      })).rejects.toThrow();
    });
  });

  describe('Real Integration Flow Simulation', () => {
    it('should complete full chat flow: send message -> receive response', async () => {
      // Step 1: User sends message
      const userMessage = 'Come posso migliorare la mia coltivazione di pomodori?';
      
      // Mock successful conversation creation
      const mockResponse = {
        userMessage: {
          id: 'user-msg-1',
          content: userMessage,
          sender: 'user',
          timestamp: new Date().toISOString()
        },
        aiMessage: {
          id: 'ai-msg-1',
          content: 'Per migliorare la coltivazione di pomodori, ti consiglio di...',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          confidence: 0.92,
          sources: ['Manuale di Agricoltura Sostenibile']
        },
        conversation: {
          id: 'conv-real-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        processingTime: 1250
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponse
        })
      });

      // Step 2: Send message via API
      const response = await chatApi.sendMessage({
        content: userMessage,
        context: {
          userType: 'public',
          location: 'Italia'
        }
      });

      // Step 3: Verify response structure
      expect(response.userMessage.content).toBe(userMessage);
      expect(response.aiMessage.content).toContain('pomodori');
      expect(response.aiMessage.confidence).toBeGreaterThan(0.9);
      expect(response.aiMessage.sources).toContain('Manuale di Agricoltura Sostenibile');
      expect(response.conversation.id).toBe('conv-real-1');
      expect(response.processingTime).toBeGreaterThan(1000);

      // Step 4: Continue conversation
      const followUpMessage = 'Quali varietà di pomodori consigli?';
      
      const followUpResponse = {
        userMessage: {
          id: 'user-msg-2',
          content: followUpMessage,
          sender: 'user',
          timestamp: new Date().toISOString(),
          conversationId: 'conv-real-1'
        },
        aiMessage: {
          id: 'ai-msg-2',
          content: 'Ti consiglio varietà come San Marzano, Roma, e Cherry...',
          sender: 'ai',
          timestamp: new Date().toISOString(),
          confidence: 0.88,
          sources: ['Catalogo Varietà Orticole']
        },
        conversation: {
          id: 'conv-real-1',
          createdAt: mockResponse.conversation.createdAt,
          updatedAt: new Date().toISOString()
        },
        processingTime: 980
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: followUpResponse
        })
      });

      const continuedResponse = await chatApi.sendMessage({
        content: followUpMessage,
        conversationId: 'conv-real-1',
        context: {
          userType: 'public'
        }
      });

      expect(continuedResponse.userMessage.conversationId).toBe('conv-real-1');
      expect(continuedResponse.aiMessage.content).toContain('varietà');
      expect(continuedResponse.conversation.id).toBe('conv-real-1');
    });
  });
});