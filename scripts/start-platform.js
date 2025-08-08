#!/usr/bin/env node

/**
 * AgriAI Platform Startup Script
 * 
 * Script completo per avviare tutta la piattaforma AgriAI
 * Include: database setup, backend, frontend, e health checks
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.cyan}${step}${colors.reset}`, 'bright');
  log(message);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if .env file exists
function checkEnvironment() {
  logStep('1. VERIFICA CONFIGURAZIONE', 'Verificando file di configurazione...');
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    logError('File .env non trovato!');
    logInfo('Crea il file .env basandoti su env-setup.md');
    logInfo('Almeno configura: DATABASE_URL, JWT_SECRET, OPENAI_API_KEY');
    process.exit(1);
  }
  
  logSuccess('File .env trovato');
  
  // Check required environment variables
  dotenv.config();
  const required = ['DATABASE_URL', 'JWT_SECRET', 'OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logError(`Variabili mancanti: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  logSuccess('Tutte le variabili richieste sono configurate');
}

// Setup database
function setupDatabase() {
  logStep('2. SETUP DATABASE', 'Configurando database PostgreSQL...');
  
  try {
    logInfo('Pushing schema al database...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    logSuccess('Schema database aggiornato');
    
    // Try to seed database
    try {
      logInfo('Seeding database...');
      execSync('npx prisma db seed', { stdio: 'inherit' });
      logSuccess('Database seeded con successo');
    } catch (seedError) {
      logWarning('Seed database fallito (opzionale)');
    }
    
  } catch (error) {
    logError('Errore setup database');
    logInfo('Verifica che PostgreSQL sia in esecuzione');
    logInfo('Verifica la DATABASE_URL nel file .env');
    process.exit(1);
  }
}

// Check dependencies
function checkDependencies() {
  logStep('3. VERIFICA DEPENDENCIES', 'Controllando dipendenze...');
  
  try {
    execSync('npm list --depth=0', { stdio: 'pipe' });
    logSuccess('Dependencies installate correttamente');
  } catch (error) {
    logWarning('Alcune dependencies potrebbero mancare');
    logInfo('Esegui: npm install --legacy-peer-deps');
  }
}

// Start backend server
function startBackend() {
  logStep('4. AVVIO BACKEND', 'Avviando server backend...');
  
  const backendProcess = spawn('npm', ['run', 'server:dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  backendProcess.on('error', (error) => {
    logError(`Errore avvio backend: ${error.message}`);
  });
  
  backendProcess.on('exit', (code) => {
    if (code !== 0) {
      logError(`Backend terminato con codice: ${code}`);
    }
  });
  
  logSuccess('Backend avviato su http://localhost:3000');
  return backendProcess;
}

// Start frontend
function startFrontend() {
  logStep('5. AVVIO FRONTEND', 'Avviando applicazione frontend...');
  
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  frontendProcess.on('error', (error) => {
    logError(`Errore avvio frontend: ${error.message}`);
  });
  
  frontendProcess.on('exit', (code) => {
    if (code !== 0) {
      logError(`Frontend terminato con codice: ${code}`);
    }
  });
  
  logSuccess('Frontend avviato su http://localhost:5173');
  return frontendProcess;
}

// Health check
function healthCheck() {
  logStep('6. HEALTH CHECK', 'Verificando stato dei servizi...');
  
  setTimeout(() => {
    try {
      // Check backend health
      const backendHealth = execSync('curl -s http://localhost:3000/health', { encoding: 'utf8' });
      if (backendHealth.includes('ok')) {
        logSuccess('Backend: OK');
      } else {
        logWarning('Backend: Status sconosciuto');
      }
    } catch (error) {
      logWarning('Backend health check fallito (potrebbe essere ancora in avvio)');
    }
    
    logInfo('Piattaforma in avvio...');
    logInfo('Frontend: http://localhost:5173');
    logInfo('Backend API: http://localhost:3000');
    logInfo('WebSocket: ws://localhost:3000/ws/chat');
    
    logSuccess('🎉 AGRIAI PLATFORM AVVIATA CON SUCCESSO!');
    
  }, 5000); // Wait 5 seconds for services to start
}

// Main execution
function main() {
  log('🚀 AGRIAI PLATFORM STARTUP', 'bright');
  log('========================', 'cyan');
  
  try {
    checkEnvironment();
    setupDatabase();
    checkDependencies();
    
    logStep('AVVIO SERVIZI', 'Avviando backend e frontend...');
    
    const backendProcess = startBackend();
    const frontendProcess = startFrontend();
    
    healthCheck();
    
    // Handle process termination
    process.on('SIGINT', () => {
      log('\n🛑 Arresto piattaforma...', 'yellow');
      backendProcess.kill();
      frontendProcess.kill();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      log('\n🛑 Arresto piattaforma...', 'yellow');
      backendProcess.kill();
      frontendProcess.kill();
      process.exit(0);
    });
    
  } catch (error) {
    logError(`Errore durante l'avvio: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
main(); 