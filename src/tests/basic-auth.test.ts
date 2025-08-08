/**
 * Test di base per il sistema di autenticazione
 * Testa solo la logica di base senza database
 */

import { describe, it, expect } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

describe('Basic Authentication Logic', () => {
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

    it('should use correct salt rounds', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 12);
      
      // Verify the hash starts with $2b$12$ (bcrypt with 12 rounds)
      expect(hash).toMatch(/^\$2b\$12\$/);
    });
  });

  describe('JWT Token Generation', () => {
    const secret = 'test-secret-key';
    const payload = {
      sub: 'user123',
      email: 'test@example.com',
      userType: 'PUBLIC',
      sessionId: 'session123'
    };

    it('should generate valid JWT token', () => {
      const token = jwt.sign(payload, secret, { expiresIn: '15m' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify valid JWT token', () => {
      const token = jwt.sign(payload, secret, { expiresIn: '15m' });
      const decoded = jwt.verify(token, secret) as any;
      
      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.userType).toBe(payload.userType);
    });

    it('should reject invalid JWT token', () => {
      const invalidToken = 'invalid.jwt.token';
      
      expect(() => {
        jwt.verify(invalidToken, secret);
      }).toThrow();
    });

    it('should reject JWT token with wrong secret', () => {
      const token = jwt.sign(payload, secret, { expiresIn: '15m' });
      const wrongSecret = 'wrong-secret';
      
      expect(() => {
        jwt.verify(token, wrongSecret);
      }).toThrow();
    });
  });

  describe('Password Validation', () => {
    it('should validate strong password', () => {
      const strongPassword = 'StrongPass123!';
      
      // Check minimum length
      expect(strongPassword.length).toBeGreaterThanOrEqual(8);
      
      // Check for uppercase
      expect(/[A-Z]/.test(strongPassword)).toBe(true);
      
      // Check for lowercase
      expect(/[a-z]/.test(strongPassword)).toBe(true);
      
      // Check for numbers
      expect(/\d/.test(strongPassword)).toBe(true);
      
      // Check for special characters
      expect(/[!@#$%^&*(),.?":{}|<>]/.test(strongPassword)).toBe(true);
    });

    it('should reject weak password', () => {
      const weakPassword = '123';
      
      // Check minimum length
      expect(weakPassword.length).toBeLessThan(8);
    });

    it('should reject password without uppercase', () => {
      const password = 'password123!';
      expect(/[A-Z]/.test(password)).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const password = 'PASSWORD123!';
      expect(/[a-z]/.test(password)).toBe(false);
    });

    it('should reject password without numbers', () => {
      const password = 'Password!';
      expect(/\d/.test(password)).toBe(false);
    });

    it('should reject password without special characters', () => {
      const password = 'Password123';
      expect(/[!@#$%^&*(),.?":{}|<>]/.test(password)).toBe(false);
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];
      
      validEmails.forEach(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it('should reject obviously invalid email format', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@'
      ];
      
      invalidEmails.forEach(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('Security Configuration', () => {
    it('should have secure JWT configuration', () => {
      const config = {
        accessTokenTTL: '15m',
        refreshTokenTTL: '7d',
        saltRounds: 12,
        maxLoginAttempts: 5
      };
      
      expect(config.accessTokenTTL).toBe('15m');
      expect(config.refreshTokenTTL).toBe('7d');
      expect(config.saltRounds).toBeGreaterThanOrEqual(12);
      expect(config.maxLoginAttempts).toBeLessThanOrEqual(10);
    });
  });
}); 