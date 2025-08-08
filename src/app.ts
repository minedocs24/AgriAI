import Fastify, { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { RAGService } from './services/RAGService';
import { S3Service } from './services/S3Service';
import { DocumentProcessor } from './services/DocumentProcessor';
import { QueueManager } from './queue/documentQueue';
import { registerChatWebSocket } from './websocket/chatSocket';
import { chatRoutes } from './controllers/ChatController';
import { documentRoutes } from './controllers/DocumentController';
import { authRoutes } from './controllers/FastifyAuthController';
import fastifyJwt from '@fastify/jwt';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyMultipart from '@fastify/multipart';

export interface AppOptions {
  logger?: boolean;
  test?: boolean;
}

export async function build(opts: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opts.logger !== false ? {
      level: process.env.LOG_LEVEL || 'info'
    } : false
  });

  // Initialize database
  const prisma = new PrismaClient({
    log: opts.test ? [] : ['query', 'info', 'warn', 'error']
  });

  // Initialize services
  const ragService = new RAGService(prisma);
  
  // Initialize Document Management Services
  const s3Service = new S3Service();
  
  const documentProcessor = new DocumentProcessor(prisma);
  
  const queueManager = new QueueManager(prisma);

  // Decorate Fastify instance with services
  app.decorate('prisma', prisma);
  app.decorate('ragService', ragService);
  app.decorate('s3Service', s3Service);
  app.decorate('documentProcessor', documentProcessor);
  app.decorate('queueManager', queueManager);

  // Register plugins
  await app.register(fastifyCors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:5173',
        'http://172.30.64.1:8080',
        'http://localhost:8080'
      ];
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key'
  });

  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return (request.user as any)?.id || request.ip;
    }
  });

  await app.register(fastifyWebsocket);
  
  // Register multipart for file uploads
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 10 // Max 10 files per request
    }
  });

  // Authentication decorator
  app.decorate('authenticate', async function(request: any, reply: any) {
    try {
      await request.jwtVerify();
      
      // Extract user information from JWT payload and set it on request
      const payload = request.user as any;
      if (payload) {
        request.user = {
          id: payload.userId,
          email: payload.email,
          userType: payload.userType
        };
      }
    } catch (err) {
      reply.send(err);
    }
  });

  // Health check endpoint
  app.get('/health', async (request, reply) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      
      // Check queue status
      const queueStats = await queueManager.getQueueStats();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: 'connected',
          rag: 'ready',
          websocket: 'active',
          documents: 'ready',
          queue: queueStats
        }
      };
    } catch (error) {
      reply.status(503).send({
        status: 'unhealthy',
        error: 'Service check failed',
        details: error.message
      });
    }
  });

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(chatRoutes, { prefix: '/api/chat' });
  await app.register(documentRoutes, { prefix: '/api/documents' });

  // Register WebSocket
  if (!opts.test) {
    await registerChatWebSocket(app as any);
  }

  // Error handler
  app.setErrorHandler(async (error, request, reply) => {
    app.log.error(error);

    // JWT errors
    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      return reply.status(401).send({
        error: 'Authorization header required',
        message: 'Please provide a valid JWT token'
      });
    }

    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
      return reply.status(401).send({
        error: 'Invalid token',
        message: 'The provided JWT token is invalid'
      });
    }

    // Rate limiting errors
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    }

    // File upload errors
    if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.status(413).send({
        error: 'File too large',
        message: 'The uploaded file exceeds the maximum allowed size of 50MB'
      });
    }

    // Validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation error',
        details: error.validation
      });
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  });

  // Graceful shutdown
  const gracefulShutdown = async () => {
    app.log.info('Starting graceful shutdown...');
    
    try {
      await app.close();
      await queueManager.shutdown();
      await prisma.$disconnect();
      app.log.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      app.log.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  return app;
}

// Server startup
export async function start() {
  try {
    const app = await build();
    
    const host = process.env.HOST || '0.0.0.0';
    const port = parseInt(process.env.PORT || '3000');

    await app.listen({ host, port });
    
    app.log.info(`🌾 AgriAI Chat Server started successfully!`);
    app.log.info(`📡 Server listening on http://${host}:${port}`);
    app.log.info(`🔗 WebSocket available at ws://${host}:${port}/ws/chat`);
    app.log.info(`📄 Document API available at http://${host}:${port}/api/documents`);
    app.log.info(`💚 Health check: http://${host}:${port}/health`);

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Type declarations for Fastify decorators
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    ragService: RAGService;
    s3Service: S3Service;
    documentProcessor: DocumentProcessor;
    queueManager: QueueManager;
    authenticate: (request: any, reply: any) => Promise<void>;
    websocketManager?: any;
  }
}