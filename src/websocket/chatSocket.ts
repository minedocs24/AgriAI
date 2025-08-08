import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

interface WebSocketUser {
  id: string;
  email: string;
  userType: string;
}

interface WebSocketMessage {
  type: 'chat_message' | 'typing_start' | 'typing_stop' | 'user_presence' | 'message_response' | 'error';
  data?: any;
  content?: string;
  conversationId?: string;
  context?: any;
  timestamp?: string;
}

interface ConnectedUser {
  id: string;
  socket: any; // Changed from SocketStream to any
  user: WebSocketUser;
  activeConversations: Set<string>;
  lastActivity: Date;
}

export class ChatWebSocketManager {
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private conversationUsers: Map<string, Set<string>> = new Map();

  constructor(private prisma: PrismaClient) {
    // Cleanup inactive connections every 5 minutes
    setInterval(() => this.cleanupInactiveConnections(), 5 * 60 * 1000);
  }

  async handleConnection(connection: any, request: any) {
    try {
      // Authenticate user from query parameters or headers
      const token = this.extractToken(request);
      const user = await this.authenticateToken(token);
      
      if (!user) {
        connection.socket.send(JSON.stringify({
          type: 'error',
          data: { message: 'Authentication failed' }
        }));
        connection.socket.close();
        return;
      }

      // Register connected user
      const connectedUser: ConnectedUser = {
        id: user.id,
        socket: connection,
        user: user,
        activeConversations: new Set(),
        lastActivity: new Date()
      };

      this.connectedUsers.set(user.id, connectedUser);

      // Send welcome message
      this.sendToUser(user.id, {
        type: 'user_presence',
        data: { 
          status: 'connected',
          userId: user.id,
          timestamp: new Date().toISOString()
        }
      });

      // Set up message handlers
      connection.socket.on('message', (message: Buffer) => {
        this.handleMessage(user.id, message);
      });

      // Handle disconnection
      connection.socket.on('close', () => {
        this.handleDisconnection(user.id);
      });

      connection.socket.on('error', (error) => {
        console.error(`WebSocket error for user ${user.id}:`, error);
        this.handleDisconnection(user.id);
      });

      console.log(`User ${user.id} connected via WebSocket`);

    } catch (error) {
      console.error('WebSocket connection error:', error);
      connection.socket.close();
    }
  }

  private async handleMessage(userId: string, message: Buffer) {
    try {
      const connectedUser = this.connectedUsers.get(userId);
      if (!connectedUser) return;

      // Update last activity
      connectedUser.lastActivity = new Date();

      const data: WebSocketMessage = JSON.parse(message.toString());

      switch (data.type) {
        case 'chat_message':
          await this.handleChatMessage(userId, data);
          break;

        case 'typing_start':
          this.handleTypingIndicator(userId, data, true);
          break;

        case 'typing_stop':
          this.handleTypingIndicator(userId, data, false);
          break;

        case 'user_presence':
          this.handlePresenceUpdate(userId, data);
          break;

        default:
          console.warn(`Unknown message type: ${data.type}`);
      }

    } catch (error) {
      console.error('Message handling error:', error);
      this.sendToUser(userId, {
        type: 'error',
        data: { message: 'Failed to process message' }
      });
    }
  }

  private async handleChatMessage(userId: string, data: WebSocketMessage) {
    try {
      if (!data.content?.trim()) return;

      const connectedUser = this.connectedUsers.get(userId);
      if (!connectedUser) return;

      // Join conversation room if specified
      if (data.conversationId) {
        this.joinConversation(userId, data.conversationId);
      }

      // Send typing indicator to other users in conversation
      if (data.conversationId) {
        this.broadcastToConversation(data.conversationId, userId, {
          type: 'typing_start',
          data: {
            userId: userId,
            conversationId: data.conversationId,
            userEmail: connectedUser.user.email
          }
        });
      }

      // Process message through chat API
      // This will trigger the ChatController which will emit the response back via WebSocket
      console.log(`Received chat message from ${userId}: ${data.content}`);

    } catch (error) {
      console.error('Chat message handling error:', error);
      this.sendToUser(userId, {
        type: 'error',
        data: { message: 'Failed to process chat message' }
      });
    }
  }

  private handleTypingIndicator(userId: string, data: WebSocketMessage, isTyping: boolean) {
    if (!data.conversationId) return;

    const connectedUser = this.connectedUsers.get(userId);
    if (!connectedUser) return;

    // Broadcast typing indicator to other users in the conversation
    this.broadcastToConversation(data.conversationId, userId, {
      type: isTyping ? 'typing_start' : 'typing_stop',
      data: {
        userId: userId,
        conversationId: data.conversationId,
        userEmail: connectedUser.user.email,
        timestamp: new Date().toISOString()
      }
    });

    // Auto-stop typing after 5 seconds if no stop signal received
    if (isTyping) {
      setTimeout(() => {
        this.handleTypingIndicator(userId, data, false);
      }, 5000);
    }
  }

  private handlePresenceUpdate(userId: string, data: WebSocketMessage) {
    // Update user presence status
    console.log(`User ${userId} presence update:`, data.data);
  }

  private handleDisconnection(userId: string) {
    const connectedUser = this.connectedUsers.get(userId);
    if (!connectedUser) return;

    // Remove from all conversations
    for (const conversationId of connectedUser.activeConversations) {
      this.leaveConversation(userId, conversationId);
    }

    // Remove from connected users
    this.connectedUsers.delete(userId);

    console.log(`User ${userId} disconnected from WebSocket`);
  }

  // Public methods for emitting messages
  public sendToUser(userId: string, message: WebSocketMessage) {
    const connectedUser = this.connectedUsers.get(userId);
    if (!connectedUser || connectedUser.socket.socket.readyState !== 1) {
      return false; // User not connected or socket not ready
    }

    try {
      connectedUser.socket.socket.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      console.error(`Failed to send message to user ${userId}:`, error);
      return false;
    }
  }

  public broadcastToConversation(conversationId: string, excludeUserId?: string, message?: WebSocketMessage) {
    const userIds = this.conversationUsers.get(conversationId);
    if (!userIds) return;

    for (const userId of userIds) {
      if (excludeUserId && userId === excludeUserId) continue;
      
      if (message) {
        this.sendToUser(userId, message);
      }
    }
  }

  public joinConversation(userId: string, conversationId: string) {
    const connectedUser = this.connectedUsers.get(userId);
    if (!connectedUser) return;

    // Add user to conversation
    connectedUser.activeConversations.add(conversationId);

    // Add to conversation users set
    if (!this.conversationUsers.has(conversationId)) {
      this.conversationUsers.set(conversationId, new Set());
    }
    this.conversationUsers.get(conversationId)!.add(userId);

    console.log(`User ${userId} joined conversation ${conversationId}`);
  }

  public leaveConversation(userId: string, conversationId: string) {
    const connectedUser = this.connectedUsers.get(userId);
    if (connectedUser) {
      connectedUser.activeConversations.delete(conversationId);
    }

    const conversationUsers = this.conversationUsers.get(conversationId);
    if (conversationUsers) {
      conversationUsers.delete(userId);
      
      // Remove empty conversation
      if (conversationUsers.size === 0) {
        this.conversationUsers.delete(conversationId);
      }
    }

    console.log(`User ${userId} left conversation ${conversationId}`);
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getConversationUsers(conversationId: string): string[] {
    return Array.from(this.conversationUsers.get(conversationId) || []);
  }

  // Private helper methods
  private extractToken(request: any): string | null {
    // Try to get token from query parameters first
    if (request.query?.token) {
      return request.query.token;
    }

    // Try to get from headers
    const authHeader = request.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  private async authenticateToken(token: string | null): Promise<WebSocketUser | null> {
    if (!token) return null;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Verify user exists in database
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          userType: true,
          emailVerified: true
        }
      });

      // Rimuovi controllo isActive
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        userType: user.userType
      };

    } catch (error) {
      console.error('Token authentication error:', error);
      return null;
    }
  }

  private cleanupInactiveConnections() {
    const now = new Date();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [userId, connectedUser] of this.connectedUsers.entries()) {
      if (now.getTime() - connectedUser.lastActivity.getTime() > timeout) {
        console.log(`Cleaning up inactive connection for user ${userId}`);
        connectedUser.socket.socket.close();
        this.handleDisconnection(userId);
      }
    }
  }

  // Handle document processing updates
  handleDocumentProcessingUpdate(userId: string, documentId: string, status: string, progress?: number) {
    const userConnection = this.connectedUsers.get(userId);
    if (userConnection) {
      userConnection.socket.socket.send(JSON.stringify({
        type: 'document_processing_update',
        data: {
          documentId,
          status,
          progress,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }

  // Handle document upload completion
  handleDocumentUploadComplete(userId: string, document: any) {
    const userConnection = this.connectedUsers.get(userId);
    if (userConnection) {
      userConnection.socket.socket.send(JSON.stringify({
        type: 'document_upload_complete',
        data: {
          document,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }

  // Handle document search results
  handleDocumentSearchResults(userId: string, query: string, results: any[]) {
    const userConnection = this.connectedUsers.get(userId);
    if (userConnection) {
      userConnection.socket.socket.send(JSON.stringify({
        type: 'document_search_results',
        data: {
          query,
          results,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }
}

// Global WebSocket manager instance
export let websocketManager: ChatWebSocketManager;

// WebSocket route registration
export async function registerChatWebSocket(fastify: FastifyInstance) {
  // Initialize WebSocket manager
  websocketManager = new ChatWebSocketManager(fastify.prisma);
  
  // Make it globally available for ChatController
  (global as any).websocketManager = websocketManager;

  // Register WebSocket route
  fastify.register(async function (fastify) {
    fastify.get('/ws/chat', { websocket: true }, (connection, request) => {
      websocketManager.handleConnection(connection, request);
    });
  });

  // Health check endpoint for WebSocket
  fastify.get('/ws/health', async (request, reply) => {
    const connectedUsers = websocketManager.getConnectedUsers();
    return {
      status: 'healthy',
      connectedUsers: connectedUsers.length,
      timestamp: new Date().toISOString()
    };
  });

  console.log('Chat WebSocket server registered at /ws/chat');
}