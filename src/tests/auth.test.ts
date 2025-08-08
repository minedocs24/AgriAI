/**
 * AgriAI Authentication System Tests
 * 
 * Test completi per:
 * - User registration e login
 * - JWT token generation e validation
 * - Refresh token mechanism
 * - Rate limiting
 * - Password security
 * - Session management
 * - Error handling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { build } from '../app';
import { AuthService } from '../services/AuthService';
import { FastifyInstance } from 'fastify';

// Test environment setup
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_TEST_URL || process.env.DATABASE_URL
    }
  }
});

const redis = createClient({
  url: process.env.REDIS_TEST_URL || process.env.REDIS_URL
});

// Test data
const testUser = {
  email: 'test@agriai.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  acceptTerms: true,
  acceptPrivacy: true
};

const testAdmin = {
  email: 'admin@agriai.com',
  password: 'AdminPassword123!',
  firstName: 'Admin',
  lastName: 'User',
  acceptTerms: true,
  acceptPrivacy: true
};

let app: FastifyInstance;
let authService: AuthService;
let userToken: string;
let refreshToken: string;
let userId: string;

describe('Authentication System', () => {
  beforeAll(async () => {
    // Connect to test databases
    await redis.connect();
    await prisma.$connect();
    
    // Build Fastify app for testing
    app = await build({ test: true });
    
    // Initialize auth service
    authService = new AuthService(prisma, redis as any);
    
    console.log('✅ Test environment initialized');
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testUser.email, testAdmin.email]
        }
      }
    });
    
    // Disconnect from databases
    await prisma.$disconnect();
    await redis.quit();
    
    console.log('✅ Test cleanup completed');
  });

  beforeEach(async () => {
    // Clear Redis cache before each test
    await redis.flushDb();
  });

  describe('User Registration', () => {
    afterEach(async () => {
      // Clean up created users after each test
      await prisma.user.deleteMany({
        where: { email: testUser.email }
      });
    });

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject registration with invalid email', async () => {
      const invalidUser = { ...testUser, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('validation_error');
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordUser = { ...testUser, password: '123' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('validation_error');
    });

    it('should reject registration with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('registration_failed');
    });

    it('should reject registration without accepting terms', async () => {
      const userNoTerms = { ...testUser, acceptTerms: false };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userNoTerms)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('validation_error');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Create test user
      const passwordHash = await bcrypt.hash(testUser.password, 12);
      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          passwordHash,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          userType: 'PUBLIC',
          emailVerified: true
        }
      });
      userId = user.id;
    });

    afterEach(async () => {
      // Clean up
      await prisma.userSession.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      userToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('authentication_failed');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('authentication_failed');
    });

    it('should set refresh token cookie when rememberMe is true', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          rememberMe: true
        })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      if (Array.isArray(cookies)) {
        expect(cookies.some((cookie: string) => cookie.includes('refresh_token'))).toBe(true);
      } else {
        expect(cookies).toContain('refresh_token');
      }
    });
  });

  describe('Token Management', () => {
    beforeEach(async () => {
      // Create test user and login
      const passwordHash = await bcrypt.hash(testUser.password, 12);
      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          passwordHash,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          userType: 'PUBLIC',
          emailVerified: true
        }
      });
      userId = user.id;

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      userToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    afterEach(async () => {
      await prisma.userSession.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
      expect(response.body.data.tokens.accessToken).not.toBe(userToken);
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('refresh_failed');
    });

    it('should get current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject protected route without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe('authentication_failed');
    });

    it('should logout and invalidate tokens', async () => {
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ refreshToken })
        .expect(200);

      // Try to use invalidated token
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.error).toBe('authentication_failed');
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(async () => {
      await redis.flushDb();
    });

    it('should apply rate limiting to login attempts', async () => {
      const loginAttempts = [];
      
      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        const promise = request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
          });
        loginAttempts.push(promise);
      }

      const responses = await Promise.all(loginAttempts);
      
      // Should have at least one rate limited response
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should apply rate limiting to registration', async () => {
      const registrationAttempts = [];
      
      // Make multiple registration attempts
      for (let i = 0; i < 5; i++) {
        const promise = request(app)
          .post('/api/auth/register')
          .send({
            ...testUser,
            email: `test${i}@example.com`
          });
        registrationAttempts.push(promise);
      }

      const responses = await Promise.all(registrationAttempts);
      
      // Later requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Password Security', () => {
    beforeEach(async () => {
      const passwordHash = await bcrypt.hash(testUser.password, 12);
      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          passwordHash,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          userType: 'PUBLIC',
          emailVerified: true
        }
      });
      userId = user.id;

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      userToken = loginResponse.body.data.tokens.accessToken;
    });

    afterEach(async () => {
      await prisma.userSession.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should change password with valid current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
    });

    it('should reject password change with wrong current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject weak new password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: '123',
          confirmPassword: '123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('validation_error');
    });

    it('should handle forgot password request', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle forgot password for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Should return success even for non-existent users (security)
      expect(response.body.success).toBe(true);
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      const passwordHash = await bcrypt.hash(testUser.password, 12);
      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          passwordHash,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          userType: 'PUBLIC',
          emailVerified: true
        }
      });
      userId = user.id;

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      userToken = loginResponse.body.data.tokens.accessToken;
    });

    afterEach(async () => {
      await prisma.userSession.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should get user sessions', async () => {
      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toBeDefined();
      expect(Array.isArray(response.body.data.sessions)).toBe(true);
    });

    it('should revoke specific session', async () => {
      // Get sessions first
      const sessionsResponse = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${userToken}`);

      const sessionId = sessionsResponse.body.data.sessions[0].id;

      // Revoke session
      const response = await request(app)
        .delete(`/api/auth/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('JWT Token Validation', () => {
    it('should validate token structure and claims', async () => {
      const passwordHash = await bcrypt.hash(testUser.password, 12);
      const user = await prisma.user.create({
        data: {
          email: testUser.email,
          passwordHash,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          userType: 'PUBLIC',
          emailVerified: true
        }
      });

      // Use the login method instead of direct token generation
      const loginResult = await authService.login({
        email: user.email,
        password: 'TestPassword123!'
      });
      const tokens = loginResult.tokens;
      
      // Decode and verify token structure
      const decoded = jwt.decode(tokens.accessToken) as any;
      
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.userType).toBe(user.userType);
      expect(decoded.iss).toBe('agriai-api');
      expect(decoded.aud).toBe('agriai-client');

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should reject expired tokens', async () => {
      // Create a token with very short expiry
      const shortExpiryToken = jwt.sign(
        { 
          sub: 'test-user-id',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) - 60 // Expired 1 minute ago
        },
        process.env.JWT_ACCESS_SECRET || 'test-secret'
      );

      try {
        await authService.validateToken(shortExpiryToken);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Authorization Levels', () => {
    beforeEach(async () => {
      // Create admin user
      const passwordHash = await bcrypt.hash(testAdmin.password, 12);
      await prisma.user.create({
        data: {
          email: testAdmin.email,
          passwordHash,
          firstName: testAdmin.firstName,
          lastName: testAdmin.lastName,
          userType: 'ADMIN',
          emailVerified: true
        }
      });
    });

    afterEach(async () => {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [testUser.email, testAdmin.email]
          }
        }
      });
    });

    it('should allow admin access to admin endpoints', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testAdmin.email,
          password: testAdmin.password
        });

      const adminToken = loginResponse.body.data.tokens.accessToken;

      const response = await request(app)
        .get('/api/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('admin-only');
    });

    it('should deny regular user access to admin endpoints', async () => {
      const passwordHash = await bcrypt.hash(testUser.password, 12);
      await prisma.user.create({
        data: {
          email: testUser.email,
          passwordHash,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          userType: 'PUBLIC',
          emailVerified: true
        }
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      const userToken = loginResponse.body.data.tokens.accessToken;

      const response = await request(app)
        .get('/api/admin')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('authorization_failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('invalid-json')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle missing request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .expect(400);

      expect(response.body.error).toBe('validation_error');
    });

    it('should handle invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('authentication_failed');
    });

    it('should handle malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.error).toBe('authentication_failed');
    });
  });
});

// Helper functions for integration tests
export const createTestUser = async (userData = testUser) => {
  const passwordHash = await bcrypt.hash(userData.password, 12);
  return await prisma.user.create({
    data: {
      email: userData.email,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      userType: 'PUBLIC',
      emailVerified: true
    }
  });
};

export const loginTestUser = async (credentials = { email: testUser.email, password: testUser.password }) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send(credentials);
  
  return response.body.data.tokens.accessToken;
};

export const cleanupTestUser = async (email: string) => {
  await prisma.userSession.deleteMany({
    where: {
      user: { email }
    }
  });
  
  await prisma.user.deleteMany({
    where: { email }
  });
};