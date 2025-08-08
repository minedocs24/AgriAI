/**
 * AgriAI Authentication Controller
 * 
 * Controller per gestire tutti gli endpoints di autenticazione:
 * - POST /api/auth/login - User login
 * - POST /api/auth/logout - User logout  
 * - POST /api/auth/refresh - Refresh token
 * - GET /api/auth/me - Current user info
 * - POST /api/auth/register - User registration
 * - POST /api/auth/change-password - Change password
 * - POST /api/auth/forgot-password - Password reset request
 * - POST /api/auth/reset-password - Reset password
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createClient, RedisClientType } from 'redis';
import { z } from 'zod';
import { AuthService, LoginCredentials, RegisterData } from '../services/AuthService';

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
  deviceInfo: z.object({
    deviceType: z.string().optional(),
    deviceName: z.string().optional(),
    browserName: z.string().optional(),
    osName: z.string().optional()
  }).optional()
});

const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  organizationId: z.string().uuid().optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  acceptPrivacy: z.boolean().refine(val => val === true, 'You must accept the privacy policy')
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Response interfaces
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

interface AuthResponse {
  user: any;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
  session: any;
}

export class AuthController {
  private authService: AuthService;
  private prisma: PrismaClient;
  private redis: RedisClientType;

  constructor(prisma: PrismaClient, redis: RedisClientType) {
    this.prisma = prisma;
    this.redis = redis;
    this.authService = new AuthService(prisma, redis);
  }

  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<Response> {
    try {
      // Validate request body
      const validationResult = LoginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Invalid request data',
          details: validationResult.error.issues,
          timestamp: new Date().toISOString()
        });
      }

      const { email, password, rememberMe, deviceInfo } = validationResult.data;

      // Prepare login credentials
      const credentials: LoginCredentials = {
        email,
        password,
        deviceInfo,
        ipAddress: this.getClientIp(req),
        userAgent: req.headers['user-agent']
      };

      // Perform login
      const authResult = await this.authService.login(credentials);

      // Set refresh token in httpOnly cookie if rememberMe is true
      if (rememberMe) {
        res.cookie('refresh_token', authResult.tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          user: authResult.user,
          tokens: authResult.tokens,
          session: {
            id: authResult.session.id,
            expiresAt: authResult.session.expiresAt,
            deviceInfo: authResult.session.deviceInfo
          }
        },
        message: 'Login successful',
        timestamp: new Date().toISOString()
      };

      return res.status(200).json(response);

    } catch (error) {
      console.error('Login error:', error);
      
      return res.status(401).json({
        success: false,
        error: 'authentication_failed',
        message: error instanceof Error ? error.message : 'Login failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<Response> {
    try {
      // Validate request body
      const validationResult = RegisterSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Invalid request data',
          details: validationResult.error.issues,
          timestamp: new Date().toISOString()
        });
      }

      const { email, password, firstName, lastName, organizationId } = validationResult.data;

      // Prepare registration data
      const userData: RegisterData = {
        email,
        password,
        firstName,
        lastName,
        organizationId
      };

      // Perform registration
      const authResult = await this.authService.register(userData);

      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          user: authResult.user,
          tokens: authResult.tokens,
          session: {
            id: authResult.session.id,
            expiresAt: authResult.session.expiresAt,
            deviceInfo: authResult.session.deviceInfo
          }
        },
        message: 'Registration successful',
        timestamp: new Date().toISOString()
      };

      return res.status(201).json(response);

    } catch (error) {
      console.error('Registration error:', error);
      
      return res.status(400).json({
        success: false,
        error: 'registration_failed',
        message: error instanceof Error ? error.message : 'Registration failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<Response> {
    try {
      const accessToken = this.extractToken(req);
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

      if (accessToken) {
        await this.authService.logout(accessToken, refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refresh_token');

      return res.status(200).json({
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if logout fails, we should clear the cookie and return success
      res.clearCookie('refresh_token');
      
      return res.status(200).json({
        success: true,
        message: 'Logout completed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response): Promise<Response> {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'missing_refresh_token',
          message: 'Refresh token is required',
          timestamp: new Date().toISOString()
        });
      }

      // Refresh tokens
      const newTokens = await this.authService.refreshToken(refreshToken);

      // Update refresh token cookie
      res.cookie('refresh_token', newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(200).json({
        success: true,
        data: {
          tokens: newTokens
        },
        message: 'Token refreshed successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      
      // Clear invalid refresh token
      res.clearCookie('refresh_token');
      
      return res.status(401).json({
        success: false,
        error: 'refresh_failed',
        message: 'Failed to refresh token. Please login again.',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /api/auth/me
   */
  async getCurrentUser(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'not_authenticated',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      // Get complete user info
      const user = await this.authService.getCurrentUser(req.user.sub);

      return res.status(200).json({
        success: true,
        data: {
          user,
          session: req.session
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get current user error:', error);
      
      return res.status(500).json({
        success: false,
        error: 'user_fetch_failed',
        message: 'Failed to fetch user information',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'not_authenticated',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      // Validate request body
      const validationResult = ChangePasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Invalid request data',
          details: validationResult.error.issues,
          timestamp: new Date().toISOString()
        });
      }

      const { currentPassword, newPassword } = validationResult.data;

      // Change password
      await this.authService.changePassword(req.user.sub, currentPassword, newPassword);

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Change password error:', error);
      
      return res.status(400).json({
        success: false,
        error: 'password_change_failed',
        message: error instanceof Error ? error.message : 'Failed to change password',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response): Promise<Response> {
    try {
      // Validate request body
      const validationResult = ForgotPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Invalid email format',
          timestamp: new Date().toISOString()
        });
      }

      const { email } = validationResult.data;

      // Always return success for security (don't leak user existence)
      // But actually send email only if user exists
      
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (user) {
        // Generate reset token (implement your preferred method)
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save reset token to database
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            passwordResetToken: resetToken,
            passwordResetExpires: resetExpires
          }
        });

        // TODO: Send password reset email
        // await this.emailService.sendPasswordResetEmail(email, resetToken);
      }

      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      
      return res.status(500).json({
        success: false,
        error: 'forgot_password_failed',
        message: 'Failed to process password reset request',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      // Validate request body
      const validationResult = ResetPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Invalid request data',
          details: validationResult.error.issues,
          timestamp: new Date().toISOString()
        });
      }

      const { token, newPassword } = validationResult.data;

      // Find user by reset token
      const user = await this.prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'invalid_token',
          message: 'Invalid or expired reset token',
          timestamp: new Date().toISOString()
        });
      }

      // Hash new password
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password and clear reset token
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });

      // Revoke all existing sessions
      await this.prisma.userSession.updateMany({
        where: { userId: user.id },
        data: { revokedAt: new Date() }
      });

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Reset password error:', error);
      
      return res.status(500).json({
        success: false,
        error: 'password_reset_failed',
        message: 'Failed to reset password',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /api/auth/sessions
   */
  async getUserSessions(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'not_authenticated',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      const sessions = await this.prisma.userSession.findMany({
        where: {
          userId: req.user.sub,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        },
        select: {
          id: true,
          deviceInfo: true,
          ipAddress: true,
          lastAccessedAt: true,
          createdAt: true,
          expiresAt: true
        },
        orderBy: { lastAccessedAt: 'desc' }
      });

      return res.status(200).json({
        success: true,
        data: {
          sessions: sessions.map(session => ({
            ...session,
            isCurrent: session.id === req.session?.id
          }))
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get user sessions error:', error);
      
      return res.status(500).json({
        success: false,
        error: 'sessions_fetch_failed',
        message: 'Failed to fetch user sessions',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * DELETE /api/auth/sessions/:sessionId
   */
  async revokeSession(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'not_authenticated',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      const { sessionId } = req.params;

      // Revoke the specified session
      const result = await this.prisma.userSession.updateMany({
        where: {
          id: sessionId,
          userId: req.user.sub
        },
        data: {
          revokedAt: new Date()
        }
      });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'session_not_found',
          message: 'Session not found',
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Session revoked successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Revoke session error:', error);
      
      return res.status(500).json({
        success: false,
        error: 'session_revoke_failed',
        message: 'Failed to revoke session',
        timestamp: new Date().toISOString()
      });
    }
  }

  // === UTILITY METHODS ===

  /**
   * Extract token from request
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Get client IP address
   */
  private getClientIp(req: Request): string {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      '127.0.0.1'
    );
  }
}

// Export controller factory
export function createAuthController(prisma: PrismaClient, redis: RedisClientType): AuthController {
  return new AuthController(prisma, redis);
}