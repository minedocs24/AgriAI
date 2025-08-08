#!/usr/bin/env node

/**
 * AgriAI Chat Server with RAG Integration
 * 
 * Main server entry point that integrates:
 * - REST API endpoints for chat
 * - WebSocket real-time communication
 * - RAG (Retrieval-Augmented Generation) service
 * - Authentication and authorization
 * - Database persistence with Prisma
 */

import 'dotenv/config';
import { start } from './app';

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'OPENAI_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Start the server
start().catch(error => {
  console.error('❌ Failed to start AgriAI Chat Server:', error);
  process.exit(1);
});