import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from 'langchain/document';
import { cosineDistance } from '../lib/utils';

interface QueryRequest {
  query: string;
  conversationId: string;
  userId: string;
  context: {
    userType?: string;
    location?: string;
    farmType?: string;
    expertise?: string;
  };
  conversationHistory?: Array<{
    content: string;
    sender: string;
    createdAt: Date;
  }>;
}

interface RAGResponse {
  content: string;
  confidence: number;
  tokens: number;
  model: string;
  intent?: any;
  language?: string;
  sentiment?: number;
  metadata: any;
  sources?: Array<{
    id: string;
    documentId: string;
    chunkId?: string;
    title: string;
    content: string;
    score: number;
    relevance: number;
    rank: number;
    category?: string;
    metadata?: any;
  }>;
}

interface ExtractedEntity {
  text: string;
  type: string;
  confidence: number;
}

export class RAGService {
  private openai?: OpenAI;
  private embeddings?: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(private prisma: PrismaClient) {
    // Only initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      this.embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'text-embedding-3-small'
      });
    } else {
      console.warn('OpenAI API key not configured. RAG features will be limited.');
    }

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      lengthFunction: (text: string) => text.length,
    });
  }

  async processQuery(request: QueryRequest): Promise<RAGResponse> {
    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured, using fallback response');
        return this.generateFallbackResponse(request.query);
      }

      // Step 1: Extract intent and entities
      const intent = await this.extractIntent(request.query);
      const entities = await this.extractEntities(request.query);
      
      // Step 2: Perform semantic retrieval
      const retrievedDocs = await this.retrieveRelevantDocuments({
        query: request.query,
        limit: 5,
        filters: {
          userAccessLevel: request.context.userType || 'public',
          intent: intent,
          location: request.context.location,
          farmType: request.context.farmType
        }
      });

      // Step 3: Generate context-aware response
      const response = await this.generateRAGResponse({
        query: request.query,
        retrievedContext: retrievedDocs,
        userContext: request.context,
        conversationHistory: request.conversationHistory || [],
        intent: intent,
        entities: entities
      });

      // Step 4: Calculate confidence score
      const confidence = this.calculateRAGConfidence({
        query: request.query,
        retrievedDocs: retrievedDocs,
        generatedResponse: response.content,
        intent: intent
      });

      return {
        content: response.content,
        confidence: confidence,
        tokens: response.tokens,
        model: response.model,
        intent: intent,
        language: 'it',
        sentiment: await this.analyzeSentiment(request.query),
        metadata: {
          retrievalResults: retrievedDocs.length,
          processingSteps: ['intent_extraction', 'entity_extraction', 'retrieval', 'generation'],
          retrievalScores: retrievedDocs.map(doc => doc.score)
        },
        sources: retrievedDocs.map((doc, index) => ({
          id: doc.id,
          documentId: doc.documentId,
          chunkId: doc.chunkId,
          title: doc.title,
          content: doc.content,
          score: doc.score,
          relevance: doc.relevance,
          rank: index + 1,
          category: doc.category,
          metadata: doc.metadata
        }))
      };

    } catch (error) {
      console.error('RAG processing error:', error);
      
      // Fallback response
      return this.generateFallbackResponse(request.query);
    }
  }

  private async extractIntent(query: string): Promise<any> {
    try {
      if (!this.openai) {
        return { category: 'generale', confidence: 0.3 };
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Sei un classificatore di intenti per un sistema agricolo. 
            Classifica la query in una delle seguenti categorie:
            - normative_pac: Domande su normative PAC, regolamenti EU
            - certificazioni: Certificazioni BIO, DOP, IGP
            - tecnologie: IoT, smart farming, innovazioni
            - finanziamenti: Bandi, PNRR, contributi
            - coltivazione: Tecniche, malattie, fertilizzanti
            - meteo: Previsioni, clima, irrigazione
            - generale: Domande generiche
            
            Rispondi solo con il nome della categoria.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      });

      const intent = response.choices[0]?.message?.content?.trim() || 'generale';
      
      return {
        category: intent,
        confidence: 0.8 // Simplified confidence
      };

    } catch (error) {
      console.error('Intent extraction error:', error);
      return { category: 'generale', confidence: 0.3 };
    }
  }

  private async extractEntities(query: string): Promise<ExtractedEntity[]> {
    try {
      if (!this.openai) {
        return [];
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Estrai entità rilevanti dal testo agricolo. 
            Tipi di entità da identificare:
            - COLTURA: Nomi di colture (grano, mais, pomodori, etc.)
            - MALATTIA: Malattie delle piante
            - NORMATIVA: Riferimenti a leggi, regolamenti
            - LOCATION: Luoghi, regioni
            - TECNOLOGIA: Strumenti, macchinari, sensori
            - CERTIFICAZIONE: Tipi di certificazioni
            
            Formato risposta JSON: [{"text": "...", "type": "...", "confidence": 0.9}]`
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 200,
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          return [];
        }
      }
      return [];

    } catch (error) {
      console.error('Entity extraction error:', error);
      return [];
    }
  }

  private async retrieveRelevantDocuments(params: {
    query: string;
    limit: number;
    filters: any;
  }): Promise<any[]> {
    try {
      if (!this.embeddings) {
        // Return empty array if embeddings not available
        return [];
      }

      // Generate query embedding
      const queryEmbedding = await this.embeddings.embedQuery(params.query);
      
      // Search in uploaded documents first (higher priority)
      const uploadedDocuments = await this.prisma.document.findMany({
        where: {
          status: 'PUBLISHED',
          indexingStatus: 'COMPLETED',
          accessLevel: this.getAccessLevelFilter(params.filters.userAccessLevel),
          ...(params.filters.location && {
            metadata: {
              path: ['location'],
              equals: params.filters.location
            }
          })
        },
        include: {
          category: true
        },
        take: 20 // Get more for filtering
      });

      // Search in document embeddings for semantic similarity
      const documentsWithScores = await Promise.all(uploadedDocuments.map(async doc => {
        // Calculate text similarity as fallback
        const similarity = this.calculateTextSimilarity(params.query, doc.contentExtracted || '');
        const relevantChunk = await this.extractRelevantChunk(doc.contentExtracted || '', params.query);

        return {
          id: doc.id,
          documentId: doc.id,
          chunkId: null,
          title: doc.title,
          content: relevantChunk,
          score: similarity,
          relevance: similarity,
          category: doc.categoryId || 'Uncategorized',
          metadata: {
            author: doc.author,
            publishedAt: doc.publishedAt,
            version: doc.version,
            wordCount: doc.wordCount,
            fileMimeType: doc.fileMimeType,
            uploadDate: doc.createdAt
          }
        };
      }));

      // Sort by relevance and return top results
      return documentsWithScores
        .filter(doc => doc.score > 0.1) // Filter out very low relevance results
        .sort((a, b) => b.score - a.score)
        .slice(0, params.limit);

    } catch (error) {
      console.error('Document retrieval error:', error);
      return [];
    }
  }

  private async generateRAGResponse(params: {
    query: string;
    retrievedContext: any[];
    userContext: any;
    conversationHistory: any[];
    intent: any;
    entities: ExtractedEntity[];
  }): Promise<{ content: string; tokens: number; model: string }> {
    
    if (!this.openai) {
      return {
        content: this.generateFallbackResponse(params.query).content,
        tokens: 0,
        model: 'fallback'
      };
    }
    
    const prompt = this.buildRAGPrompt(params);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: prompt.systemPrompt
          },
          {
            role: 'user',
            content: prompt.userPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.2,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const content = response.choices[0]?.message?.content || 'Mi dispiace, non sono riuscito a generare una risposta.';
      const tokens = response.usage?.total_tokens || 0;

      return {
        content,
        tokens,
        model: 'gpt-4-turbo-preview'
      };

    } catch (error) {
      console.error('Response generation error:', error);
      return {
        content: 'Mi dispiace, si è verificato un errore durante la generazione della risposta. Riprova tra poco.',
        tokens: 0,
        model: 'fallback'
      };
    }
  }

  private buildRAGPrompt(params: {
    query: string;
    retrievedContext: any[];
    userContext: any;
    conversationHistory: any[];
    intent: any;
    entities: ExtractedEntity[];
  }) {
    const systemPrompt = `Sei AgriAI, un assistente AI specializzato in agricoltura italiana che utilizza un sistema RAG (Retrieval-Augmented Generation).
Rispondi in modo professionale ma con un tocco di ironia quando appropriato.

CONTESTO UTENTE:
- Tipo: ${params.userContext.userType || 'pubblico'}
- Località: ${params.userContext.location || 'non specificata'}
- Tipo azienda: ${params.userContext.farmType || 'non specificato'}
- Esperienza: ${params.userContext.expertise || 'non specificata'}

INTENT RILEVATO: ${params.intent.category}
ENTITÀ ESTRATTE: ${params.entities.map(e => `${e.text} (${e.type})`).join(', ')}

ISTRUZIONI RAG:
- Utilizza ESCLUSIVAMENTE il contesto recuperato per rispondere
- Se il contesto non è sufficiente, specifica quali informazioni mancano
- Cita le fonti usando il formato [FONTE X] quando appropriato
- Mantieni coerenza con il punteggio di rilevanza delle fonti
- Sintetizza informazioni da più fonti quando possibile
- Mantieni un tono professionale ma accessibile
- Aggiungi un tocco di ironia agricola quando appropriato
- Rispondi SEMPRE in italiano
- Se hai dubbi sull'accuratezza, esplicitalo
- Fornisci consigli pratici quando possibile`;

    const contextSection = params.retrievedContext.length > 0 
      ? params.retrievedContext.map((doc, index) => 
          `[FONTE ${index + 1}] ${doc.title}\n${doc.content}\n[RILEVANZA: ${doc.score.toFixed(3)}]\n`
        ).join('\n')
      : 'Nessun contesto specifico recuperato dalla knowledge base.';

    const historySection = params.conversationHistory.length > 0
      ? params.conversationHistory.slice(-3).map(msg => 
          `${msg.sender === 'USER' ? 'Utente' : 'AgriAI'}: ${msg.content}`
        ).join('\n')
      : '';

    const userPrompt = `${historySection ? `CRONOLOGIA CONVERSAZIONE:\n${historySection}\n\n` : ''}CONTESTO RECUPERATO DALLA KNOWLEDGE BASE:
${contextSection}

DOMANDA: ${params.query}

RISPOSTA:`;

    return { systemPrompt, userPrompt };
  }

  private calculateRAGConfidence(params: {
    query: string;
    retrievedDocs: any[];
    generatedResponse: string;
    intent: any;
  }): number {
    let confidence = 0.5; // Base confidence

    // Factor 1: Quality of retrieved documents
    if (params.retrievedDocs.length > 0) {
      const avgScore = params.retrievedDocs.reduce((sum, doc) => sum + doc.score, 0) / params.retrievedDocs.length;
      confidence += avgScore * 0.3;
    }

    // Factor 2: Intent classification confidence
    confidence += (params.intent.confidence || 0.5) * 0.2;

    // Factor 3: Response length and structure (simplified)
    const responseLength = params.generatedResponse.length;
    if (responseLength > 100 && responseLength < 2000) {
      confidence += 0.1;
    }

    // Factor 4: Source citation presence
    if (params.generatedResponse.includes('[FONTE')) {
      confidence += 0.1;
    }

    return Math.min(Math.max(confidence, 0.1), 0.95);
  }

  private async analyzeSentiment(text: string): Promise<number> {
    // Simplified sentiment analysis - in production use specialized models
    const positiveWords = ['buono', 'ottimo', 'eccellente', 'soddisfatto', 'perfetto'];
    const negativeWords = ['cattivo', 'pessimo', 'problema', 'difficoltà', 'errore'];
    
    const words = text.toLowerCase().split(' ');
    const positive = words.filter(word => positiveWords.some(pw => word.includes(pw))).length;
    const negative = words.filter(word => negativeWords.some(nw => word.includes(nw))).length;
    
    return (positive - negative) / Math.max(words.length, 1);
  }

  private generateFallbackResponse(query: string): RAGResponse {
    const fallbackResponses = [
      `Ciao! Sono AgriAI, il tuo assistente agricolo intelligente. Hai chiesto: "${query}". 

Al momento il sistema RAG non è completamente configurato (manca la chiave API di OpenAI), ma posso comunque aiutarti con informazioni generali sull'agricoltura.

Per domande specifiche su PAC, PSR, certificazioni biologiche, tecnologie IoT agricole o normative, ti consiglio di configurare la chiave API di OpenAI nel file .env.

Nel frattempo, posso rispondere a domande generali sull'agricoltura sostenibile e le best practices del settore.`,
      `Grazie per la tua domanda: "${query}". 

Sono AgriAI, specializzato in agricoltura italiana. Attualmente il sistema di intelligenza artificiale non è completamente configurato, ma posso fornirti informazioni di base su agricoltura sostenibile, normative europee e best practices del settore.

Per risposte più dettagliate e personalizzate, configura la chiave API di OpenAI nel file .env.`,
      `Ciao! Hai chiesto: "${query}". 

Sono il tuo assistente agricolo AgriAI. Al momento il sistema di elaborazione avanzata non è attivo, ma posso comunque aiutarti con informazioni generali su agricoltura, sostenibilità e normative del settore.

Per funzionalità complete, configura la chiave API di OpenAI.`
    ];

    return {
      content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
      confidence: 0.5,
      tokens: 100,
      model: 'fallback',
      metadata: {
        type: 'fallback',
        reason: 'openai_api_not_configured',
        message: 'Using fallback response due to missing OpenAI API key'
      },
      sources: []
    };
  }

  // Helper methods
  private getAccessLevelFilter(userType: string) {
    const accessMap: { [key: string]: any[] } = {
      'admin': ['PUBLIC', 'MEMBER', 'ADMIN'],
      'member': ['PUBLIC', 'MEMBER'],
      'public': ['PUBLIC']
    };
    
    return {
      in: accessMap[userType] || ['PUBLIC']
    };
  }

  private calculateTextSimilarity(query: string, text: string): number {
    // Simplified text similarity - in production use proper embeddings comparison
    const queryWords = new Set(query.toLowerCase().split(' ').filter(w => w.length > 2));
    const textWords = new Set(text.toLowerCase().split(' ').filter(w => w.length > 2));
    
    const intersection = new Set([...queryWords].filter(x => textWords.has(x)));
    const union = new Set([...queryWords, ...textWords]);
    
    return intersection.size / union.size;
  }

  private async extractRelevantChunk(content: string, query: string): Promise<string> {
    // Extract most relevant chunk from document
    const chunks = await this.textSplitter.splitText(content);
    
    if (chunks.length === 0) return content.substring(0, 500);
    
    // Find chunk with highest similarity to query
    let bestChunk = chunks[0];
    let bestScore = 0;
    
    for (const chunk of chunks) {
      const score = this.calculateTextSimilarity(query, chunk);
      if (score > bestScore) {
        bestScore = score;
        bestChunk = chunk;
      }
    }
    
    return bestChunk.substring(0, 500) + (bestChunk.length > 500 ? '...' : '');
  }

  // Calculate cosine similarity between two vectors
  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }
}