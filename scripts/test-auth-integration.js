#!/usr/bin/env node

/**
 * AgriAI Authentication Integration Test
 * 
 * Script per testare l'integrazione completa del sistema di autenticazione
 * Frontend + Backend + Database
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

let backendProcess = null;
let frontendProcess = null;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logWithTimestamp = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
};

const killProcesses = () => {
  if (backendProcess) {
    logWithTimestamp('Stopping backend server...');
    backendProcess.kill('SIGTERM');
  }
  if (frontendProcess) {
    logWithTimestamp('Stopping frontend server...');
    frontendProcess.kill('SIGTERM');
  }
};

// Handle process termination
process.on('SIGINT', () => {
  logWithTimestamp('Received SIGINT, shutting down...');
  killProcesses();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logWithTimestamp('Received SIGTERM, shutting down...');
  killProcesses();
  process.exit(0);
});

const startBackend = () => {
  return new Promise((resolve, reject) => {
    logWithTimestamp('Starting backend server...');
    
    backendProcess = spawn('node', ['./node_modules/.bin/tsx', 'src/server.ts'], {
      cwd: rootDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PORT: '3001'
      }
    });

    let backendReady = false;

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[BACKEND] ${output.trim()}`);
      
      if (output.includes('Server listening on port') || output.includes('Server started')) {
        backendReady = true;
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`[BACKEND ERROR] ${output.trim()}`);
    });

    backendProcess.on('close', (code) => {
      logWithTimestamp(`Backend process exited with code ${code}`);
      if (!backendReady) {
        reject(new Error(`Backend failed to start (exit code: ${code})`));
      }
    });

    backendProcess.on('error', (err) => {
      logWithTimestamp(`Backend process error: ${err.message}`, 'ERROR');
      reject(err);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!backendReady) {
        reject(new Error('Backend startup timeout'));
      }
    }, 30000);
  });
};

const startFrontend = () => {
  return new Promise((resolve, reject) => {
    logWithTimestamp('Starting frontend development server...');
    
    frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: rootDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        VITE_API_URL: 'http://localhost:3001'
      }
    });

    let frontendReady = false;

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[FRONTEND] ${output.trim()}`);
      
      if (output.includes('Local:') || output.includes('ready in')) {
        frontendReady = true;
        resolve();
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`[FRONTEND ERROR] ${output.trim()}`);
    });

    frontendProcess.on('close', (code) => {
      logWithTimestamp(`Frontend process exited with code ${code}`);
      if (!frontendReady) {
        reject(new Error(`Frontend failed to start (exit code: ${code})`));
      }
    });

    frontendProcess.on('error', (err) => {
      logWithTimestamp(`Frontend process error: ${err.message}`, 'ERROR');
      reject(err);
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (!frontendReady) {
        reject(new Error('Frontend startup timeout'));
      }
    }, 60000);
  });
};

const testAuthEndpoints = async () => {
  logWithTimestamp('Testing authentication endpoints...');
  
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Test health endpoint
    logWithTimestamp('Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    logWithTimestamp('✅ Health endpoint working');

    // Test login endpoint (should fail without credentials)
    logWithTimestamp('Testing login endpoint (no credentials)...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (loginResponse.status !== 400) {
      throw new Error(`Expected 400 status for invalid login, got ${loginResponse.status}`);
    }
    logWithTimestamp('✅ Login endpoint validation working');

    // Test registration endpoint (should fail without credentials)
    logWithTimestamp('Testing register endpoint (no credentials)...');
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (registerResponse.status !== 400) {
      throw new Error(`Expected 400 status for invalid registration, got ${registerResponse.status}`);
    }
    logWithTimestamp('✅ Register endpoint validation working');

    logWithTimestamp('🎉 All authentication endpoints are responding correctly!');
    
  } catch (error) {
    logWithTimestamp(`❌ Authentication endpoint test failed: ${error.message}`, 'ERROR');
    throw error;
  }
};

const main = async () => {
  try {
    logWithTimestamp('🚀 Starting AgriAI Authentication Integration Test');
    
    // Start backend
    await startBackend();
    logWithTimestamp('✅ Backend server started');
    
    // Wait a bit for backend to fully initialize
    await delay(3000);
    
    // Test auth endpoints
    await testAuthEndpoints();
    
    // Start frontend
    await startFrontend();
    logWithTimestamp('✅ Frontend server started');
    
    logWithTimestamp('🎉 Integration test completed successfully!');
    logWithTimestamp('');
    logWithTimestamp('='.repeat(60));
    logWithTimestamp('🌟 AgriAI Authentication System is ready!');
    logWithTimestamp('');
    logWithTimestamp('📱 Frontend: http://localhost:5173');
    logWithTimestamp('🔧 Backend:  http://localhost:3001');
    logWithTimestamp('');
    logWithTimestamp('📋 Test the following flow:');
    logWithTimestamp('   1. Visit http://localhost:5173');
    logWithTimestamp('   2. Click "Inizia a chattare" -> redirects to login');
    logWithTimestamp('   3. Click "Registrati qui" to create account');
    logWithTimestamp('   4. Fill form and register');
    logWithTimestamp('   5. Should automatically login and redirect to chat');
    logWithTimestamp('');
    logWithTimestamp('🛑 Press Ctrl+C to stop all servers');
    logWithTimestamp('='.repeat(60));
    
    // Keep the script running
    await new Promise(() => {});
    
  } catch (error) {
    logWithTimestamp(`❌ Integration test failed: ${error.message}`, 'ERROR');
    killProcesses();
    process.exit(1);
  }
};

main().catch((error) => {
  logWithTimestamp(`💥 Unexpected error: ${error.message}`, 'ERROR');
  killProcesses();
  process.exit(1);
});