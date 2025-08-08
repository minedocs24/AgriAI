/**
 * Test semplificato per il sistema di autenticazione
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../services/AuthService';

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

let authService: AuthService;

describe('Simple Authentication Tests', () => {
  beforeAll(async () => {
    // Connect to test databases
    await redis.connect();
    await prisma.$connect();
    
    // Initialize auth service
    authService = new AuthService(prisma, redis);
    
    console.log('✅ Test environment initialized');
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.user.deleteMany({
      where: {
        email: testUser.email
      }
    });
    
    // Disconnect from databases
    await prisma.$disconnect();
    await redis.quit();
    
    console.log('✅ Test cleanup completed');
  });

  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject invalid password', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare('WrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('User Registration', () => {
    it('should register a new user', async () => {
      const result = await authService.register(testUser);
      
      expect(result.user.email).toBe(testUser.email);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(result.session).toBeDefined();
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      // Create test user
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
    });

    afterEach(async () => {
      // Clean up
      await prisma.userSession.deleteMany({ 
        where: { user: { email: testUser.email } } 
      });
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should login with valid credentials', async () => {
      const result = await authService.login({
        email: testUser.email,
        password: testUser.password
      });
      
      expect(result.user.email).toBe(testUser.email);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(result.session).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      await expect(
        authService.login({
          email: testUser.email,
          password: 'WrongPassword'
        })
      ).rejects.toThrow();
    });
  });

  describe('Token Validation', () => {
    let userToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create test user and get token
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

      const result = await authService.login({
        email: testUser.email,
        password: testUser.password
      });
      userToken = result.tokens.accessToken;
    });

    afterEach(async () => {
      // Clean up
      await prisma.userSession.deleteMany({ 
        where: { user: { email: testUser.email } } 
      });
      await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    it('should validate valid token', async () => {
      const payload = await authService.validateToken(userToken);
      
      expect(payload.sub).toBe(userId);
      expect(payload.email).toBe(testUser.email);
    });

    it('should reject invalid token', async () => {
      await expect(
        authService.validateToken('invalid-token')
      ).rejects.toThrow();
    });
  });
}); 