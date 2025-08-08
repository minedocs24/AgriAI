# Chat API with RAG Integration

## Overview

Il sistema di chat AgriAI implementa un'architettura completa con integrazione RAG (Retrieval-Augmented Generation) per fornire risposte accurate e contestualizzate nel dominio agricolo italiano.

## 🏗️ Architettura

### Componenti Principali

1. **ChatController** - Gestione endpoint REST API
2. **RAGService** - Servizio di retrieval e generazione
3. **WebSocket Manager** - Real-time communication
4. **Conversation Model** - Gestione persistenza conversazioni

### Stack Tecnologico

- **Backend**: Node.js, TypeScript, Fastify
- **Database**: PostgreSQL con Prisma ORM
- **AI/ML**: OpenAI GPT-4, LangChain, Embeddings
- **Real-time**: WebSocket
- **Testing**: Jest, Supertest

## 🚀 API Endpoints

### POST /api/chat/query

Endpoint principale per l'invio di messaggi con supporto RAG.

**Request:**
```typescript
{
  content: string;           // Messaggio utente (max 4000 caratteri)
  conversationId?: string;   // ID conversazione esistente (opzionale)
  context?: {                // Contesto utente (opzionale)
    userType: 'public' | 'member' | 'admin';
    location?: string;
    farmType?: string;
    expertise?: string;
  }
}
```

**Response:**
```typescript
{
  userMessage: {
    id: string;
    content: string;
    timestamp: string;
    sender: 'user';
  };
  aiMessage: {
    id: string;
    content: string;
    timestamp: string;
    sender: 'ai';
    confidence: number;       // Score di confidenza (0-1)
    processingTime: number;   // Tempo elaborazione in ms
    sources?: Array<{         // Fonti RAG utilizzate
      id: string;
      title: string;
      content: string;
      score: number;
      relevance: number;
    }>;
  };
  conversation: {
    id: string;
    title?: string;
    messageCount: number;
  };
}
```

**Esempio:**
```bash
curl -X POST http://localhost:3000/api/chat/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Quali sono i requisiti per la certificazione biologica?",
    "context": {
      "userType": "member",
      "farmType": "biologico"
    }
  }'
```

### GET /api/chat/conversations

Recupera le conversazioni dell'utente con paginazione.

**Query Parameters:**
- `page`: Numero pagina (default: 1)
- `limit`: Risultati per pagina (max: 50, default: 20)

**Response:**
```typescript
{
  conversations: Array<{
    id: string;
    title: string | null;
    messageCount: number;
    lastMessage: {
      content: string;
      sender: 'user' | 'ai';
      createdAt: string;
    } | null;
    avgConfidence: number | null;
    lastMessageAt: string | null;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

### POST /api/chat/feedback

Invia feedback su una risposta AI.

**Request:**
```typescript
{
  messageId: string;
  rating: number;           // 1-5
  comment?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
}
```

## 🔌 WebSocket Integration

### Connessione

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/chat?token=YOUR_JWT_TOKEN');
```

### Eventi WebSocket

#### Messaggi in Uscita (Client → Server)

**Chat Message:**
```javascript
ws.send(JSON.stringify({
  type: 'chat_message',
  content: 'Messaggio utente',
  conversationId?: 'uuid',
  context?: {
    userType: 'public'
  }
}));
```

**Typing Indicators:**
```javascript
// Inizia a scrivere
ws.send(JSON.stringify({
  type: 'typing_start',
  conversationId: 'uuid'
}));

// Smette di scrivere
ws.send(JSON.stringify({
  type: 'typing_stop',
  conversationId: 'uuid'
}));
```

#### Messaggi in Entrata (Server → Client)

**Message Response:**
```javascript
{
  type: 'message_response',
  data: {
    userMessage: { /* ... */ },
    aiMessage: { /* ... */ },
    conversation: { /* ... */ }
  },
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

**Typing Indicators:**
```javascript
{
  type: 'typing_start' | 'typing_stop',
  data: {
    userId: 'uuid',
    conversationId: 'uuid',
    userEmail: 'user@example.com'
  }
}
```

**User Presence:**
```javascript
{
  type: 'user_presence',
  data: {
    status: 'connected' | 'disconnected',
    userId: 'uuid'
  }
}
```

## 🧠 RAG Integration

### Pipeline di Elaborazione

1. **Intent Classification**: Classifica automaticamente l'intento della query
2. **Entity Extraction**: Estrae entità rilevanti (colture, luoghi, normative)
3. **Semantic Retrieval**: Recupera documenti rilevanti dalla knowledge base
4. **Context-Aware Generation**: Genera risposta utilizzando il contesto recuperato
5. **Confidence Scoring**: Calcola score di confidenza basato su vari fattori
6. **Source Tracking**: Traccia le fonti utilizzate per la risposta

### Intent Categories

- `normative_pac`: Normative PAC, regolamenti UE
- `certificazioni`: Certificazioni BIO, DOP, IGP
- `tecnologie`: IoT, smart farming, innovazioni
- `finanziamenti`: Bandi, PNRR, contributi
- `coltivazione`: Tecniche, malattie, fertilizzanti
- `meteo`: Previsioni, clima, irrigazione
- `generale`: Domande generiche

### Source Tracking

Ogni risposta AI include le fonti utilizzate con:
- **ID documento**: Identificativo univoco
- **Titolo**: Nome del documento sorgente
- **Contenuto**: Estratto rilevante utilizzato
- **Score**: Punteggio di rilevanza (0-1)
- **Rank**: Posizione nella classifica di rilevanza

## 🧪 Testing

### Unit Tests

```bash
npm run test src/tests/chat-api.test.ts
```

### WebSocket Tests

```bash
npm run test src/tests/websocket-chat.test.ts
```

### Integration Tests

```bash
npm run test:integration
```

### Test Coverage

- ✅ Chat API endpoints
- ✅ WebSocket real-time communication
- ✅ RAG processing pipeline
- ✅ Error handling
- ✅ Authentication & authorization
- ✅ Performance benchmarks

## 📊 Performance Metrics

### Target Performance

- **Response Time**: < 2 secondi per elaborazione media
- **WebSocket Latency**: < 100ms per messaggi real-time
- **Confidence Score**: > 0.7 per risposte di qualità
- **Throughput**: 100+ richieste/minuto per istanza

### Monitoring

```bash
# Health check
curl http://localhost:3000/health

# WebSocket status
curl http://localhost:3000/ws/health
```

## 🔒 Security

### Authentication

- JWT token authentication richiesto per tutti gli endpoint
- Token incluso in header Authorization o query parameter per WebSocket

### Rate Limiting

- 100 richieste per minuto per utente
- Gestione automatica del backoff

### Input Sanitization

- Rimozione di tag HTML/script
- Validazione lunghezza contenuti
- Escape di caratteri speciali

## 🚦 Error Handling

### Codici di Errore

- `400`: Dati di richiesta invalidi
- `401`: Token mancante o invalido
- `404`: Risorsa non trovata
- `429`: Rate limit superato
- `500`: Errore interno del server

### Fallback Strategies

- Risposta di fallback se RAG service non disponibile
- Graceful degradation per errori di rete
- Retry automatico per operazioni critiche

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/agriai"

# JWT
JWT_SECRET="your-secret-key"

# OpenAI
OPENAI_API_KEY="your-openai-key"

# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Frontend
FRONTEND_URL="http://localhost:5173"

# Logging
LOG_LEVEL=info
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Monitoring & Analytics

### Metrics Tracked

- Numero di conversazioni attive
- Tempo medio di risposta
- Score di confidenza medio
- Utilizzo delle fonti RAG
- Feedback degli utenti

### Logging

```typescript
// Structured logging per analytics
app.log.info({
  event: 'chat_message_processed',
  userId: user.id,
  conversationId: conversation.id,
  processingTime: 1250,
  confidence: 0.89,
  sourcesUsed: 3
});
```

## 🤝 Contributing

1. Fork il repository
2. Crea un branch per la feature (`git checkout -b feature/amazing-feature`)
3. Commit le modifiche (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

## 📄 License

Questo progetto è licenziato sotto MIT License. Vedi il file `LICENSE` per dettagli.