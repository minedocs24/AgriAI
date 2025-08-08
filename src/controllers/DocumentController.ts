/**
 * AgriAI Document Controller
 * 
 * Controller per gestire tutti gli endpoints di gestione documenti:
 * - POST /api/documents/upload - Multi-file upload
 * - GET /api/documents - List con filtri
 * - GET /api/documents/search - Full-text search
 * - GET /api/documents/:id - Get single document
 * - PUT /api/documents/:id - Update metadata
 * - DELETE /api/documents/:id - Soft delete
 * - POST /api/documents/:id/reprocess - Trigger reprocessing
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { PrismaClient, DocumentStatus, AccessLevel, DocumentType } from '@prisma/client';
import { z } from 'zod';
import { S3Service } from '../services/S3Service';
import { DocumentProcessor } from '../services/DocumentProcessor';
import { QueueManager } from '../queue/documentQueue';

// Validation schemas
const UploadDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().optional(),
  categoryId: z.string().uuid('Invalid category ID'),
  author: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  accessLevel: z.enum(['PUBLIC', 'MEMBER', 'ADMIN']).default('PUBLIC'),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal')
});

const UpdateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  author: z.string().optional(),
  accessLevel: z.enum(['PUBLIC', 'MEMBER', 'ADMIN']).optional(),
  tags: z.array(z.string()).optional()
});

const DocumentFiltersSchema = z.object({
  status: z.enum(['DRAFT', 'PROCESSING', 'PUBLISHED', 'ARCHIVED', 'FAILED']).optional(),
  categoryId: z.string().uuid().optional(),
  accessLevel: z.enum(['PUBLIC', 'MEMBER', 'ADMIN']).optional(),
  author: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'wordCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const SearchDocumentsSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  categories: z.array(z.string().uuid()).optional(),
  accessLevel: z.enum(['PUBLIC', 'MEMBER', 'ADMIN']).optional(),
  semantic: z.boolean().default(true),
  limit: z.number().min(1).max(50).default(10)
});

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    userType: string;
  };
}

interface FileUpload {
  filename: string;
  mimetype: string;
  encoding: string;
  buffer: Buffer;
  size: number;
}

export class DocumentController {
  constructor(
    private prisma: PrismaClient,
    private s3Service: S3Service,
    private documentProcessor: DocumentProcessor,
    private queueManager: QueueManager
  ) {}

  /**
   * POST /api/documents/upload - Multi-file upload
   */
  async uploadDocuments(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      // Handle multipart form data
      const data = await request.body as any;
      const files = await request.saveRequestFiles();
      
      if (!files || files.length === 0) {
        return reply.code(400).send({
          error: 'No files provided',
          message: 'At least one file is required'
        });
      }

      const uploadData = UploadDocumentSchema.parse(data);
      const results = [];

      // Process each file
      for (const file of files) {
        try {
          // Validate file
          this.validateFile(file);

          // Create document record
          const document = await this.prisma.document.create({
            data: {
              title: file.filename || uploadData.title,
              description: uploadData.description,
              contentType: 'FILE' as DocumentType,
              categoryId: uploadData.categoryId,
              uploadedById: request.user.id,
              author: uploadData.author,
              sourceUrl: uploadData.sourceUrl,
              accessLevel: uploadData.accessLevel as AccessLevel,
              status: 'PROCESSING' as DocumentStatus,
              extractionStatus: 'PENDING',
              indexingStatus: 'PENDING',
              fileMimeType: file.mimetype,
              fileSizeBytes: BigInt(file.file.bytesRead),
              metadata: {
                uploadedFileName: file.filename,
                tags: uploadData.tags || [],
                uploadInfo: {
                  userAgent: request.headers['user-agent'],
                  uploadedAt: new Date().toISOString()
                }
              }
            },
            include: {
              category: true,
              uploadedBy: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            }
          });

          // Upload file to S3
          const uploadResult = await this.s3Service.uploadDocument(
            document.id,
            file.file,
            file.mimetype,
            file.filename
          );

          // Update document with file path and checksum
          const updatedDocument = await this.prisma.document.update({
            where: { id: document.id },
            data: {
              filePath: uploadResult.key,
              checksumMd5: uploadResult.checksum
            },
            include: {
              category: true,
              uploadedBy: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            }
          });

          // Queue for processing
          await this.queueManager.addDocumentProcessingJob({
            documentId: document.id,
            priority: uploadData.priority || 'normal',
            userId: request.user.id
          });

          results.push({
            success: true,
            document: updatedDocument,
            queueStatus: 'queued'
          });

        } catch (fileError) {
          results.push({
            success: false,
            filename: file.filename,
            error: fileError.message
          });
        }
      }

      reply.code(201).send({
        message: 'Upload completed',
        results,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        });
      }

      reply.code(500).send({
        error: 'Upload failed',
        message: error.message
      });
    }
  }

  /**
   * GET /api/documents - List documents with filters
   */
  async getDocuments(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const filters = DocumentFiltersSchema.parse(request.query);
      
      // Build where clause based on user access level
      const whereClause: any = {
        deletedAt: null
      };

      // Apply access control
      if (request.user.userType === 'PUBLIC') {
        whereClause.accessLevel = 'PUBLIC';
        whereClause.status = 'PUBLISHED';
      } else if (request.user.userType === 'MEMBER') {
        whereClause.accessLevel = { in: ['PUBLIC', 'MEMBER'] };
        whereClause.status = 'PUBLISHED';
      }
      // ADMIN and SUPER_ADMIN can see all documents

      // Apply filters
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.categoryId) {
        whereClause.categoryId = filters.categoryId;
      }
      if (filters.accessLevel) {
        whereClause.accessLevel = filters.accessLevel;
      }
      if (filters.author) {
        whereClause.author = {
          contains: filters.author,
          mode: 'insensitive'
        };
      }
      if (filters.fromDate || filters.toDate) {
        whereClause.createdAt = {};
        if (filters.fromDate) {
          whereClause.createdAt.gte = new Date(filters.fromDate);
        }
        if (filters.toDate) {
          whereClause.createdAt.lte = new Date(filters.toDate);
        }
      }

      // Get total count
      const totalCount = await this.prisma.document.count({ where: whereClause });

      // Get documents with pagination
      const documents = await this.prisma.document.findMany({
        where: whereClause,
        include: {
          category: true,
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          _count: {
            select: {
              messageSources: true
            }
          }
        },
        orderBy: {
          [filters.sortBy]: filters.sortOrder
        },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit
      });

      const totalPages = Math.ceil(totalCount / filters.limit);

      reply.send({
        documents,
        pagination: {
          currentPage: filters.page,
          totalPages,
          totalCount,
          hasNextPage: filters.page < totalPages,
          hasPreviousPage: filters.page > 1
        },
        filters: filters
      });

    } catch (error) {
      console.error('Get documents error:', error);
      
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          error: 'Invalid filters',
          details: error.errors
        });
      }

      reply.code(500).send({
        error: 'Failed to retrieve documents',
        message: error.message
      });
    }
  }

  /**
   * GET /api/documents/search - Full-text and semantic search
   */
  async searchDocuments(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const searchParams = SearchDocumentsSchema.parse(request.query);
      
      let results = [];

      if (searchParams.semantic) {
        // Semantic search using embeddings
        results = await this.documentProcessor.semanticSearch({
          query: searchParams.query,
          categories: searchParams.categories,
          accessLevel: this.getUserAccessLevels(request.user.userType),
          limit: searchParams.limit,
          userId: request.user.id
        });
      } else {
        // Traditional full-text search
        results = await this.traditionalSearch({
          query: searchParams.query,
          categories: searchParams.categories,
          accessLevel: this.getUserAccessLevels(request.user.userType),
          limit: searchParams.limit
        });
      }

      reply.send({
        query: searchParams.query,
        searchType: searchParams.semantic ? 'semantic' : 'fulltext',
        results,
        resultCount: results.length,
        maxResults: searchParams.limit
      });

    } catch (error) {
      console.error('Search error:', error);
      
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          error: 'Invalid search parameters',
          details: error.errors
        });
      }

      reply.code(500).send({
        error: 'Search failed',
        message: error.message
      });
    }
  }

  /**
   * GET /api/documents/:id - Get single document
   */
  async getDocument(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const document = await this.prisma.document.findUnique({
        where: { 
          id,
          deletedAt: null
        },
        include: {
          category: true,
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          analysis: true,
          keywords: {
            include: {
              keyword: true
            }
          },
          _count: {
            select: {
              messageSources: true
            }
          }
        }
      });

      if (!document) {
        return reply.code(404).send({
          error: 'Document not found'
        });
      }

      // Check access permissions
      if (!this.canAccessDocument(document, request.user.userType)) {
        return reply.code(403).send({
          error: 'Access denied'
        });
      }

      reply.send({ document });

    } catch (error) {
      console.error('Get document error:', error);
      reply.code(500).send({
        error: 'Failed to retrieve document',
        message: error.message
      });
    }
  }

  /**
   * PUT /api/documents/:id - Update document metadata
   */
  async updateDocument(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const updateData = UpdateDocumentSchema.parse(request.body);

      // Check if document exists and user has permission
      const existingDocument = await this.prisma.document.findUnique({
        where: { id, deletedAt: null }
      });

      if (!existingDocument) {
        return reply.code(404).send({
          error: 'Document not found'
        });
      }

      // Check permissions (owner or admin)
      if (existingDocument.uploadedById !== request.user.id && 
          !['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
        return reply.code(403).send({
          error: 'Permission denied'
        });
      }

      // Update document
      const updatedDocument = await this.prisma.document.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          category: true,
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });

      reply.send({
        message: 'Document updated successfully',
        document: updatedDocument
      });

    } catch (error) {
      console.error('Update document error:', error);
      
      if (error.name === 'ZodError') {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        });
      }

      reply.code(500).send({
        error: 'Failed to update document',
        message: error.message
      });
    }
  }

  /**
   * DELETE /api/documents/:id - Soft delete document
   */
  async deleteDocument(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      // Check if document exists and user has permission
      const existingDocument = await this.prisma.document.findUnique({
        where: { id, deletedAt: null }
      });

      if (!existingDocument) {
        return reply.code(404).send({
          error: 'Document not found'
        });
      }

      // Check permissions (owner or admin)
      if (existingDocument.uploadedById !== request.user.id && 
          !['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
        return reply.code(403).send({
          error: 'Permission denied'
        });
      }

      // Soft delete
      await this.prisma.document.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: 'ARCHIVED'
        }
      });

      // Remove from S3 if needed (optional, for hard delete)
      // await this.s3Service.deleteDocument(existingDocument.filePath);

      reply.send({
        message: 'Document deleted successfully'
      });

    } catch (error) {
      console.error('Delete document error:', error);
      reply.code(500).send({
        error: 'Failed to delete document',
        message: error.message
      });
    }
  }

  /**
   * POST /api/documents/:id/reprocess - Trigger document reprocessing
   */
  async reprocessDocument(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const document = await this.prisma.document.findUnique({
        where: { id, deletedAt: null }
      });

      if (!document) {
        return reply.code(404).send({
          error: 'Document not found'
        });
      }

      // Check permissions (admin only)
      if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.userType)) {
        return reply.code(403).send({
          error: 'Admin permissions required'
        });
      }

      // Reset processing status
      await this.prisma.document.update({
        where: { id },
        data: {
          status: 'PROCESSING',
          extractionStatus: 'PENDING',
          indexingStatus: 'PENDING',
          processingLogs: []
        }
      });

      // Queue for reprocessing
      await this.queueManager.addDocumentProcessingJob({
        documentId: id,
        priority: 'high',
        userId: request.user.id,
        isReprocessing: true
      });

      reply.send({
        message: 'Document queued for reprocessing',
        documentId: id
      });

    } catch (error) {
      console.error('Reprocess document error:', error);
      reply.code(500).send({
        error: 'Failed to queue document for reprocessing',
        message: error.message
      });
    }
  }

  async getSystemStats(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      // Check if user has admin access
      if (request.user.userType !== 'ADMIN') {
        return reply.status(403).send({
          error: 'Access denied',
          message: 'Admin privileges required'
        });
      }

      // Get document statistics
      const [
        totalDocuments,
        publishedDocuments,
        processingDocuments,
        failedDocuments,
        totalCategories,
        totalUsers,
        queueStats,
        storageStats
      ] = await Promise.all([
        this.prisma.document.count(),
        this.prisma.document.count({ where: { status: 'PUBLISHED' } }),
        this.prisma.document.count({ where: { status: 'PROCESSING' } }),
        this.prisma.document.count({ where: { status: 'FAILED' } }),
        this.prisma.category.count(),
        this.prisma.user.count(),
        this.queueManager.getQueueStats(),
        this.s3Service.getStorageStats()
      ]);

      // Get file type distribution
      const fileTypeStats = await this.prisma.document.groupBy({
        by: ['fileMimeType'],
        _count: {
          id: true
        }
      });

      // Get category distribution
      const categoryStats = await this.prisma.document.groupBy({
        by: ['categoryId'],
        _count: {
          id: true
        }
      });

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivity = await this.prisma.document.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
        }
      });

      return reply.send({
        overview: {
          totalDocuments,
          publishedDocuments,
          processingDocuments,
          failedDocuments,
          totalCategories,
          totalUsers,
          recentActivity
        },
        fileTypes: fileTypeStats.map(stat => ({
          type: stat.fileMimeType,
          count: stat._count.id
        })),
        categories: categoryStats.map(stat => ({
          categoryId: stat.categoryId,
          count: stat._count.id
        })),
        queue: queueStats,
        storage: storageStats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('System stats error:', error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to retrieve system statistics'
      });
    }
  }

  // Helper methods
  private validateFile(file: any) {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/html',
      'application/rtf'
    ];

    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Unsupported file type: ${file.mimetype}`);
    }

    if (file.file.bytesRead > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
    }
  }

  private getUserAccessLevels(userType: string): string[] {
    switch (userType) {
      case 'PUBLIC':
        return ['PUBLIC'];
      case 'MEMBER':
        return ['PUBLIC', 'MEMBER'];
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return ['PUBLIC', 'MEMBER', 'ADMIN'];
      default:
        return ['PUBLIC'];
    }
  }

  private canAccessDocument(document: any, userType: string): boolean {
    const accessLevels = this.getUserAccessLevels(userType);
    return accessLevels.includes(document.accessLevel);
  }

  private async traditionalSearch(params: {
    query: string;
    categories?: string[];
    accessLevel: string[];
    limit: number;
  }) {
    const whereClause: any = {
      deletedAt: null,
      status: 'PUBLISHED',
      accessLevel: { in: params.accessLevel },
      OR: [
        {
          title: {
            contains: params.query,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: params.query,
            mode: 'insensitive'
          }
        },
        {
          contentExtracted: {
            contains: params.query,
            mode: 'insensitive'
          }
        }
      ]
    };

    if (params.categories && params.categories.length > 0) {
      whereClause.categoryId = { in: params.categories };
    }

    return await this.prisma.document.findMany({
      where: whereClause,
      include: {
        category: true,
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      take: params.limit,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}

// Route registration
export async function documentRoutes(fastify: FastifyInstance) {
  const documentController = new DocumentController(
    fastify.prisma,
    fastify.s3Service,
    fastify.documentProcessor,
    fastify.queueManager
  );

  // Upload documents (multipart)
  fastify.post('/upload', {
    preHandler: [fastify.authenticate],
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, (request, reply) => documentController.uploadDocuments(request as AuthenticatedRequest, reply));

  // List documents
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, (request, reply) => documentController.getDocuments(request as AuthenticatedRequest, reply));

  // Search documents
  fastify.get('/search', {
    preHandler: [fastify.authenticate]
  }, (request, reply) => documentController.searchDocuments(request as AuthenticatedRequest, reply));

  // Get single document
  fastify.get('/:id', {
    preHandler: [fastify.authenticate]
  }, (request, reply) => documentController.getDocument(request as AuthenticatedRequest, reply));

  // Update document
  fastify.put('/:id', {
    preHandler: [fastify.authenticate]
  }, (request, reply) => documentController.updateDocument(request as AuthenticatedRequest, reply));

  // Delete document
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate]
  }, (request, reply) => documentController.deleteDocument(request as AuthenticatedRequest, reply));

  // Reprocess document
  fastify.post('/:id/reprocess', {
    preHandler: [fastify.authenticate]
  }, (request, reply) => documentController.reprocessDocument(request as AuthenticatedRequest, reply));

  // Get system stats (admin only)
  fastify.get('/stats', {
    preHandler: [fastify.authenticate]
  }, (request, reply) => documentController.getSystemStats(request as AuthenticatedRequest, reply));
}