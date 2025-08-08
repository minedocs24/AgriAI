# 🚀 **GUIDA COMPLETA AVVIO PIATTAFORMA AGRIAI**

## 📋 **PREREQUISITI**

### **Software Richiesti:**
- ✅ **Node.js** v18+ (attuale: v22.14.0)
- ✅ **npm** v8+ (attuale: v10.9.2)
- ✅ **PostgreSQL** v12+ (con estensione pgvector)
- ✅ **Redis** (opzionale, per caching)

### **Chiavi API Richieste:**
- 🔑 **OpenAI API Key** (per sistema RAG)
- 🔑 **AWS S3** (opzionale, per document storage)

---

## 🛠️ **SETUP INIZIALE**

### **1. Configurazione Environment**

Crea il file `.env` nella root del progetto:

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

### **2. Installazione Dependencies**

```bash
# Installa tutte le dependencies
npm install --legacy-peer-deps

# Genera Prisma client
npx prisma generate
```

### **3. Setup Database**

```bash
# Push schema al database
npx prisma db push

# Seed database (opzionale)
npx prisma db seed
```

---

## 🚀 **METODI DI AVVIO**

### **Metodo 1: Avvio Automatico Completo (RACCOMANDATO)**

```bash
# Avvia tutta la piattaforma con un comando
npm run start
```

Questo comando:
- ✅ Verifica configurazione
- ✅ Setup database
- ✅ Avvia backend (porta 3000)
- ✅ Avvia frontend (porta 5173)
- ✅ Esegue health checks
- ✅ Gestisce graceful shutdown

### **Metodo 2: Avvio Manuale Separato**

#### **Terminal 1 - Backend:**
```bash
npm run server:dev
```

#### **Terminal 2 - Frontend:**
```bash
npm run dev
```

### **Metodo 3: Avvio Rapido (Solo per sviluppo)**

```bash
npm run start:quick
```

---

## 🌐 **URL E ENDPOINTS**

### **Frontend Application:**
- **URL Principale:** http://localhost:5173
- **Landing Page:** http://localhost:5173/
- **Login:** http://localhost:5173/login
- **Chat:** http://localhost:5173/chat
- **Backend Admin:** http://localhost:5173/backend

### **Backend API:**
- **Base URL:** http://localhost:3000
- **Health Check:** http://localhost:3000/health
- **API Docs:** http://localhost:3000/docs
- **WebSocket:** ws://localhost:3000/ws/chat

### **API Endpoints:**
```
POST   /api/auth/register     # Registrazione utente
POST   /api/auth/login        # Login utente
POST   /api/auth/refresh      # Refresh token
GET    /api/auth/me           # Info utente corrente

POST   /api/chat/query        # Invia messaggio chat
GET    /api/chat/conversations # Lista conversazioni
POST   /api/chat/feedback     # Feedback messaggio

GET    /api/documents         # Lista documenti
POST   /api/documents/upload  # Upload documento
GET    /api/documents/search  # Ricerca documenti
```

---

## 🔧 **TROUBLESHOOTING**

### **Problemi Comuni:**

#### **1. Database Connection Error**
```bash
# Verifica PostgreSQL
pg_isready -h localhost -p 5432

# Verifica DATABASE_URL
echo $DATABASE_URL

# Reset database (se necessario)
npx prisma migrate reset --force
```

#### **2. Dependencies Conflict**
```bash
# Rimuovi node_modules e reinstalla
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### **3. Port Already in Use**
```bash
# Trova processi che usano le porte
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Termina processi (Windows)
taskkill /PID <PID> /F
```

#### **4. OpenAI API Error**
```bash
# Verifica API key
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/models

# Test RAG service
npm run test:integration:quick
```

---

## 🧪 **TESTING E VERIFICA**

### **Test Rapidi:**

```bash
# Test integrazione completa
npm run test:integration:quick

# Test autenticazione
npm run test:auth

# Test WebSocket
npm run test:websocket

# Test frontend-backend
npm run test:frontend-backend
```

### **Health Checks:**

```bash
# Backend health
curl http://localhost:3000/health

# Database health
npm run db:health

# Frontend build
npm run build
```

---

## 📊 **MONITORING E LOGS**

### **Log Files:**
- **Backend Logs:** Console del terminale backend
- **Frontend Logs:** Browser DevTools Console
- **Database Logs:** PostgreSQL logs
- **WebSocket Logs:** Console del terminale backend

### **Monitoring Endpoints:**
```bash
# Health check
GET /health

# System status
GET /api/status

# Database status
GET /api/db/status

# WebSocket status
GET /ws/health
```

---

## 🔄 **COMANDI UTILI**

### **Development:**
```bash
# Avvio completo
npm run start

# Solo backend
npm run start:backend

# Solo frontend  
npm run start:frontend

# Hot reload backend
npm run server:dev

# Hot reload frontend
npm run dev
```

### **Database:**
```bash
# Studio database
npm run db:studio

# Reset database
npm run db:reset

# Backup database
npm run db:backup

# Migrazione
npm run db:migrate
```

### **Testing:**
```bash
# Tutti i test
npm test

# Test con coverage
npm run test:coverage

# Test integrazione
npm run test:integration:quick

# Test specifici
npm run test:auth
npm run test:websocket
```

### **Quality:**
```bash
# Check qualità codice
npm run quality:check

# Fix automatico
npm run quality:fix

# Build production
npm run build
```

---

## 🚀 **DEPLOYMENT**

### **Development:**
```bash
npm run start
```

### **Production:**
```bash
# Build frontend
npm run build

# Start production server
npm run server:prod

# Serve static files
npm run preview
```

---

## 📞 **SUPPORT**

### **In caso di problemi:**

1. **Verifica logs** nei terminali
2. **Controlla configurazione** nel file `.env`
3. **Esegui health checks** con i comandi sopra
4. **Testa componenti** individualmente
5. **Verifica database** con Prisma Studio

### **File di Configurazione Importanti:**
- `.env` - Variabili ambiente
- `prisma/schema.prisma` - Schema database
- `package.json` - Dependencies e scripts
- `vite.config.ts` - Configurazione frontend
- `src/server.ts` - Entry point backend

---

## 🎉 **SUCCESSO!**

Se tutto funziona correttamente, vedrai:

```
🎉 AGRIAI PLATFORM AVVIATA CON SUCCESSO!

Frontend: http://localhost:5173
Backend API: http://localhost:3000  
WebSocket: ws://localhost:3000/ws/chat
```

**La piattaforma è ora pronta per l'uso! 🚀** 