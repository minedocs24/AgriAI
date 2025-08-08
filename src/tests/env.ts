/**
 * Test Environment Configuration
 */

// Set test environment variables before any modules are loaded
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-testing-only-please-change-in-production';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only-please-change-in-production';
process.env.BCRYPT_SALT_ROUNDS = '4'; // Lower for faster tests
process.env.RATE_LIMIT_WINDOW_MS = '60000'; // 1 minute for testing
process.env.RATE_LIMIT_MAX = '50'; // Lower limits for testing
process.env.AUTH_RATE_LIMIT_MAX = '10';
process.env.LOGIN_RATE_LIMIT_MAX = '5';

// Database URLs for testing (should be different from production)
if (!process.env.DATABASE_TEST_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/agriai_test';
}

if (!process.env.REDIS_TEST_URL && !process.env.REDIS_URL) {
  process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use database 1 for tests
}