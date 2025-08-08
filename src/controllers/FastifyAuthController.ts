import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
});

const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  organizationId: z.string().uuid().optional()
});

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    userType: string;
  };
}

export class FastifyAuthController {
  constructor(private prisma: PrismaClient) {}

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = LoginSchema.parse(request.body);
      const { email, password, rememberMe } = body;

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              subscriptionTier: true
            }
          },
          preferences: true
        }
      });

      if (!user) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          userType: user.userType 
        },
        process.env.JWT_SECRET!,
        { expiresIn: rememberMe ? '7d' : '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      );

      // Create or update session
      const sessionToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
      const existingSession = await this.prisma.userSession.findFirst({
        where: { userId: user.id }
      });

      if (existingSession) {
        await this.prisma.userSession.update({
          where: { id: existingSession.id },
          data: {
            sessionToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            lastAccessedAt: new Date()
          }
        });
      } else {
        await this.prisma.userSession.create({
          data: {
            userId: user.id,
            sessionToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            deviceInfo: {
              userAgent: request.headers['user-agent'] || 'unknown',
              ip: request.ip || 'unknown'
            }
          }
        });
      }

      // Remove sensitive data
      const { passwordHash, ...userWithoutPassword } = user;

      return reply.send({
        success: true,
        data: {
          user: userWithoutPassword,
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: rememberMe ? 7 * 24 * 60 * 60 : 15 * 60,
            tokenType: 'Bearer'
          }
        },
        message: 'Login successful'
      });

    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process login request'
      });
    }
  }

  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = RegisterSchema.parse(request.body);
      const { email, password, firstName, lastName, organizationId } = body;

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return reply.status(409).send({
          success: false,
          error: 'User already exists',
          message: 'A user with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash: hashedPassword,
          firstName,
          lastName,
          organizationId,
          userType: organizationId ? 'MEMBER' : 'PUBLIC',
          emailVerified: false
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              subscriptionTier: true
            }
          }
        }
      });

      // Create user preferences
      await this.prisma.userPreferences.create({
        data: {
          userId: user.id,
          language: 'it',
          timezone: 'Europe/Rome',
          aiSettings: {
            response_length: 'standard',
            technical_level: 'intermediate',
            preferred_topics: ['agricoltura', 'sostenibilita']
          },
          uiPreferences: {
            theme: 'light',
            density: 'comfortable',
            dashboard_layout: 'standard'
          }
        }
      });

      // Generate tokens
      const accessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          userType: user.userType 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      );

                    // Create session
        const sessionToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
        await this.prisma.userSession.create({
          data: {
            userId: user.id,
            sessionToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            deviceInfo: {
              userAgent: request.headers['user-agent'] || 'unknown',
              ip: request.ip || 'unknown'
            }
          }
        });

      // Remove sensitive data
      const { passwordHash, ...userWithoutPassword } = user;

      return reply.status(201).send({
        success: true,
        data: {
          user: userWithoutPassword,
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60,
            tokenType: 'Bearer'
          }
        },
        message: 'Registration successful'
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process registration request'
      });
    }
  }

  async logout(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;

      // Remove session
      await this.prisma.userSession.deleteMany({
        where: { userId }
      });

      return reply.send({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process logout request'
      });
    }
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { refreshToken } = request.body as { refreshToken: string };

      if (!refreshToken) {
        return reply.status(400).send({
          success: false,
          error: 'Refresh token required',
          message: 'Please provide a refresh token'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      // Check if session exists
      const session = await this.prisma.userSession.findFirst({
        where: {
          userId: decoded.userId,
          refreshToken,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              userType: true
            }
          }
        }
      });

      if (!session) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid refresh token',
          message: 'Refresh token is invalid or expired'
        });
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { 
          userId: session.user.id, 
          email: session.user.email, 
          userType: session.user.userType 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      return reply.send({
        success: true,
        data: {
          accessToken,
          expiresIn: 15 * 60,
          tokenType: 'Bearer'
        },
        message: 'Token refreshed successfully'
      });

    } catch (error) {
      console.error('Refresh error:', error);
      return reply.status(401).send({
        success: false,
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid or expired'
      });
    }
  }

  async getCurrentUser(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              subscriptionTier: true
            }
          },
          preferences: true
        }
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found',
          message: 'User not found'
        });
      }

      // Remove sensitive data
      const { passwordHash, ...userWithoutPassword } = user;

      return reply.send({
        success: true,
        data: {
          user: userWithoutPassword
        }
      });

    } catch (error) {
      console.error('Get current user error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get current user'
      });
    }
  }
}

// Route registration
export async function authRoutes(fastify: FastifyInstance) {
  const authController = new FastifyAuthController(fastify.prisma);

  // Auth endpoints
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
          rememberMe: { type: 'boolean' }
        }
      }
    }
  }, (request, reply) => authController.login(request, reply));

  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string', minLength: 1, maxLength: 100 },
          lastName: { type: 'string', minLength: 1, maxLength: 100 },
          organizationId: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, (request, reply) => authController.register(request, reply));

  fastify.post('/logout', {
    preHandler: [fastify.authenticate]
  }, (request, reply) => authController.logout(request as AuthenticatedRequest, reply));

  fastify.post('/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', minLength: 1 }
        }
      }
    }
  }, (request, reply) => authController.refresh(request, reply));

  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, (request, reply) => authController.getCurrentUser(request as AuthenticatedRequest, reply));
} 