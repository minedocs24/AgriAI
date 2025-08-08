# 🔧 SETUP ENVIRONMENT VARIABLES

## Crea il file `.env` nella root del progetto con questo contenuto:

```bash
# ========================================
# AGRIAI PLATFORM - ENVIRONMENT CONFIG
# ========================================

# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/agriai_db"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# OpenAI Configuration
OPENAI_API_KEY="your-openai-api-key-here"

# Server Configuration
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Redis Configuration (for sessions/caching)
REDIS_URL="redis://localhost:6379"

# AWS S3 Configuration (for document storage)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="eu-west-1"
S3_BUCKET_NAME="agriai-documents"

# WebSocket Configuration
WS_PORT=3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL="info"

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET="your-session-secret-key"

# Development
VITE_API_BASE_URL="http://localhost:3000"
VITE_WS_URL="ws://localhost:3000/ws/chat"
```

## 🔑 CHIAVI OBBLIGATORIE PER TESTING:

1. **DATABASE_URL**: URL del database PostgreSQL
2. **JWT_SECRET**: Chiave per firmare i token JWT
3. **OPENAI_API_KEY**: Chiave API di OpenAI (per il sistema RAG)

## 🚀 COMANDI DI AVVIO:

Dopo aver creato il file `.env`, esegui:

```bash
# 1. Setup database
npx prisma db push

# 2. Seed database (opzionale)
npx prisma db seed

# 3. Avvia backend
npm run server:dev

# 4. Avvia frontend (nuovo terminale)
npm run dev
``` 