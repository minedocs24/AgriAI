/**
 * Prisma Seed Script per AgriAI - Piattaforma Agricola con RAG
 * 
 * Popola il database con dati realistici per sviluppo e testing:
 * - Organizzazioni e utenti di esempio
 * - Categorie documenti specializzate per agricoltura
 * - Documenti mock su PAC, PSR, Bio, IoT, FEASR, PNRR
 * - Conversazioni di esempio con messaggi RAG
 * - Keywords e embeddings simulati
 */

import { PrismaClient, UserType, DocumentStatus, AccessLevel, ConversationStatus, MessageSender } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Avvio seeding database AgriAI...')

  // Cleanup esistente (per re-seeding)
  await cleanup()

  // 1. Organizzazioni
  const organizations = await seedOrganizations()
  console.log('✅ Organizzazioni create:', organizations.length)

  // 2. Utenti
  const users = await seedUsers(organizations)
  console.log('✅ Utenti creati:', users.length)

  // 3. Categorie documenti
  const categories = await seedCategories()
  console.log('✅ Categorie create:', categories.length)

  // 4. Keywords agricole
  const keywords = await seedKeywords()
  console.log('✅ Keywords create:', keywords.length)

  // 5. Documenti agricoli
  const documents = await seedDocuments(categories, users)
  console.log('✅ Documenti creati:', documents.length)

  // 6. Analisi documenti AI
  await seedDocumentAnalysis(documents)
  console.log('✅ Analisi documenti create')

  // 7. Embeddings simulati
  await seedDocumentEmbeddings(documents)
  console.log('✅ Embeddings creati')

  // 8. Conversazioni RAG
  const conversations = await seedConversations(users)
  console.log('✅ Conversazioni create:', conversations.length)

  // 9. Messaggi con sources RAG
  await seedMessages(conversations, documents)
  console.log('✅ Messaggi creati')

  // 10. Feedback utenti
  await seedFeedback(conversations, users)
  console.log('✅ Feedback creati')

  // 11. Consent GDPR
  await seedConsents(users)
  console.log('✅ Consensi GDPR creati')

  console.log('🎉 Database seeding completato con successo!')
}

async function cleanup() {
  console.log('🧹 Pulizia database esistente...')
  
  // Elimina in ordine di dipendenze
  await prisma.auditLog.deleteMany()
  await prisma.userConsent.deleteMany()
  await prisma.dataExportRequest.deleteMany()
  await prisma.conversationFeedback.deleteMany()
  await prisma.messageFeedback.deleteMany()
  await prisma.queryEmbedding.deleteMany()
  await prisma.documentEmbedding.deleteMany()
  await prisma.documentAnalysis.deleteMany()
  await prisma.categoryKeyword.deleteMany()
  await prisma.documentKeyword.deleteMany()
  await prisma.keyword.deleteMany()
  await prisma.messageSource.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.document.deleteMany()
  await prisma.category.deleteMany()
  await prisma.userSession.deleteMany()
  await prisma.userPreferences.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()
}

async function seedOrganizations() {
  const organizations = [
    {
      name: "Confederazione Agricoltori Italiani",
      slug: "cai-italia",
      description: "Organizzazione nazionale di rappresentanza degli agricoltori italiani",
      websiteUrl: "https://www.confagricoltura.it",
      subscriptionTier: "ENTERPRISE" as const,
      maxUsers: 500,
      maxDocuments: 10000,
      settings: {
        features: ["advanced_analytics", "custom_ai_models", "priority_support"],
        regions: ["nord", "centro", "sud"],
        specializations: ["cereali", "vitivinicolo", "zootecnia", "biologico"]
      }
    },
    {
      name: "Cooperativa Agricola San Marco",
      slug: "coop-sanmarco",
      description: "Cooperativa agricola specializzata in produzione biologica certificata",
      websiteUrl: "https://www.coopsanmarco.it",
      subscriptionTier: "PROFESSIONAL" as const,
      maxUsers: 50,
      maxDocuments: 1000,
      settings: {
        features: ["organic_certification", "supply_chain_tracking"],
        focus: "biologico",
        territory: "Emilia-Romagna"
      }
    },
    {
      name: "AgriTech Innovation Hub",
      slug: "agritech-hub",
      description: "Hub di innovazione per tecnologie agricole e sostenibilità",
      websiteUrl: "https://www.agritechhub.it",
      subscriptionTier: "PROFESSIONAL" as const,
      maxUsers: 100,
      maxDocuments: 2500,
      settings: {
        features: ["iot_integration", "precision_farming", "data_analytics"],
        focus: "innovazione_tecnologica",
        partnerships: ["università", "startup", "multinazionali"]
      }
    }
  ]

  return await Promise.all(
    organizations.map(org => 
      prisma.organization.create({ data: org })
    )
  )
}

async function seedUsers(organizations: any[]) {
  const hashedPassword = await bcrypt.hash('AgriAI2024!', 12)
  
  const users = [
    // Super Admin
    {
      email: "admin@agriai.com",
      passwordHash: hashedPassword,
      firstName: "Marco",
      lastName: "Rossi",
      userType: "SUPER_ADMIN" as UserType,
      emailVerified: true,
      bio: "Sviluppatore senior e esperto di sistemi agricoli intelligenti",
      location: "Milano, Italia"
    },
    // Utenti Confederazione
    {
      email: "direttore@confagricoltura.it",
      passwordHash: hashedPassword,
      firstName: "Giovanni",
      lastName: "Bianchi",
      userType: "ADMIN" as UserType,
      organizationId: organizations[0].id,
      emailVerified: true,
      bio: "Direttore tecnico della Confederazione Agricoltori Italiani",
      location: "Roma, Italia"
    },
    {
      email: "consulente@confagricoltura.it",
      passwordHash: hashedPassword,
      firstName: "Anna",
      lastName: "Verdi",
      userType: "MEMBER" as UserType,
      organizationId: organizations[0].id,
      emailVerified: true,
      bio: "Consulente specializzata in normative PAC e finanziamenti europei",
      location: "Bologna, Italia"
    },
    // Utenti Cooperativa
    {
      email: "presidente@coopsanmarco.it",
      passwordHash: hashedPassword,
      firstName: "Luigi",
      lastName: "Ferrari",
      userType: "ADMIN" as UserType,
      organizationId: organizations[1].id,
      emailVerified: true,
      bio: "Presidente cooperativa agricola, esperto in certificazioni biologiche",
      location: "Modena, Italia"
    },
    {
      email: "agronomo@coopsanmarco.it",
      passwordHash: hashedPassword,
      firstName: "Maria",
      lastName: "Conte",
      userType: "MEMBER" as UserType,
      organizationId: organizations[1].id,
      emailVerified: true,
      bio: "Agronoma specializzata in produzione biologica e sostenibilità",
      location: "Reggio Emilia, Italia"
    },
    // Utenti AgriTech Hub
    {
      email: "cto@agritechhub.it",
      passwordHash: hashedPassword,
      firstName: "Stefano",
      lastName: "Lombardi",
      userType: "ADMIN" as UserType,
      organizationId: organizations[2].id,
      emailVerified: true,
      bio: "CTO esperto in IoT agricolo e precision farming",
      location: "Torino, Italia"
    },
    // Utenti pubblici
    {
      email: "agricoltore@example.com",
      passwordHash: hashedPassword,
      firstName: "Francesco",
      lastName: "Greco",
      userType: "PUBLIC" as UserType,
      emailVerified: true,
      bio: "Agricoltore indipendente interessato a innovazioni sostenibili",
      location: "Bari, Italia"
    }
  ]

  const createdUsers = await Promise.all(
    users.map(user => prisma.user.create({ data: user }))
  )

  // Crea preferenze per tutti gli utenti
  await Promise.all(
    createdUsers.map(user => 
      prisma.userPreferences.create({
        data: {
          userId: user.id,
          language: "it",
          timezone: "Europe/Rome",
          aiSettings: {
            response_length: user.userType === "SUPER_ADMIN" ? "detailed" : "standard",
            technical_level: user.userType === "PUBLIC" ? "basic" : "intermediate",
            preferred_topics: ["pac", "sostenibilita", "innovazione"]
          },
          uiPreferences: {
            theme: "light",
            density: "comfortable",
            dashboard_layout: "standard"
          }
        }
      })
    )
  )

  return createdUsers
}

async function seedCategories() {
  const categories = [
    {
      name: "Politica Agricola Comune (PAC)",
      slug: "pac",
      description: "Documenti ufficiali, regolamenti e guide sulla PAC 2023-2027",
      icon: "eu-flag",
      color: "#003399",
      accessLevel: "PUBLIC" as AccessLevel,
      sortOrder: 1
    },
    {
      name: "Programmi di Sviluppo Rurale (PSR)",
      slug: "psr",
      description: "PSR regionali, bandi di finanziamento e procedure di domanda",
      icon: "landscape",
      color: "#228B22",
      accessLevel: "PUBLIC" as AccessLevel,
      sortOrder: 2
    },
    {
      name: "Certificazione Biologica",
      slug: "biologico",
      description: "Normative, certificazioni e guide per l'agricoltura biologica",
      icon: "leaf",
      color: "#32CD32",
      accessLevel: "PUBLIC" as AccessLevel,
      sortOrder: 3
    },
    {
      name: "Internet of Things (IoT) Agricolo",
      slug: "iot-agricolo",
      description: "Tecnologie IoT, sensori, e sistemi di monitoraggio per l'agricoltura",
      icon: "sensors",
      color: "#FF6347",
      accessLevel: "MEMBER" as AccessLevel,
      sortOrder: 4
    },
    {
      name: "FEASR - Fondo Europeo Agricolo",
      slug: "feasr",
      description: "Finanziamenti FEASR, progetti di sviluppo rurale e cofinanziamenti",
      icon: "euro",
      color: "#4169E1",
      accessLevel: "PUBLIC" as AccessLevel,
      sortOrder: 5
    },
    {
      name: "PNRR Agricoltura",
      slug: "pnrr-agricoltura",
      description: "Misure PNRR per l'agricoltura sostenibile e la transizione ecologica",
      icon: "renewable-energy",
      color: "#FF8C00",
      accessLevel: "PUBLIC" as AccessLevel,
      sortOrder: 6
    },
    {
      name: "Sostenibilità e Clima",
      slug: "sostenibilita",
      description: "Pratiche sostenibili, adattamento climatico e economia circolare",
      icon: "eco",
      color: "#008B8B",
      accessLevel: "PUBLIC" as AccessLevel,
      sortOrder: 7
    },
    {
      name: "Normativa e Compliance",
      slug: "normativa",
      description: "Leggi, decreti, regolamenti e adempimenti normativi",
      icon: "legal",
      color: "#800080",
      accessLevel: "MEMBER" as AccessLevel,
      sortOrder: 8
    }
  ]

  return await Promise.all(
    categories.map(category => 
      prisma.category.create({ data: category })
    )
  )
}

async function seedKeywords() {
  const keywordSets = {
    pac: ["pac", "aiuti diretti", "pagamenti accoppiati", "greening", "condizionalità", "ecoschemi"],
    psr: ["psr", "feasr", "misure", "sottomisure", "leader", "gal", "sviluppo rurale"],
    biologico: ["biologico", "certificazione", "icea", "ccpb", "suolo e salute", "controllo"],
    iot: ["iot", "sensori", "monitoraggio", "precision farming", "agricoltura 4.0", "droni"],
    sostenibilita: ["sostenibilità", "carbon credit", "economia circolare", "biodiversità"],
    normativa: ["decreto", "regolamento", "direttiva", "adempimento", "sanzioni"]
  }

  const keywords: any[] = []
  for (const [topic, words] of Object.entries(keywordSets)) {
    for (const word of words) {
      keywords.push({
        keyword: word,
        normalized: word.toLowerCase(),
        frequency: Math.floor(Math.random() * 100) + 10,
        categoryAffinity: { [topic]: 0.8 + Math.random() * 0.2 }
      })
    }
  }

  return await Promise.all(
    keywords.map(keyword => 
      prisma.keyword.create({ data: keyword })
    )
  )
}

async function seedDocuments(categories: any[], users: any[]) {
  const documents = [
    // PAC Documents
    {
      title: "Regolamento PAC 2023-2027 - Guida Completa",
      description: "Guida completa al nuovo regolamento della Politica Agricola Comune per il periodo 2023-2027",
      contentType: "FILE" as const,
      categoryId: categories.find(c => c.slug === "pac")?.id,
      uploadedById: users.find(u => u.userType === "ADMIN")?.id,
      author: "Commissione Europea - DG AGRI",
      language: "it",
      status: "PUBLISHED" as DocumentStatus,
      accessLevel: "PUBLIC" as AccessLevel,
      contentExtracted: "La nuova PAC introduce ecoschemi obbligatori per tutti gli agricoltori...",
      wordCount: 15420,
      pageCount: 156,
      publishedAt: new Date("2023-01-15")
    },
    {
      title: "Ecoschemi PAC: Requisiti e Implementazione",
      description: "Guida dettagliata per l'implementazione degli ecoschemi nella nuova PAC",
      contentType: "FILE" as const,
      categoryId: categories.find(c => c.slug === "pac")?.id,
      uploadedById: users.find(u => u.email.includes("confagricoltura"))?.id,
      author: "MIPAAF - Direzione Generale",
      language: "it",
      status: "PUBLISHED" as DocumentStatus,
      accessLevel: "PUBLIC" as AccessLevel,
      contentExtracted: "Gli ecoschemi rappresentano la novità principale della PAC 2023-2027...",
      wordCount: 8750,
      pageCount: 89,
      publishedAt: new Date("2023-03-10")
    },
    // PSR Documents
    {
      title: "PSR Emilia-Romagna 2023-2027",
      description: "Programma di Sviluppo Rurale della Regione Emilia-Romagna per il nuovo periodo",
      contentType: "FILE" as const,
      categoryId: categories.find(c => c.slug === "psr")?.id,
      uploadedById: users.find(u => u.email.includes("coopsanmarco"))?.id,
      author: "Regione Emilia-Romagna",
      language: "it",
      status: "PUBLISHED" as DocumentStatus,
      accessLevel: "PUBLIC" as AccessLevel,
      contentExtracted: "Il PSR dell'Emilia-Romagna prevede interventi per 2.1 miliardi di euro...",
      wordCount: 12300,
      pageCount: 134,
      publishedAt: new Date("2023-02-20")
    },
    // Biologico Documents
    {
      title: "Manuale Certificazione Biologica ICEA 2024",
      description: "Manuale operativo per la certificazione biologica secondo gli standard ICEA",
      contentType: "FILE" as const,
      categoryId: categories.find(c => c.slug === "biologico")?.id,
      uploadedById: users.find(u => u.email.includes("coopsanmarco"))?.id,
      author: "ICEA - Istituto Certificazione Etica e Ambientale",
      language: "it",
      status: "PUBLISHED" as DocumentStatus,
      accessLevel: "MEMBER" as AccessLevel,
      contentExtracted: "La certificazione biologica ICEA garantisce il rispetto dei disciplinari...",
      wordCount: 6890,
      pageCount: 78,
      publishedAt: new Date("2024-01-10")
    },
    // IoT Documents
    {
      title: "Sensori IoT per Monitoraggio Colturale",
      description: "Guida all'implementazione di sistemi IoT per il monitoraggio delle colture",
      contentType: "FILE" as const,
      categoryId: categories.find(c => c.slug === "iot-agricolo")?.id,
      uploadedById: users.find(u => u.email.includes("agritechhub"))?.id,
      author: "AgriTech Innovation Hub",
      language: "it",
      status: "PUBLISHED" as DocumentStatus,
      accessLevel: "MEMBER" as AccessLevel,
      contentExtracted: "I sensori IoT permettono il monitoraggio continuo di parametri cruciali...",
      wordCount: 4560,
      pageCount: 45,
      publishedAt: new Date("2024-02-15")
    },
    // PNRR Documents
    {
      title: "PNRR Missione 2: Rivoluzione Verde",
      description: "Misure PNRR per l'agricoltura sostenibile e la transizione ecologica",
      contentType: "FILE" as const,
      categoryId: categories.find(c => c.slug === "pnrr-agricoltura")?.id,
      uploadedById: users.find(u => u.userType === "SUPER_ADMIN")?.id,
      author: "Presidenza del Consiglio dei Ministri",
      language: "it",
      status: "PUBLISHED" as DocumentStatus,
      accessLevel: "PUBLIC" as AccessLevel,
      contentExtracted: "La Missione 2 del PNRR destina risorse significative alla transizione ecologica...",
      wordCount: 9870,
      pageCount: 102,
      publishedAt: new Date("2023-06-30")
    }
  ]

  return await Promise.all(
    documents.map(doc => 
      prisma.document.create({ data: doc })
    )
  )
}

async function seedDocumentAnalysis(documents: any[]) {
  return await Promise.all(
    documents.map(doc => 
      prisma.documentAnalysis.create({
        data: {
          documentId: doc.id,
          summary: `Analisi AI: ${doc.title.substring(0, 100)}...`,
          extractedEntities: [
            { type: "ORGANIZATION", value: doc.author, confidence: 0.95 },
            { type: "DATE", value: doc.publishedAt?.toISOString().split('T')[0], confidence: 0.90 },
            { type: "TOPIC", value: "agricoltura", confidence: 0.85 }
          ],
          topics: [
            { topic: "PAC", probability: 0.8 },
            { topic: "sostenibilità", probability: 0.6 },
            { topic: "finanziamenti", probability: 0.7 }
          ],
          readabilityScore: 7.5 + Math.random() * 2,
          complexityScore: 6.0 + Math.random() * 3,
          confidence: 0.8 + Math.random() * 0.15,
          languageConfidence: 0.98,
          processingModel: "gpt-4-turbo",
          processingTimeMs: 2500 + Math.floor(Math.random() * 1000),
          tokenCount: Math.floor(doc.wordCount * 1.3),
          retrievalKeywords: ["pac", "agricoltura", "sostenibilità", "finanziamenti", "normativa"]
        }
      })
    )
  )
}

async function seedDocumentEmbeddings(documents: any[]) {
  const embeddings: any[] = []
  
  for (const doc of documents) {
    // Simula chunks per documenti lunghi
    const chunkCount = Math.ceil(doc.wordCount / 500)
    
    for (let i = 0; i < Math.min(chunkCount, 5); i++) {
      embeddings.push({
        documentId: doc.id,
        chunkIndex: i,
        chunkText: `Chunk ${i + 1} di ${doc.title}: ${doc.contentExtracted?.substring(0, 200)}...`,
        chunkStartChar: i * 500,
        chunkEndChar: Math.min((i + 1) * 500, doc.wordCount),
        embeddingModel: "text-embedding-ada-002",
        embeddingVersion: 1,
        tokenCount: 200 + Math.floor(Math.random() * 300),
        chunkMetadata: {
          section: i === 0 ? "introduction" : `section_${i}`,
          importance: 0.5 + Math.random() * 0.5
        },
        retrievalScore: 0.7 + Math.random() * 0.3
      })
    }
  }

  return await Promise.all(
    embeddings.map(embedding => 
      prisma.documentEmbedding.create({ data: embedding })
    )
  )
}

async function seedConversations(users: any[]) {
  const conversations = [
    {
      userId: users.find(u => u.email.includes("confagricoltura"))?.id,
      title: "Informazioni sugli Ecoschemi PAC",
      status: "ACTIVE" as ConversationStatus,
      context: {
        userProfile: "consulente_pac",
        organization: "confederazione",
        previousTopics: ["pac", "pagamenti_diretti"]
      },
      messageCount: 4,
      totalTokens: 1250,
      avgConfidence: 0.87
    },
    {
      userId: users.find(u => u.email.includes("coopsanmarco"))?.id,
      title: "Procedure Certificazione Biologica",
      status: "ACTIVE" as ConversationStatus,
      context: {
        userProfile: "presidente_cooperativa",
        focus: "biologico",
        urgency: "alta"
      },
      messageCount: 6,
      totalTokens: 1890,
      avgConfidence: 0.92
    },
    {
      userId: users.find(u => u.email.includes("agritechhub"))?.id,
      title: "Implementazione Sensori IoT",
      status: "ACTIVE" as ConversationStatus,
      context: {
        userProfile: "esperto_tecnologie",
        focus: "iot",
        technical_level: "advanced"
      },
      messageCount: 8,
      totalTokens: 2340,
      avgConfidence: 0.89
    },
    {
      userId: users.find(u => u.email === "agricoltore@example.com")?.id,
      title: "Domanda di Sostegno PSR",
      status: "ARCHIVED" as ConversationStatus,
      context: {
        userProfile: "agricoltore_indipendente",
        region: "puglia",
        completed: true
      },
      messageCount: 5,
      totalTokens: 1560,
      avgConfidence: 0.84,
      archivedAt: new Date("2024-01-20")
    }
  ]

  return await Promise.all(
    conversations.map(conv => {
      const { messageCount, totalTokens, avgConfidence, ...baseData } = conv
      
      return prisma.conversation.create({ data: baseData })
    })
  )
}

async function seedMessages(conversations: any[], documents: any[]) {
  const messagePairs = [
    // Conversazione 1: Ecoschemi PAC
    [
      {
        conversationId: conversations[0].id,
        content: "Ciao! Potresti spiegarmi cosa sono gli ecoschemi nella nuova PAC e come si applicano?",
        sender: "USER" as MessageSender,
        createdAt: new Date("2024-01-15T09:30:00Z")
      },
      {
        conversationId: conversations[0].id,
        content: "Gli ecoschemi sono una delle principali novità della PAC 2023-2027. Sono pratiche agricole sostenibili che gli agricoltori possono adottare volontariamente per ricevere pagamenti aggiuntivi. Secondo il regolamento PAC, gli ecoschemi coprono aree come:\n\n• Pratiche benefiche per il clima e l'ambiente\n• Benessere degli animali\n• Miglioramento della biodiversità\n\nVuoi che ti spieghi i requisiti specifici per l'Italia?",
        sender: "AI" as MessageSender,
        tokens: 156,
        confidence: 0.91,
        modelUsed: "gpt-4-turbo",
        processingTimeMs: 2100,
        createdAt: new Date("2024-01-15T09:30:45Z")
      }
    ],
    // Conversazione 2: Biologico
    [
      {
        conversationId: conversations[1].id,
        content: "Abbiamo una cooperativa in Emilia-Romagna e vogliamo certificare le nostre produzioni come biologiche. Qual è la procedura con ICEA?",
        sender: "USER" as MessageSender,
        createdAt: new Date("2024-02-10T14:20:00Z")
      },
      {
        conversationId: conversations[1].id,
        content: "Per ottenere la certificazione biologica ICEA, dovete seguire questi passaggi:\n\n1. **Domanda di certificazione**: Compilare il modulo ICEA con i dati dell'azienda\n2. **Piano di gestione biologica**: Dettagliare le pratiche agricole che adotterete\n3. **Ispezione iniziale**: ICEA effettuerà un controllo in azienda\n4. **Periodo di conversione**: Solitamente 2-3 anni per le colture permanenti\n\nIn Emilia-Romagna potete anche beneficiare dei contributi PSR per la conversione al biologico. Volete che vi fornisca i dettagli sui costi e tempi?",
        sender: "AI" as MessageSender,
        tokens: 201,
        confidence: 0.94,
        modelUsed: "gpt-4-turbo",
        processingTimeMs: 2800,
        createdAt: new Date("2024-02-10T14:21:15Z")
      }
    ]
  ]

  const messages: any[] = []
  for (const pair of messagePairs) {
    for (const msg of pair) {
      const createdMessage = await prisma.message.create({ data: msg })
      messages.push(createdMessage)
      
      // Aggiungi sources per messaggi AI
      if (msg.sender === "AI") {
        const relevantDocs = documents.filter(doc => 
          (msg.content.includes("PAC") && doc.title.includes("PAC")) ||
          (msg.content.includes("biologica") && doc.title.includes("Biologica")) ||
          (msg.content.includes("ICEA") && doc.title.includes("ICEA"))
        )
        
        for (const doc of relevantDocs.slice(0, 2)) {
          await prisma.messageSource.create({
            data: {
              messageId: createdMessage.id,
              documentId: doc.id,
              relevantSection: doc.contentExtracted?.substring(0, 200),
              confidence: 0.85 + Math.random() * 0.1,
              chunkIndex: 0,
              similarityScore: 0.78 + Math.random() * 0.15,
              citationText: `${doc.title} - ${doc.author}`
            }
          })
        }
      }
    }
  }

  return messages
}

async function seedFeedback(conversations: any[], users: any[]) {
  // Feedback conversazioni
  const conversationFeedback = conversations.slice(0, 2).map((conv, i) => ({
    conversationId: conv.id,
    rating: 4 + Math.floor(Math.random() * 2), // 4-5 stelle
    comment: i === 0 ? "Ottima spiegazione degli ecoschemi, molto dettagliata!" : "Procedure chiare e ben strutturate per la certificazione"
  }))

  return await Promise.all([
    ...conversationFeedback.map(fb => 
      prisma.conversationFeedback.create({ data: fb })
    )
  ])
}

async function seedConsents(users: any[]) {
  const consents: any[] = []
  
  for (const user of users) {
    const baseConsents = [
      { consentType: "NECESSARY", granted: true, legalBasis: "CONTRACT" },
      { consentType: "ANALYTICS", granted: true, legalBasis: "LEGITIMATE_INTERESTS" },
      { consentType: "MARKETING", granted: user.userType !== "PUBLIC", legalBasis: "CONSENT" }
    ]
    
    for (const consent of baseConsents) {
      consents.push({
        userId: user.id,
        ...consent,
        consentDate: new Date(),
        consentSource: "registration",
        ipAddress: "192.168.1." + Math.floor(Math.random() * 254)
      })
    }
  }

  return await Promise.all(
    consents.map(consent => 
      prisma.userConsent.create({ data: consent as any })
    )
  )
}

main()
  .catch((e) => {
    console.error('❌ Errore durante il seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })