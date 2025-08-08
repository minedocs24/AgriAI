/**
 * AgriAI Authentication Service
 * 
 * Servizio completo per autenticazione JWT con:
 * - Token generation e validation
 * - Refresh token mechanism
 * - Blacklist management
 * - Password hashing con bcrypt
 * - Rate limiting integration
 * - Audit logging
 */

import { PrismaClient, User, UserSession, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { createClient, RedisClientType } from 'redis';

// Interfaces
export interface LoginCredentials {
  email: string;
  password: string;
  deviceInfo?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  tokens: TokenPair;
  session: UserSession;
}

export interface UserPayload {
  sub: string; // userId
  email: string;
  userType: UserType;
  organizationId?: string;
  sessionId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface RefreshPayload {
  sub: string; // userId
  sessionId: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

// Configuration
const AUTH_CONFIG = {
  // JWT Configuration
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  accessTokenTTL: '15m', // 15 minutes
  refreshTokenTTL: '7d', // 7 days
  issuer: 'agriai-api',
  audience: 'agriai-client',
  
  // Password Configuration
  saltRounds: 12,
  minPasswordLength: 8,
  
  // Rate Limiting
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60, // 15 minutes in seconds
  
  // Token Blacklist
  blacklistKeyPrefix: 'blacklist:',
  sessionKeyPrefix: 'session:',
  loginAttemptsPrefix: 'login_attempts:',
};

export class AuthService {
  private prisma: PrismaClient;
  private redis: RedisClientType;

  constructor(prisma: PrismaClient, redis: RedisClientType) {
    this.prisma = prisma;
    this.redis = redis;
  }

  /**
   * User Login
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { email, password, deviceInfo, ipAddress, userAgent } = credentials;

    // Rate limiting check
    await this.checkRateLimit(email);

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { organization: true }
    });

    if (!user) {
      await this.recordFailedAttempt(email);
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account temporarily locked due to too many failed attempts');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      await this.recordFailedAttempt(email);
      await this.incrementFailedAttempts(user.id);
      throw new Error('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await this.clearFailedAttempts(email);
    await this.resetUserLockout(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session
    const session = await this.createSession(user.id, tokens.refreshToken, {
      deviceInfo,
      ipAddress,
      userAgent
    });

    // Update user login stats
    await this.updateLoginStats(user.id, ipAddress);

    // Log successful login
    await this.logAuthEvent('login_success', user.id, { ipAddress, userAgent });

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
      session
    };
  }

  /**
   * User Registration
   */
  async register(userData: RegisterData): Promise<AuthResult> {
    const { email, password, firstName, lastName, organizationId } = userData;

    // Validate password strength
    this.validatePassword(password);

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        organizationId,
        userType: organizationId ? 'MEMBER' : 'PUBLIC',
        emailVerified: false // In production, implement email verification
      },
      include: { organization: true }
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session
    const session = await this.createSession(user.id, tokens.refreshToken);

    // Log registration
    await this.logAuthEvent('user_registered', user.id);

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
      session
    };
  }

  /**
   * Refresh Token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = jwt.verify(
        refreshToken,
        AUTH_CONFIG.refreshTokenSecret
      ) as RefreshPayload;

      // Check if refresh token is blacklisted
      const isBlacklisted = await this.redis.get(
        `${AUTH_CONFIG.blacklistKeyPrefix}${refreshToken}`
      );
      if (isBlacklisted) {
        throw new Error('Refresh token has been revoked');
      }

      // Find user and session
      const session = await this.prisma.userSession.findUnique({
        where: { 
          id: payload.sessionId,
          refreshToken,
          revokedAt: null
        },
        include: { user: true }
      });

      if (!session || session.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      // Generate new token pair
      const newTokens = await this.generateTokens(session.user);

      // Update session with new refresh token
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: {
          refreshToken: newTokens.refreshToken,
          lastAccessedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // Blacklist old refresh token
      await this.blacklistToken(refreshToken, '7d');

      return newTokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logout
   */
  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      // Decode access token to get session info
      const payload = jwt.decode(accessToken) as UserPayload;
      
      if (payload && payload.sessionId) {
        // Revoke session
        await this.prisma.userSession.update({
          where: { id: payload.sessionId },
          data: { revokedAt: new Date() }
        });

        // Log logout
        await this.logAuthEvent('logout', payload.sub);
      }

      // Blacklist tokens
      await this.blacklistToken(accessToken, AUTH_CONFIG.accessTokenTTL);
      if (refreshToken) {
        await this.blacklistToken(refreshToken, AUTH_CONFIG.refreshTokenTTL);
      }
    } catch (error) {
      // Even if token is invalid, we should try to logout gracefully
      console.error('Error during logout:', error);
    }
  }

  /**
   * Validate Access Token
   */
  async validateToken(token: string): Promise<UserPayload> {
    try {
      // Verify JWT
      const payload = jwt.verify(
        token,
        AUTH_CONFIG.accessTokenSecret
      ) as UserPayload;

      // Check if token is blacklisted
      const isBlacklisted = await this.redis.get(
        `${AUTH_CONFIG.blacklistKeyPrefix}${token}`
      );
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      // Verify session is still active
      const session = await this.prisma.userSession.findFirst({
        where: {
          id: payload.sessionId,
          userId: payload.sub,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        }
      });

      if (!session) {
        throw new Error('Session expired or revoked');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get Current User
   */
  async getCurrentUser(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true, preferences: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Change Password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    this.validatePassword(newPassword);

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    // Revoke all sessions except current one
    await this.revokeAllUserSessions(userId);

    // Log password change
    await this.logAuthEvent('password_changed', userId);
  }

  // === PRIVATE METHODS ===

  /**
   * Generate JWT Token Pair
   */
  private async generateTokens(user: User): Promise<TokenPair> {
    const now = Math.floor(Date.now() / 1000);

    // Access token payload
    const accessPayload: Omit<UserPayload, 'sessionId'> = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
      organizationId: user.organizationId || undefined,
      iat: now,
      exp: now + 15 * 60, // 15 minutes
      iss: AUTH_CONFIG.issuer,
      aud: AUTH_CONFIG.audience
    };

    // Generate temporary session ID for tokens
    const sessionId = randomBytes(16).toString('hex');

    // Access token
    const accessToken = (jwt as any).sign(
      { ...accessPayload, sessionId },
      AUTH_CONFIG.accessTokenSecret,
      { expiresIn: AUTH_CONFIG.accessTokenTTL }
    );

    // Refresh token payload
    const refreshPayload: Omit<RefreshPayload, 'sessionId'> = {
      sub: user.id,
      type: 'refresh',
      iat: now,
      exp: now + 7 * 24 * 60 * 60 // 7 days
    };

    // Refresh token
    const refreshToken = (jwt as any).sign(
      { ...refreshPayload, sessionId },
      AUTH_CONFIG.refreshTokenSecret,
      { expiresIn: AUTH_CONFIG.refreshTokenTTL }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: 'Bearer'
    };
  }

  /**
   * Create User Session
   */
  private async createSession(
    userId: string,
    refreshToken: string,
    sessionData: {
      deviceInfo?: any;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<UserSession> {
    return await this.prisma.userSession.create({
      data: {
        userId,
        sessionToken: createHash('sha256').update(refreshToken).digest('hex'),
        refreshToken,
        deviceInfo: sessionData.deviceInfo || null,
        ipAddress: sessionData.ipAddress || null,
        locationInfo: null, // Implement geolocation if needed
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        lastAccessedAt: new Date()
      }
    });
  }

  /**
   * Hash Password
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, AUTH_CONFIG.saltRounds);
  }

  /**
   * Validate Password Strength
   */
  private validatePassword(password: string): void {
    if (password.length < AUTH_CONFIG.minPasswordLength) {
      throw new Error(`Password must be at least ${AUTH_CONFIG.minPasswordLength} characters long`);
    }

    // Add more password strength checks as needed
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }
  }

  /**
   * Rate Limiting Check
   */
  private async checkRateLimit(email: string): Promise<void> {
    const key = `${AUTH_CONFIG.loginAttemptsPrefix}${email}`;
    const attempts = await this.redis.get(key);
    
    if (attempts && parseInt(attempts) >= AUTH_CONFIG.maxLoginAttempts) {
      throw new Error('Too many login attempts. Please try again later.');
    }
  }

  /**
   * Record Failed Login Attempt
   */
  private async recordFailedAttempt(email: string): Promise<void> {
    const key = `${AUTH_CONFIG.loginAttemptsPrefix}${email}`;
    const attempts = await this.redis.incr(key);
    
    if (attempts === 1) {
      await this.redis.expire(key, AUTH_CONFIG.lockoutDuration);
    }
  }

  /**
   * Clear Failed Attempts
   */
  private async clearFailedAttempts(email: string): Promise<void> {
    const key = `${AUTH_CONFIG.loginAttemptsPrefix}${email}`;
    await this.redis.del(key);
  }

  /**
   * Increment Failed Attempts in Database
   */
  private async incrementFailedAttempts(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true }
    });

    const failedAttempts = (user?.failedLoginAttempts || 0) + 1;
    const updateData: any = { failedLoginAttempts: failedAttempts };

    // Lock account after max attempts
    if (failedAttempts >= AUTH_CONFIG.maxLoginAttempts) {
      updateData.lockedUntil = new Date(Date.now() + AUTH_CONFIG.lockoutDuration * 1000);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData
    });
  }

  /**
   * Reset User Lockout
   */
  private async resetUserLockout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });
  }

  /**
   * Update Login Statistics
   */
  private async updateLoginStats(userId: string, ipAddress?: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
        loginCount: { increment: 1 }
      }
    });
  }

  /**
   * Blacklist Token
   */
  private async blacklistToken(token: string, expiry: string): Promise<void> {
    const key = `${AUTH_CONFIG.blacklistKeyPrefix}${token}`;
    
    // Convert expiry to seconds
    const expiryInSeconds = this.parseExpiry(expiry);
    
    await this.redis.setEx(key, expiryInSeconds, 'blacklisted');
  }

  /**
   * Parse Expiry String to Seconds
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 3600;
    }
  }

  /**
   * Revoke All User Sessions
   */
  private async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  /**
   * Log Authentication Events
   */
  private async logAuthEvent(
    action: string,
    userId: string,
    details: any = {}
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          resourceType: 'auth',
          details,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }
}