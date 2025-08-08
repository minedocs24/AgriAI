import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { RAGService } from '../services/RAGService';
import { z } from 'zod';

// Request/Response schemas
const SendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  context: z.object({
    userType: z.enum(['public', 'member', 'admin']).default('public'),
    location: z.string().optional(),
    farmType: z.string().optional(),
    expertise: z.string().optional()
  }).optional()
});

const ChatResponseSchema = z.object({
  userMessage: z.object({
    id: z.string(),
    content: z.string(),
    timestamp: z.string(),
    sender: z.literal('user')
  }),
  aiMessage: z.object({
    id: z.string(),
    content: z.string(),
    timestamp: z.string(),
    sender: z.literal('ai'),
    confidence: z.number().optional(),
    processingTime: z.number().optional(),
    sources: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      score: z.number(),
      relevance: z.number()
    })).optional()
  }),
  conversation: z.object({
    id: z.string(),
    title: z.string().optional(),
    messageCount: z.number()
  })
});

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    userType: string;
  };
}

export class ChatController {
  constructor(
    private prisma: PrismaClient,
    private ragService: RAGService
  ) {}

  async sendMessage(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const body = SendMessageSchema.parse(request.body);
      const userId = request.user?.id;
      
      if (!userId) {
        return reply.status(401).send({ 
          error: 'authentication_required',
          message: 'User ID not found in request. Please authenticate.' 
        });
      }

      // Sanitize input
      const sanitizedContent = this.sanitizeInput(body.content);

      // Get or create conversation
      let conversation = body.conversationId 
        ? await this.getConversation(body.conversationId, userId)
        : await this.createConversation(userId, body.context);

      if (!conversation) {
        return reply.status(404).send({ error: 'Conversation not found' });
      }

      // Save user message
      const userMessage = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: sanitizedContent,
          sender: 'USER',
          messageType: 'TEXT',
          metadata: {
            userContext: body.context,
            timestamp: new Date().toISOString()
          }
        }
      });

      // Get conversation history for context
      const recentMessages = await this.getConversationHistory(conversation.id, 10);

      // Process with RAG service
      const startTime = Date.now();
      
      const ragResponse = await this.ragService.processQuery({
        query: sanitizedContent,
        conversationId: conversation.id,
        userId: userId,
        context: body.context || {},
        conversationHistory: recentMessages
      });

      const processingTime = Date.now() - startTime;

      // Save AI response
      const aiMessage = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: ragResponse.content,
          sender: 'AI',
          messageType: 'TEXT',
          confidence: ragResponse.confidence,
          tokens: ragResponse.tokens,
          processingTimeMs: processingTime,
          modelUsed: ragResponse.model,
          intentClassification: ragResponse.intent,
          languageDetected: ragResponse.language || 'it',
          sentimentScore: ragResponse.sentiment,
          metadata: {
            ragMetadata: ragResponse.metadata,
            sources: ragResponse.sources?.map(s => s.id) || []
          }
        }
      });

      // Save message sources for RAG tracking
      if (ragResponse.sources && ragResponse.sources.length > 0) {
        await this.saveMessageSources(aiMessage.id, ragResponse.sources);
        
        // Save document references for analytics and tracking
        await this.saveDocumentReferences(aiMessage.id, ragResponse.sources);
      }

      // Update conversation stats
      await this.updateConversationStats(conversation.id);

      // Prepare response
      const response = {
        userMessage: {
          id: userMessage.id,
          content: userMessage.content,
          timestamp: userMessage.createdAt.toISOString(),
          sender: 'user' as const
        },
        aiMessage: {
          id: aiMessage.id,
          content: aiMessage.content,
          timestamp: aiMessage.createdAt.toISOString(),
          sender: 'ai' as const,
          confidence: ragResponse.confidence,
          processingTime: processingTime,
          sources: ragResponse.sources?.map(source => ({
            id: source.id,
            title: source.title,
            content: source.content,
            score: source.score,
            relevance: source.relevance
          }))
        },
        conversation: {
          id: conversation.id,
          title: conversation.title,
          messageCount: await this.getMessageCount(conversation.id)
        }
      };

      // Emit WebSocket event for real-time updates
      if ((global as any).websocketManager) {
        (global as any).websocketManager.sendToUser(userId, {
          type: 'message_response',
          data: response
        });
      }

      return reply.send(response);

    } catch (error) {
      console.error('Chat error:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Invalid request data',
          details: error.errors 
        });
      }

      return reply.status(500).send({ 
        error: 'Internal server error',
        message: 'Failed to process chat message'
      });
    }
  }

  async getConversations(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;
      const query = request.query as Record<string, any>;
      const page = Number(query?.page || 1);
      const limit = Math.min(Number(query?.limit || 20), 50);
      const offset = (page - 1) * limit;

      const conversations = await this.prisma.conversation.findMany({
        where: {
          userId: userId,
          archivedAt: null
        },
        select: {
          id: true,
          title: true,
          messageCount: true,
          avgConfidence: true,
          lastMessageAt: true,
          createdAt: true,
          messages: {
            select: {
              content: true,
              sender: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: {
          lastMessageAt: 'desc'
        },
        skip: offset,
        take: limit
      });

      const total = await this.prisma.conversation.count({
        where: {
          userId: userId,
          archivedAt: null
        }
      });

      return reply.send({
        conversations: conversations.map(conv => ({
          ...conv,
          lastMessage: conv.messages[0] || null
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get conversations error:', error);
      return reply.status(500).send({ 
        error: 'Failed to retrieve conversations' 
      });
    }
  }

  async submitFeedback(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { messageId, rating, comment } = request.body as {
        messageId: string;
        rating: number;
        comment?: string;
      };

      // Validate message belongs to user
      const message = await this.prisma.message.findFirst({
        where: {
          id: messageId,
          conversation: {
            userId: request.user.id
          }
        }
      });

      if (!message) {
        return reply.status(404).send({ error: 'Message not found' });
      }

      // Create feedback (tutti i campi obbligatori)
      await this.prisma.messageFeedback.create({
        data: {
          messageId: messageId,
          userId: request.user.id,
          feedbackType: 'POSITIVE',
          rating: rating,
          comment: comment
        }
      });

      return reply.send({ success: true });

    } catch (error) {
      console.error('Feedback error:', error);
      return reply.status(500).send({ 
        error: 'Failed to submit feedback' 
      });
    }
  }

  async getDocumentUsageStats(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;
      const query = request.query as Record<string, any>;
      const conversationId = query?.conversationId;
      const timeRange = query?.timeRange || '30d'; // 7d, 30d, 90d, 1y

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get message sources for the user's conversations
      const messageSources = await this.prisma.messageSource.findMany({
        where: {
          message: {
            conversation: {
              userId: userId,
              ...(conversationId && { id: conversationId })
            },
            createdAt: {
              gte: startDate
            }
          }
        },
        select: {
          documentId: true,
          similarityScore: true
        }
      });

      // Group by documentId manually
      const documentStatsMap = new Map();
      messageSources.forEach(source => {
        if (!documentStatsMap.has(source.documentId)) {
          documentStatsMap.set(source.documentId, {
            documentId: source.documentId,
            count: 0,
            totalScore: 0,
            scores: []
          });
        }
        const stat = documentStatsMap.get(source.documentId);
        stat.count++;
        stat.totalScore += source.similarityScore || 0;
        stat.scores.push(source.similarityScore || 0);
      });

      const documentStats = Array.from(documentStatsMap.values()).map(stat => ({
        documentId: stat.documentId,
        _count: { id: stat.count },
        _sum: { relevanceScore: stat.totalScore },
        _avg: { relevanceScore: stat.totalScore / stat.count }
      }));

      // Get document details
      const documentIds = documentStats.map(stat => stat.documentId);
      const documents = await this.prisma.document.findMany({
        where: {
          id: { in: documentIds }
        },
        select: {
          id: true,
          title: true,
          category: {
            select: {
              name: true
            }
          },
          fileMimeType: true,
          createdAt: true
        }
      });

      // Combine stats with document details
      const enrichedStats = documentStats.map(stat => {
        const document = documents.find(doc => doc.id === stat.documentId);
        return {
          documentId: stat.documentId,
          title: document?.title || 'Unknown Document',
          category: document?.category?.name || 'Uncategorized',
          fileType: document?.fileMimeType || 'unknown',
          usageCount: stat._count.id,
          totalRelevanceScore: stat._sum.relevanceScore || 0,
          averageRelevanceScore: stat._avg.relevanceScore || 0,
          uploadDate: document?.createdAt
        };
      });

      // Sort by usage count
      enrichedStats.sort((a, b) => b.usageCount - a.usageCount);

      return reply.send({
        timeRange,
        totalDocuments: enrichedStats.length,
        totalReferences: enrichedStats.reduce((sum, stat) => sum + stat.usageCount, 0),
        documents: enrichedStats
      });

    } catch (error) {
      console.error('Document usage stats error:', error);
      return reply.status(500).send({ 
        error: 'Internal server error',
        message: 'Failed to retrieve document usage statistics'
      });
    }
  }

  // Helper methods
  private sanitizeInput(content: string): string {
    return content
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 4000); // Limit length
  }

  private async getConversation(conversationId: string, userId: string) {
    return await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: userId,
        archivedAt: null
      }
    });
  }

  private async createConversation(userId: string, context?: any) {
    if (!userId) {
      throw new Error('User ID is required to create a conversation');
    }
    
    return await this.prisma.conversation.create({
      data: {
        userId: userId,
        title: null, // Will be generated from first message
        status: 'ACTIVE',
        context: context || {},
        metadata: {
          createdSource: 'chat_api',
          userAgent: 'web'
        }
      }
    });
  }

  private async getConversationHistory(conversationId: string, limit: number = 10) {
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId: conversationId,
        deletedAt: null
      },
      select: {
        content: true,
        sender: true,
        createdAt: true,
        confidence: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return messages.reverse(); // Return in chronological order
  }

  private async saveMessageSources(messageId: string, sources: any[]) {
    const sourceData = sources.map(source => ({
      messageId: messageId,
      documentId: source.documentId,
      chunkId: source.chunkId,
      relevanceScore: source.score,
      retrievalRank: source.rank || 0,
      content: source.content,
      confidence: source.confidence ?? 1,
      metadata: {
        title: source.title,
        category: source.category,
        retrievalMetadata: source.metadata
      }
    }));

    await this.prisma.messageSource.createMany({
      data: sourceData
    });
  }

  private async saveDocumentReferences(messageId: string, sources: any[]) {
    const documentReferences = sources.map(source => ({
      messageId: messageId,
      documentId: source.documentId,
      chunkId: source.chunkId,
      relevanceScore: source.score,
      retrievalRank: source.rank || 0,
      content: source.content,
      confidence: source.confidence ?? 1,
      metadata: {
        title: source.title,
        category: source.category,
        retrievalMetadata: source.metadata
      }
    }));

    await this.prisma.messageSource.createMany({
      data: documentReferences
    });
  }

  private async updateConversationStats(conversationId: string) {
    // Update message count and average confidence
    const stats = await this.prisma.message.aggregate({
      where: {
        conversationId: conversationId,
        deletedAt: null
      },
      _count: true,
      _avg: {
        confidence: true
      },
      _sum: {
        tokens: true
      }
    });

    const lastMessage = await this.prisma.message.findFirst({
      where: {
        conversationId: conversationId,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        createdAt: true,
        content: true
      }
    });

    // Generate title if not exists and we have enough messages
    let title = undefined;
    if (stats._count && stats._count > 1) {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { title: true }
      });
      
      if (!conversation?.title) {
        title = this.generateConversationTitle(lastMessage?.content || '');
      }
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        messageCount: stats._count || 0,
        avgConfidence: stats._avg.confidence,
        totalTokens: stats._sum.tokens || 0,
        lastMessageAt: lastMessage?.createdAt,
        ...(title && { title })
      }
    });
  }

  private generateConversationTitle(content: string): string {
    // Simple title generation from first user message
    const words = content.split(' ').slice(0, 6);
    return words.join(' ') + (content.split(' ').length > 6 ? '...' : '');
  }

  private async getMessageCount(conversationId: string): Promise<number> {
    return await this.prisma.message.count({
      where: {
        conversationId: conversationId,
        deletedAt: null
      }
    });
  }
}

// Route registration
export async function chatRoutes(fastify: FastifyInstance) {
  const chatController = new ChatController(
    fastify.prisma,
    fastify.ragService
  );

  // Chat endpoints
  fastify.post('/query', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', minLength: 1, maxLength: 4000 },
          conversationId: { type: 'string', format: 'uuid' },
          context: {
            type: 'object',
            properties: {
              userType: { type: 'string', enum: ['public', 'member', 'admin'] },
              location: { type: 'string' },
              farmType: { type: 'string' },
              expertise: { type: 'string' }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            userMessage: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                content: { type: 'string' },
                timestamp: { type: 'string' },
                sender: { type: 'string', const: 'user' }
              }
            },
            aiMessage: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                content: { type: 'string' },
                timestamp: { type: 'string' },
                sender: { type: 'string', const: 'ai' },
                confidence: { type: 'number' },
                processingTime: { type: 'number' },
                sources: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      content: { type: 'string' },
                      score: { type: 'number' },
                      relevance: { type: 'number' }
                    }
                  }
                }
              }
            },
            conversation: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                messageCount: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, (request, reply) => chatController.sendMessage(request as AuthenticatedRequest, reply));

  fastify.get('/conversations', {
    preHandler: [fastify.authenticate]
  }, (request, reply) => chatController.getConversations(request as AuthenticatedRequest, reply));

  fastify.post('/feedback', {
    preHandler: [fastify.authenticate]
  }, (request, reply) => chatController.submitFeedback(request as AuthenticatedRequest, reply));

  fastify.get('/document-usage-stats', {
    preHandler: [fastify.authenticate]
  }, (request, reply) => chatController.getDocumentUsageStats(request as AuthenticatedRequest, reply));
}