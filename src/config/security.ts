/**
 * AgriAI Security Configuration
 * 
 * Configurazione completa per:
 * - Security headers con Helmet
 * - CORS configuration
 * - Rate limiting presets
 * - Environment-based security
 * - JWT configuration
 * - Security constants
 */

import helmet from 'helmet';
import cors from 'cors';
import { Request } from 'express';

// Security configuration interfaces
export interface SecurityConfig {
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTTL: string;
    refreshTTL: string;
    issuer: string;
    audience: string;
  };
  bcrypt: {
    saltRounds: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    authMaxRequests: number;
    loginMaxRequests: number;
  };
  cors: {
    origin: string[] | boolean;
    credentials: boolean;
    optionsSuccessStatus: number;
  };
  session: {
    maxAge: number;
    cleanupInterval: number;
  };
  security: {
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordMinLength: number;
    tokenBlacklistTTL: number;
  };
}

// Environment-based security configuration
export const getSecurityConfig = (): SecurityConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret-change-in-production',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
      accessTTL: process.env.JWT_ACCESS_TTL || '15m',
      refreshTTL: process.env.JWT_REFRESH_TTL || '7d',
      issuer: process.env.JWT_ISSUER || 'agriai-api',
      audience: process.env.JWT_AUDIENCE || 'agriai-client'
    },
    bcrypt: {
      saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10'),
      loginMaxRequests: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5')
    },
    cors: {
      origin: isProduction 
        ? (process.env.ALLOWED_ORIGINS?.split(',') || ['https://agriai.com'])
        : true, // Allow all origins in development
      credentials: true,
      optionsSuccessStatus: 200
    },
    session: {
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800000'), // 7 days
      cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL || '3600000') // 1 hour
    },
    security: {
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900'), // 15 minutes
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
      tokenBlacklistTTL: parseInt(process.env.TOKEN_BLACKLIST_TTL || '86400') // 24 hours
    }
  };
};

// Generate secret key if not provided
function generateSecretKey(type: string): string {
  if (process.env.NODE_ENV === 'production') {
    console.error(`WARNING: JWT_${type.toUpperCase()}_SECRET not set in production!`);
  }
  
  return 'default-secret-key-change-in-production';
}

// Helmet security configuration
export const getHelmetConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.agriai.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: isProduction ? [] : null
      }
    },
    
    // Cross-Origin Embedder Policy
    crossOriginEmbedderPolicy: false,
    
    // Cross-Origin Opener Policy  
    crossOriginOpenerPolicy: { policy: "same-origin" },
    
    // Cross-Origin Resource Policy
    crossOriginResourcePolicy: { policy: "cross-origin" },
    
    // DNS Prefetch Control
    dnsPrefetchControl: true,
    
    // Frameguard
    frameguard: { action: 'deny' },
    
    // Hide Powered-By header
    hidePoweredBy: true,
    
    // HTTP Strict Transport Security
    hsts: isProduction ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    } : false,
    
    // IE No Open
    ieNoOpen: true,
    
    // No Sniff
    noSniff: true,
    
    // Origin Agent Cluster
    originAgentCluster: true,
    
    // Permitted Cross-Domain Policies
    permittedCrossDomainPolicies: false,
    
    // Referrer Policy
    referrerPolicy: { policy: "no-referrer" },
    
    // X-Content-Type-Options
    xssFilter: true
  });
};

// CORS configuration
export const getCorsConfig = () => {
  const config = getSecurityConfig();
  
  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      if (Array.isArray(config.cors.origin)) {
        if (config.cors.origin.includes(origin)) {
          return callback(null, true);
        } else {
          return callback(new Error('Not allowed by CORS'));
        }
      }
      
      // Allow all origins in development
      if (config.cors.origin === true) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: config.cors.credentials,
    optionsSuccessStatus: config.cors.optionsSuccessStatus,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-Client-Version',
      'X-Request-ID'
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Total-Count'
    ]
  });
};

// Security validation middleware
export const securityValidation = (req: Request, res: any, next: any) => {
  // Validate request size
  const maxBodySize = 10 * 1024 * 1024; // 10MB
  const contentLength = parseInt(req.headers['content-length'] || '0');
  
  if (contentLength > maxBodySize) {
    return res.status(413).json({
      error: 'payload_too_large',
      message: 'Request body too large',
      maxSize: maxBodySize
    });
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi
  ];
  
  const requestBody = JSON.stringify(req.body);
  const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
    pattern.test(requestBody)
  );
  
  if (hasSuspiciousContent) {
    console.warn('Suspicious content detected:', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      body: requestBody
    });
    
    return res.status(400).json({
      error: 'invalid_content',
      message: 'Request contains invalid content'
    });
  }
  
  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: any, next: any) => {
  // Add custom security headers
  res.setHeader('X-API-Version', process.env.API_VERSION || '1.0.0');
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || generateRequestId());
  res.setHeader('X-Response-Time', Date.now().toString());
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
};

// Generate request ID
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Environment validation
export const validateEnvironmentVariables = () => {
  const required = [
    'DATABASE_URL',
    'REDIS_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }
  
  // Warn about missing optional security variables
  const optional = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  const missingOptional = optional.filter(key => !process.env[key]);
  
  if (missingOptional.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('Missing optional security environment variables:', missingOptional);
  }
};

// Security constants
export const SECURITY_CONSTANTS = {
  // Token constants
  TOKEN_TYPES: {
    ACCESS: 'access',
    REFRESH: 'refresh',
    RESET: 'reset',
    VERIFICATION: 'verification'
  },
  
  // Rate limit constants
  RATE_LIMIT_KEYS: {
    GENERAL: 'general',
    AUTH: 'auth',
    LOGIN: 'login',
    REGISTER: 'register',
    PASSWORD_RESET: 'password_reset'
  },
  
  // Security event types
  SECURITY_EVENTS: {
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILED: 'login_failed',
    LOGOUT: 'logout',
    TOKEN_REFRESH: 'token_refresh',
    PASSWORD_CHANGE: 'password_change',
    ACCOUNT_LOCKED: 'account_locked',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded'
  },
  
  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500
  },
  
  // Error codes
  ERROR_CODES: {
    VALIDATION_ERROR: 'validation_error',
    AUTHENTICATION_FAILED: 'authentication_failed',
    AUTHORIZATION_FAILED: 'authorization_failed',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    TOKEN_EXPIRED: 'token_expired',
    INVALID_TOKEN: 'invalid_token',
    USER_NOT_FOUND: 'user_not_found',
    INVALID_CREDENTIALS: 'invalid_credentials',
    ACCOUNT_LOCKED: 'account_locked',
    INSUFFICIENT_PERMISSIONS: 'insufficient_permissions'
  }
};

// Export security config instance
export const securityConfig = getSecurityConfig();