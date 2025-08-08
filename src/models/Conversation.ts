import { PrismaClient, Conversation, Message, ConversationStatus, MessageSender } from '@prisma/client';

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  messageCount: number;
  lastMessage: {
    content: string;
    sender: MessageSender;
    createdAt: Date;
  } | null;
  avgConfidence: number | null;
  lastMessageAt: Date | null;
  createdAt: Date;
}

export interface ConversationStats {
  totalMessages: number;
  avgConfidence: number;
  totalTokens: number;
  avgResponseTime: number;
  userMessages: number;
  aiMessages: number;
}

export interface MessageWithSources extends Message {
  sources: Array<{
    id: string;
    documentId: string;
    title: string;
    content: string;
    relevanceScore: number;
    retrievalRank: number;
  }>;
}

export class ConversationModel {
  constructor(private prisma: PrismaClient) {}

  async findByUser(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: ConversationStatus;
      includeArchived?: boolean;
    } = {}
  ): Promise<{ conversations: ConversationSummary[]; total: number }> {
    const { page = 1, limit = 20, status, includeArchived = false } = options;
    const offset = (page - 1) * limit;

    const where = {
      userId: userId,
      ...(status && { status }),
      ...(!includeArchived && { archivedAt: null })
    };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
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
        orderBy: [
          { lastMessageAt: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      this.prisma.conversation.count({ where })
    ]);

    const conversationSummaries: ConversationSummary[] = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      messageCount: conv.messageCount,
      lastMessage: conv.messages[0] || null,
      avgConfidence: conv.avgConfidence ? Number(conv.avgConfidence) : null,
      lastMessageAt: conv.lastMessageAt,
      createdAt: conv.createdAt
    }));

    return {
      conversations: conversationSummaries,
      total
    };
  }

  async findById(
    conversationId: string,
    userId: string,
    includeMessages: boolean = true
  ): Promise<ConversationWithMessages | null> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: userId,
        archivedAt: null
      },
      include: {
        messages: includeMessages ? {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            sources: {
              include: {
                document: {
                  select: {
                    title: true,
                    author: true,
                    category: { select: { name: true } }
                  }
                }
              }
            }
          }
        } : false
      }
    });

    return conversation as ConversationWithMessages;
  }

  async create(
    userId: string,
    context: any = {},
    metadata: any = {}
  ): Promise<Conversation> {
    return await this.prisma.conversation.create({
      data: {
        userId: userId,
        status: 'ACTIVE',
        context: context,
        metadata: {
          ...metadata,
          createdSource: 'api',
          createdAt: new Date().toISOString()
        }
      }
    });
  }

  async updateTitle(
    conversationId: string,
    userId: string,
    title: string
  ): Promise<Conversation | null> {
    try {
      return await this.prisma.conversation.update({
        where: {
          id: conversationId,
          userId: userId
        },
        data: { title }
      });
    } catch (error) {
      console.error('Failed to update conversation title:', error);
      return null;
    }
  }

  async updateStatus(
    conversationId: string,
    userId: string,
    status: ConversationStatus
  ): Promise<Conversation | null> {
    try {
      return await this.prisma.conversation.update({
        where: {
          id: conversationId,
          userId: userId
        },
        data: { status }
      });
    } catch (error) {
      console.error('Failed to update conversation status:', error);
      return null;
    }
  }

  async archive(
    conversationId: string,
    userId: string
  ): Promise<Conversation | null> {
    try {
      return await this.prisma.conversation.update({
        where: {
          id: conversationId,
          userId: userId
        },
        data: {
          status: 'ARCHIVED',
          archivedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      return null;
    }
  }

  async delete(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Soft delete - mark messages as deleted first
      await this.prisma.message.updateMany({
        where: {
          conversationId: conversationId,
          conversation: { userId: userId }
        },
        data: { deletedAt: new Date() }
      });

      // Then archive the conversation
      await this.archive(conversationId, userId);
      
      return true;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      return false;
    }
  }

  async getStats(
    conversationId: string,
    userId: string
  ): Promise<ConversationStats | null> {
    try {
      const conversation = await this.prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: userId
        },
        include: {
          messages: {
            where: { deletedAt: null },
            select: {
              sender: true,
              confidence: true,
              tokens: true,
              processingTimeMs: true
            }
          }
        }
      });

      if (!conversation) return null;

      const messages = conversation.messages;
      const userMessages = messages.filter(m => m.sender === 'USER').length;
      const aiMessages = messages.filter(m => m.sender === 'AI').length;
      
      const confidenceValues = messages
        .map(m => m.confidence)
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .map(c => Number(c));
      
      const processingTimes = messages
        .map(m => m.processingTimeMs)
        .filter((t): t is number => t !== null);

      const totalTokens = messages
        .map(m => m.tokens || 0)
        .reduce((sum, tokens) => sum + tokens, 0);

      return {
        totalMessages: messages.length,
        avgConfidence: confidenceValues.length > 0 
          ? confidenceValues.reduce((sum, c) => sum + Number(c), 0) / confidenceValues.length
          : 0,
        totalTokens,
        avgResponseTime: processingTimes.length > 0
          ? processingTimes.reduce((sum, t) => sum + t, 0) / processingTimes.length
          : 0,
        userMessages,
        aiMessages
      };

    } catch (error) {
      console.error('Failed to get conversation stats:', error);
      return null;
    }
  }

  async search(
    userId: string,
    query: string,
    options: {
      limit?: number;
      includeMessages?: boolean;
    } = {}
  ): Promise<ConversationSummary[]> {
    const { limit = 10, includeMessages = false } = options;

    try {
      const conversations = await this.prisma.conversation.findMany({
        where: {
          userId: userId,
          archivedAt: null,
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              messages: {
                some: {
                  content: {
                    contains: query,
                    mode: 'insensitive'
                  },
                  deletedAt: null
                }
              }
            }
          ]
        },
        select: {
          id: true,
          title: true,
          messageCount: true,
          avgConfidence: true,
          lastMessageAt: true,
          createdAt: true,
          messages: includeMessages ? {
            where: {
              content: {
                contains: query,
                mode: 'insensitive'
              },
              deletedAt: null
            },
            select: {
              content: true,
              sender: true,
              createdAt: true
            },
            take: 3
          } : {
            select: {
              content: true,
              sender: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: [
          { lastMessageAt: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });

      return conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        messageCount: conv.messageCount,
        lastMessage: conv.messages[0] || null,
        avgConfidence: conv.avgConfidence ? Number(conv.avgConfidence) : null,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt
      }));

    } catch (error) {
      console.error('Conversation search error:', error);
      return [];
    }
  }

  async updateStats(conversationId: string): Promise<void> {
    try {
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
          createdAt: true
        }
      });

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          messageCount: stats._count || 0,
          avgConfidence: stats._avg.confidence,
          totalTokens: stats._sum.tokens || 0,
          lastMessageAt: lastMessage?.createdAt
        }
      });

    } catch (error) {
      console.error('Failed to update conversation stats:', error);
    }
  }

  async getRecentForUser(
    userId: string,
    limit: number = 5
  ): Promise<ConversationSummary[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        userId: userId,
        archivedAt: null,
        status: 'ACTIVE'
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
      orderBy: [
        { lastMessageAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      messageCount: conv.messageCount,
      lastMessage: conv.messages[0] || null,
      avgConfidence: conv.avgConfidence ? Number(conv.avgConfidence) : null,
      lastMessageAt: conv.lastMessageAt,
      createdAt: conv.createdAt
    }));
  }
}