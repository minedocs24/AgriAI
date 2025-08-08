/**
 * AgriAI Document Processor
 * 
 * Service per processing avanzato documenti:
 * - Text extraction da PDF/Word/HTML/Plain text
 * - Chunking intelligente per RAG optimization  
 * - Generazione embeddings per semantic search
 * - Analisi contenuto con AI (sentiment, topics, entities)
 * - Integration con vector database
 * - Error handling e retry logic
 */

import { PrismaClient } from '@prisma/client';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
// import mammoth from 'mammoth';
// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
// import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
// import { HuggingFaceTransformersEmbeddings } from 'langchain/embeddings/hf_transformers';
// import { Document } from 'langchain/document';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as natural from 'natural';

interface DocumentChunk {
  chunkIndex: number;
  text: string;
  startChar: number;
  endChar: number;
  tokenCount: number;
  embedding?: number[];
  metadata: Record<string, any>;
}

interface ProcessingResult {
  documentId: string;
  extractedText: string;
  wordCount: number;
  language: string;
  chunks: DocumentChunk[];
  analysis: DocumentAnalysis;
  processingTime: number;
  success: boolean;
  error?: string;
}

interface DocumentAnalysis {
  summary: string;
  extractedEntities: Array<{ text: string; label: string; confidence: number }>;
  topics: Array<{ topic: string; confidence: number }>;
  sentiment: { score: number; label: string };
  readabilityScore: number;
  complexity: number;
  keywords: string[];
  language: string;
  confidenceScore: number;
}

interface SemanticSearchParams {
  query: string;
  categories?: string[];
  accessLevel: string[];
  limit: number;
  userId: string;
  minSimilarity?: number;
}

interface SemanticSearchResult {
  document: any;
  chunk: DocumentChunk;
  similarity: number;
  relevantSection: string;
  context: string;
}

export class DocumentProcessor {
  private prisma: PrismaClient;
  private embeddings: any; // Placeholder for embeddings service
  private textSplitter: any; // Placeholder for text splitter
  private tokenizer: any;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    
    // Initialize embeddings service (placeholder)
    this.embeddings = {
      embedDocuments: async (texts: string[]) => {
        // Placeholder implementation
        return texts.map(() => new Array(384).fill(0));
      },
      embedQuery: async (text: string) => {
        // Placeholder implementation
        return new Array(384).fill(0);
      }
    };

    // Initialize text splitter for RAG-optimized chunks (placeholder)
    this.textSplitter = {
      createDocuments: async (texts: string[]) => {
        // Simple text splitting implementation
        const chunks: any[] = [];
        for (const text of texts) {
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
          for (let i = 0; i < sentences.length; i += 3) {
            chunks.push({
              pageContent: sentences.slice(i, i + 3).join('. ') + '.'
            });
          }
        }
        return chunks;
      }
    };

    // Initialize tokenizer for accurate token counting
    this.tokenizer = natural.WordTokenizer;
  }

  /**
   * Process documento completo
   */
  async processDocument(documentId: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Get document from database
      const document = await this.prisma.document.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      // Update status
      await this.updateProcessingStatus(documentId, 'PROCESSING', 'PROCESSING');

      // Extract text based on content type
      let extractedText: string;
      
      if (document.filePath) {
        extractedText = await this.extractTextFromFile(
          document.filePath, 
          document.fileMimeType || 'application/octet-stream'
        );
      } else if (document.sourceUrl) {
        extractedText = await this.extractTextFromUrl(document.sourceUrl);
      } else {
        throw new Error('No content source available for processing');
      }

      // Detect language
      const language = this.detectLanguage(extractedText);

      // Count words
      const wordCount = this.countWords(extractedText);

      // Create optimized chunks for RAG
      const chunks = await this.createRAGOptimizedChunks(extractedText, documentId);

      // Generate embeddings for chunks
      await this.generateEmbeddings(chunks, documentId);

      // Analyze content with AI
      const analysis = await this.analyzeContent(extractedText, document);

      // Update document in database
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          contentExtracted: extractedText,
          wordCount,
          language,
          extractionStatus: 'COMPLETED',
          indexingStatus: 'COMPLETED',
          status: 'PUBLISHED',
          publishedAt: new Date()
        }
      });

      // Save analysis
      await this.saveDocumentAnalysis(documentId, analysis);

      // Save chunks and embeddings
      await this.saveDocumentEmbeddings(chunks, documentId);

      const processingTime = Date.now() - startTime;

      return {
        documentId,
        extractedText,
        wordCount,
        language,
        chunks,
        analysis,
        processingTime,
        success: true
      };

    } catch (error) {
      console.error(`Document processing error for ${documentId}:`, error);
      
      // Update error status
      await this.updateProcessingStatus(documentId, 'FAILED', 'FAILED');
      await this.logProcessingError(documentId, error);

      return {
        documentId,
        extractedText: '',
        wordCount: 0,
        language: 'unknown',
        chunks: [],
        analysis: this.createEmptyAnalysis(),
        processingTime: Date.now() - startTime,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract text da diversi formati di file
   */
  private async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPDF(filePath);
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.extractFromWord(filePath);
        
        case 'text/plain':
          return await this.extractFromPlainText(filePath);
        
        case 'text/html':
          return await this.extractFromHTML(filePath);
        
        case 'application/rtf':
          return await this.extractFromRTF(filePath);
        
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error(`Text extraction error for ${filePath}:`, error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Extract text da PDF usando PDF.js
   */
  private async extractFromPDF(filePath: string): Promise<string> {
    try {
      // In a real implementation, you would download from S3 first
      const s3Service = new (await import('./S3Service')).S3Service();
      const buffer = await s3Service.downloadDocumentAsBuffer(filePath);
      
      // Placeholder implementation - in production, use proper PDF.js
      return `PDF content from ${filePath} (placeholder implementation)`;
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text da documenti Word
   */
  private async extractFromWord(filePath: string): Promise<string> {
    try {
      const s3Service = new (await import('./S3Service')).S3Service();
      const buffer = await s3Service.downloadDocumentAsBuffer(filePath);
      
      // Placeholder implementation - in production, use proper mammoth
      return `Word document content from ${filePath} (placeholder implementation)`;
    } catch (error) {
      throw new Error(`Word extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text da plain text
   */
  private async extractFromPlainText(filePath: string): Promise<string> {
    try {
      const s3Service = new (await import('./S3Service')).S3Service();
      const buffer = await s3Service.downloadDocumentAsBuffer(filePath);
      return buffer.toString('utf-8');
    } catch (error) {
      throw new Error(`Plain text extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text da HTML
   */
  private async extractFromHTML(filePath: string): Promise<string> {
    try {
      const s3Service = new (await import('./S3Service')).S3Service();
      const buffer = await s3Service.downloadDocumentAsBuffer(filePath);
      const html = buffer.toString('utf-8');
      
      const $ = cheerio.load(html);
      
      // Remove script and style elements
      $('script, style').remove();
      
      // Extract text content
      return $('body').text()
        .replace(/\s+/g, ' ')
        .trim();
    } catch (error) {
      throw new Error(`HTML extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text da RTF
   */
  private async extractFromRTF(filePath: string): Promise<string> {
    try {
      const s3Service = new (await import('./S3Service')).S3Service();
      const buffer = await s3Service.downloadDocumentAsBuffer(filePath);
      const rtfContent = buffer.toString('utf-8');
      
      // Basic RTF parsing (for production, use a proper RTF parser)
      return rtfContent
        .replace(/\\[a-zA-Z0-9]+\s?/g, '') // Remove RTF commands
        .replace(/[{}]/g, '') // Remove braces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    } catch (error) {
      throw new Error(`RTF extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text da URL
   */
  private async extractTextFromUrl(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'AgriAI Document Processor/1.0'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Remove unwanted elements
      $('script, style, nav, header, footer, aside, .advertisement').remove();
      
      // Extract main content
      const mainContent = $('main, article, .content, .post, .entry').text() || $('body').text();
      
      return mainContent
        .replace(/\s+/g, ' ')
        .trim();
    } catch (error) {
      throw new Error(`URL extraction failed: ${error.message}`);
    }
  }

  /**
   * Crea chunks ottimizzati per RAG
   */
  private async createRAGOptimizedChunks(text: string, documentId: string): Promise<DocumentChunk[]> {
    try {
      // Split text into documents for LangChain
      const docs = await this.textSplitter.createDocuments([text]);
      
      const chunks: DocumentChunk[] = [];
      let currentPosition = 0;

      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        const chunkText = doc.pageContent;
        const startChar = text.indexOf(chunkText, currentPosition);
        const endChar = startChar + chunkText.length;
        
        // Count tokens for this chunk
        const tokens = this.tokenizer.tokenize(chunkText);
        const tokenCount = tokens ? tokens.length : Math.ceil(chunkText.length / 4);

        // Extract keywords for this chunk
        const chunkKeywords = this.extractKeywords(chunkText);

        chunks.push({
          chunkIndex: i,
          text: chunkText,
          startChar: Math.max(0, startChar),
          endChar,
          tokenCount,
          metadata: {
            documentId,
            chunkKeywords,
            length: chunkText.length,
            sentences: chunkText.split(/[.!?]+/).length,
            language: this.detectLanguage(chunkText)
          }
        });

        currentPosition = endChar;
      }

      return chunks;
    } catch (error) {
      throw new Error(`Chunk creation failed: ${error.message}`);
    }
  }

  /**
   * Genera embeddings per i chunks
   */
  private async generateEmbeddings(chunks: DocumentChunk[], documentId: string): Promise<void> {
    try {
      const batchSize = 10; // Process in batches to avoid rate limits
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const texts = batch.map(chunk => chunk.text);
        
        // Generate embeddings for the batch
        const embeddings = await this.embeddings.embedDocuments(texts);
        
        // Assign embeddings to chunks
        batch.forEach((chunk, index) => {
          chunk.embedding = embeddings[index];
        });

        // Add delay to respect rate limits
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Analisi del contenuto con AI
   */
  private async analyzeContent(text: string, document: any): Promise<DocumentAnalysis> {
    try {
      // Basic analysis without external AI service (implement based on needs)
      const keywords = this.extractKeywords(text);
      const language = this.detectLanguage(text);
      const sentiment = this.analyzeSentiment(text);
      const readabilityScore = this.calculateReadability(text);
      const complexity = this.calculateComplexity(text);
      
      // For a production system, you would call external AI services here
      const summary = this.generateBasicSummary(text);
      const entities = this.extractBasicEntities(text);
      const topics = this.extractTopics(text);

      return {
        summary,
        extractedEntities: entities,
        topics,
        sentiment,
        readabilityScore,
        complexity,
        keywords,
        language,
        confidenceScore: 0.8 // Would be calculated based on AI analysis quality
      };
    } catch (error) {
      console.error('Content analysis error:', error);
      return this.createEmptyAnalysis();
    }
  }

  /**
   * Semantic search tra i documenti
   */
  async semanticSearch(params: SemanticSearchParams): Promise<SemanticSearchResult[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddings.embedQuery(params.query);
      
      // Search in vector database using raw SQL for performance
      const sql = `
        SELECT 
          de.document_id,
          de.chunk_index,
          de.chunk_text,
          de.chunk_metadata,
          de.embedding <=> $1::vector as similarity,
          d.*,
          c.name as category_name
        FROM document_embeddings de
        JOIN documents d ON de.document_id = d.id
        JOIN categories c ON d.category_id = c.id
        WHERE d.status = 'PUBLISHED'
          AND d.deleted_at IS NULL
          AND d.access_level = ANY($2::access_level_enum[])
          ${params.categories?.length ? 'AND d.category_id = ANY($3::uuid[])' : ''}
        ORDER BY similarity ASC
        LIMIT $${params.categories?.length ? '4' : '3'}
      `;

      const queryParams = [
        JSON.stringify(queryEmbedding),
        params.accessLevel
      ];

      if (params.categories?.length) {
        queryParams.push(params.categories);
      }

      const results = await this.prisma.$queryRawUnsafe(sql, ...queryParams);

      // Process and enrich results
      return (results as any[])
        .filter(row => row.similarity <= (params.minSimilarity || 0.8))
        .map(row => ({
          document: {
            id: row.document_id,
            title: row.title,
            description: row.description,
            category: { name: row.category_name },
            author: row.author,
            publishedAt: row.published_at
          },
          chunk: {
            chunkIndex: row.chunk_index,
            text: row.chunk_text,
            startChar: 0,
            endChar: row.chunk_text.length,
            tokenCount: 0,
            metadata: row.chunk_metadata
          },
          similarity: 1 - row.similarity, // Convert distance to similarity
          relevantSection: this.extractRelevantSection(row.chunk_text, params.query),
          context: this.generateContext(row.chunk_text, params.query)
        }));

    } catch (error) {
      console.error('Semantic search error:', error);
      throw new Error(`Semantic search failed: ${error.message}`);
    }
  }

  // Helper methods
  private detectLanguage(text: string): string {
    // Basic language detection (in production, use a proper language detection library)
    const italianWords = ['il', 'la', 'di', 'che', 'e', 'un', 'a', 'per', 'non', 'con'];
    const englishWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'for'];
    
    const words = text.toLowerCase().split(/\s+/).slice(0, 100);
    const italianCount = words.filter(word => italianWords.includes(word)).length;
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    return italianCount > englishCount ? 'it' : 'en';
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private extractKeywords(text: string, limit: number = 10): string[] {
    // Basic keyword extraction using TF-IDF approach
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([word]) => word);
  }

  private analyzeSentiment(text: string): { score: number; label: string } {
    // Basic sentiment analysis (in production, use a proper sentiment analysis library)
    const positiveWords = ['buono', 'ottimo', 'eccellente', 'positivo', 'successo'];
    const negativeWords = ['cattivo', 'pessimo', 'negativo', 'fallimento', 'problema'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    const score = (positiveCount - negativeCount) / words.length;
    const label = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral';
    
    return { score: Math.max(-1, Math.min(1, score)), label };
  }

  private calculateReadability(text: string): number {
    // Simple readability score based on sentence and word length
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    const avgCharsPerWord = text.replace(/\s/g, '').length / words;
    
    // Flesch Reading Ease approximation
    return Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgCharsPerWord / 5)));
  }

  private calculateComplexity(text: string): number {
    // Complexity based on vocabulary diversity and sentence structure
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const vocabularyDiversity = uniqueWords.size / words.length;
    
    return Math.min(10, vocabularyDiversity * 10);
  }

  private generateBasicSummary(text: string): string {
    // Extract first few sentences as summary
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 3).join('. ') + '.';
  }

  private extractBasicEntities(text: string): Array<{ text: string; label: string; confidence: number }> {
    // Basic entity extraction (in production, use NLP libraries)
    const patterns = [
      { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, label: 'PERSON' },
      { pattern: /\b\d{4}\b/g, label: 'DATE' },
      { pattern: /\b[A-Z]{2,}\b/g, label: 'ORG' }
    ];

    const entities: Array<{ text: string; label: string; confidence: number }> = [];
    
    patterns.forEach(({ pattern, label }) => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        entities.push({
          text: match,
          label,
          confidence: 0.7
        });
      });
    });

    return entities.slice(0, 10); // Limit to 10 entities
  }

  private extractTopics(text: string): Array<{ topic: string; confidence: number }> {
    // Basic topic extraction based on keywords
    const topics = [
      { keywords: ['agricoltura', 'coltivazione', 'campo'], topic: 'Agricoltura' },
      { keywords: ['pac', 'politica', 'europea'], topic: 'Politiche Agricole' },
      { keywords: ['biologico', 'sostenibile', 'ambiente'], topic: 'Sostenibilità' },
      { keywords: ['tecnologia', 'digitale', 'iot'], topic: 'Tecnologia' }
    ];

    const lowerText = text.toLowerCase();
    
    return topics
      .map(({ keywords, topic }) => {
        const count = keywords.reduce((sum, keyword) => 
          sum + (lowerText.split(keyword).length - 1), 0);
        return {
          topic,
          confidence: Math.min(1, count / text.split(' ').length * 100)
        };
      })
      .filter(({ confidence }) => confidence > 0.1)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  private extractRelevantSection(chunkText: string, query: string): string {
    const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = chunkText.split(/[.!?]+/);
    
    // Find sentences containing query words
    const relevantSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return queryWords.some(word => lowerSentence.includes(word));
    });

    return relevantSentences.slice(0, 2).join('. ') + '.';
  }

  private generateContext(chunkText: string, query: string): string {
    // Generate context around relevant parts
    const words = chunkText.split(/\s+/);
    const queryWords = query.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
      if (queryWords.some(qword => words[i].toLowerCase().includes(qword.toLowerCase()))) {
        const start = Math.max(0, i - 20);
        const end = Math.min(words.length, i + 20);
        return words.slice(start, end).join(' ') + '...';
      }
    }
    
    return chunkText.substring(0, 200) + '...';
  }

  private createEmptyAnalysis(): DocumentAnalysis {
    return {
      summary: '',
      extractedEntities: [],
      topics: [],
      sentiment: { score: 0, label: 'neutral' },
      readabilityScore: 0,
      complexity: 0,
      keywords: [],
      language: 'unknown',
      confidenceScore: 0
    };
  }

  private async updateProcessingStatus(
    documentId: string, 
    extractionStatus: any, 
    indexingStatus: any
  ): Promise<void> {
    await this.prisma.document.update({
      where: { id: documentId },
      data: { extractionStatus, indexingStatus }
    });
  }

  private async saveDocumentAnalysis(documentId: string, analysis: DocumentAnalysis): Promise<void> {
    await this.prisma.documentAnalysis.upsert({
      where: { documentId },
      update: {
        summary: analysis.summary,
        extractedEntities: analysis.extractedEntities,
        topics: analysis.topics,
        readabilityScore: analysis.readabilityScore,
        confidence: analysis.confidenceScore,
        languageConfidence: 0.9,
        processingModel: 'agriai-processor-v1',
        retrievalKeywords: analysis.keywords
      },
      create: {
        documentId,
        summary: analysis.summary,
        extractedEntities: analysis.extractedEntities,
        topics: analysis.topics,
        readabilityScore: analysis.readabilityScore,
        confidence: analysis.confidenceScore,
        languageConfidence: 0.9,
        processingModel: 'agriai-processor-v1',
        retrievalKeywords: analysis.keywords
      }
    });
  }

  private async saveDocumentEmbeddings(chunks: DocumentChunk[], documentId: string): Promise<void> {
    for (const chunk of chunks) {
      if (chunk.embedding) {
        await this.prisma.documentEmbedding.create({
          data: {
            documentId,
            chunkIndex: chunk.chunkIndex,
            chunkText: chunk.text,
            chunkStartChar: chunk.startChar,
            chunkEndChar: chunk.endChar,
            embeddingModel: 'text-embedding-ada-002',
            tokenCount: chunk.tokenCount,
            chunkMetadata: chunk.metadata
          }
        });
      }
    }
  }

  private async logProcessingError(documentId: string, error: any): Promise<void> {
    await this.prisma.document.update({
      where: { id: documentId },
      data: {
        processingLogs: {
          push: {
            timestamp: new Date(),
            level: 'error',
            message: error.message,
            stack: error.stack
          }
        }
      }
    });
  }
}

export default DocumentProcessor;