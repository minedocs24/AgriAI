import { FastifyInstance } from 'fastify';
import { build as buildApp } from '../app';
import { PrismaClient } from '@prisma/client';
import { RAGService } from '../services/RAGService';
import { ChatWebSocketManager } from '../websocket/chatSocket';

export interface TestAppOptions {
  test?: boolean;
}

export async function build(opts: TestAppOptions = {}): Promise<FastifyInstance> {
  const app = await buildApp({ 
    logger: false,
    ...opts 
  });

  // Initialize test-specific services
  if (opts.test) {
    // Mock RAG service for testing
    const mockRAGService = new MockRAGService(app.prisma);
    app.decorate('ragService', mockRAGService as any);
    
    // Mock WebSocket manager
    const mockWebSocketManager = new MockWebSocketManager(app.prisma);
    app.decorate('websocketManager', mockWebSocketManager);
    (global as any).websocketManager = mockWebSocketManager;
  }

  return app;
}

// Mock RAG Service for testing
class MockRAGService {
  constructor(private prisma: PrismaClient) {}

  async processQuery(request: any) {
    // Simulate RAG processing with deterministic responses
    const mockResponses = {
      'pac': 'La PAC (Politica Agricola Comune) è il framework europeo per l\'agricoltura sostenibile.',
      'bio': 'La certificazione biologica richiede il rispetto del regolamento CE 834/2007.',
      'iot': 'Le tecnologie IoT in agricoltura includono sensori per umidità, temperatura e nutrienti.',
      'pnrr': 'Il PNRR prevede 6,8 miliardi di euro per la transizione ecologica agricola.',
      'default': 'Grazie per la tua domanda. Ecco una risposta di test dal sistema RAG.'
    };

    const query = request.query.toLowerCase();
    let content = mockResponses.default;
    
    for (const [key, response] of Object.entries(mockResponses)) {
      if (query.includes(key)) {
        content = response;
        break;
      }
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      content: content,
      confidence: 0.85,
      tokens: 150,
      model: 'mock-gpt-4',
      intent: {
        category: this.classifyIntent(query),
        confidence: 0.8
      },
      language: 'it',
      sentiment: 0.1,
      metadata: {
        type: 'mock_response',
        processingSteps: ['mock_retrieval', 'mock_generation'],
        retrievalResults: 3
      },
      sources: this.generateMockSources(query)
    };
  }

  private classifyIntent(query: string): string {
    if (query.includes('pac') || query.includes('normativ')) return 'normative_pac';
    if (query.includes('bio') || query.includes('certificaz')) return 'certificazioni';
    if (query.includes('iot') || query.includes('smart')) return 'tecnologie';
    if (query.includes('pnrr') || query.includes('bando')) return 'finanziamenti';
    if (query.includes('meteo') || query.includes('clima')) return 'meteo';
    return 'generale';
  }

  private generateMockSources(query: string) {
    return [
      {
        id: 'source-1',
        documentId: 'doc-1',
        title: 'Regolamento PAC 2023-2027',
        content: 'Contenuto rilevante del documento per la query: ' + query.substring(0, 100),
        score: 0.92,
        relevance: 0.88,
        rank: 1,
        category: 'Normative',
        metadata: {
          author: 'Commissione Europea',
          publishedAt: new Date('2023-01-01'),
          version: 1
        }
      },
      {
        id: 'source-2',
        documentId: 'doc-2',
        title: 'Guida Certificazioni Biologiche',
        content: 'Informazioni aggiuntive rilevanti per: ' + query.substring(0, 100),
        score: 0.78,
        relevance: 0.75,
        rank: 2,
        category: 'Certificazioni',
        metadata: {
          author: 'MIPAAF',
          publishedAt: new Date('2023-03-15'),
          version: 2
        }
      }
    ];
  }
}

// Mock WebSocket Manager for testing
class MockWebSocketManager {
  private connectedUsers = new Map<string, any>();
  private conversationUsers = new Map<string, Set<string>>();

  constructor(private prisma: PrismaClient) {}

  sendToUser(userId: string, message: any): boolean {
    // Mock implementation - just log the message
    console.log(`Mock WS: Sending to user ${userId}:`, message);
    return true;
  }

  broadcastToConversation(conversationId: string, excludeUserId?: string, message?: any) {
    console.log(`Mock WS: Broadcasting to conversation ${conversationId}:`, message);
  }

  joinConversation(userId: string, conversationId: string) {
    if (!this.conversationUsers.has(conversationId)) {
      this.conversationUsers.set(conversationId, new Set());
    }
    this.conversationUsers.get(conversationId)!.add(userId);
  }

  leaveConversation(userId: string, conversationId: string) {
    this.conversationUsers.get(conversationId)?.delete(userId);
  }

  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  getConversationUsers(conversationId: string): string[] {
    return Array.from(this.conversationUsers.get(conversationId) || []);
  }

  // Mock connection management
  mockConnect(userId: string) {
    this.connectedUsers.set(userId, { connected: true });
  }

  mockDisconnect(userId: string) {
    this.connectedUsers.delete(userId);
  }
}

// Test database utilities
export class TestDatabase {
  constructor(private prisma: PrismaClient) {}

  async createTestUser(overrides: any = {}) {
    return await this.prisma.user.create({
      data: {
        email: overrides.email || 'test@example.com',
        passwordHash: 'hashed_password',
        firstName: overrides.firstName || 'Test',
        lastName: overrides.lastName || 'User',
        userType: overrides.userType || 'PUBLIC',
        emailVerified: overrides.emailVerified !== undefined ? overrides.emailVerified : true,
        ...overrides
      }
    });
  }

  async createTestConversation(userId: string, overrides: any = {}) {
    return await this.prisma.conversation.create({
      data: {
        userId: userId,
        title: overrides.title || 'Test Conversation',
        status: overrides.status || 'ACTIVE',
        context: overrides.context || {},
        metadata: overrides.metadata || {},
        ...overrides
      }
    });
  }

  async createTestMessage(conversationId: string, overrides: any = {}) {
    return await this.prisma.message.create({
      data: {
        conversationId: conversationId,
        content: overrides.content || 'Test message',
        sender: overrides.sender || 'USER',
        messageType: overrides.messageType || 'TEXT',
        confidence: overrides.confidence,
        tokens: overrides.tokens,
        processingTimeMs: overrides.processingTimeMs,
        metadata: overrides.metadata || {},
        ...overrides
      }
    });
  }

  async createTestDocument(uploadedById: string, categoryId: string, overrides: any = {}) {
    return await this.prisma.document.create({
      data: {
        title: overrides.title || 'Test Document',
        description: overrides.description,
        contentType: overrides.contentType || 'PDF',
        categoryId: categoryId,
        uploadedById: uploadedById,
        author: overrides.author || 'Test Author',
        status: overrides.status || 'PUBLISHED',
        accessLevel: overrides.accessLevel || 'PUBLIC',
        indexingStatus: overrides.indexingStatus || 'COMPLETED',
        contentExtracted: overrides.contentExtracted || 'Test content for retrieval',
        ...overrides
      }
    });
  }

  async createTestCategory(overrides: any = {}) {
    return await this.prisma.category.create({
      data: {
        name: overrides.name || 'Test Category',
        slug: overrides.slug || 'test-category',
        description: overrides.description,
        accessLevel: overrides.accessLevel || 'PUBLIC',
        isActive: overrides.isActive !== undefined ? overrides.isActive : true,
        ...overrides
      }
    });
  }

  async cleanup() {
    // Clean up test data in correct order (foreign key constraints)
    await this.prisma.messageFeedback.deleteMany();
    await this.prisma.messageSource.deleteMany();
    await this.prisma.message.deleteMany();
    await this.prisma.conversation.deleteMany();
    await this.prisma.documentAnalysis.deleteMany();
    await this.prisma.documentKeyword.deleteMany();
    await this.prisma.document.deleteMany();
    await this.prisma.categoryKeyword.deleteMany();
    await this.prisma.category.deleteMany();
    await this.prisma.userSession.deleteMany();
    await this.prisma.user.deleteMany();
  }
}

// Test utilities
export const testUtils = {
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  createMockJWT: (payload: any) => {
    // Simple mock JWT for testing
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  },

  parseJWT: (token: string) => {
    try {
      return JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return null;
    }
  }
};

export { MockRAGService, MockWebSocketManager };