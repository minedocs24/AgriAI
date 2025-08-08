/**
 * Jest Test Setup for AgriAI Authentication
 */

import { beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

// Extend Jest matchers
import 'jest-extended';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';

// Global test database clients
let globalPrisma: PrismaClient;
let globalRedis: any;

beforeAll(async () => {
  // Only connect to databases if we're running integration tests
  if (process.env.RUN_INTEGRATION_TESTS === 'true') {
    // Initialize test database connection
    globalPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_TEST_URL || process.env.DATABASE_URL
        }
      }
    });
    
    // Initialize test Redis connection
    globalRedis = createClient({
      url: process.env.REDIS_TEST_URL || process.env.REDIS_URL
    });
    
    try {
      await globalPrisma.$connect();
      await globalRedis.connect();
      console.log('✅ Test databases connected');
    } catch (error) {
      console.error('❌ Failed to connect to test databases:', error);
      throw error;
    }
  } else {
    console.log('ℹ️ Skipping database connections for unit tests');
  }
});

afterAll(async () => {
  if (process.env.RUN_INTEGRATION_TESTS === 'true' && globalPrisma && globalRedis) {
    try {
      await globalPrisma.$disconnect();
      await globalRedis.quit();
      console.log('✅ Test databases disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting test databases:', error);
    }
  }
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Increase timeout for database operations
jest.setTimeout(30000);