# 📚 AgriAI Design System - Documentazione Storybook Completa

## 🎯 Panoramica

Documentazione completa di **tutti i componenti** del design system AgriAI, organizzata secondo la metodologia **Atomic Design** e ottimizzata per Storybook. Questa documentazione fornisce esempi interattivi, guidelines d'uso e best practices per sviluppatori.

## 📖 Indice Componenti

### 🔬 **Atomic Components** (Livello 1)
1. [Button](#button-component)
2. [Input](#input-component)
3. [Card](#card-component)
4. [Badge](#badge-component)
5. [Avatar](#avatar-component)
6. [Spinner](#spinner-component)

### 🧪 **Molecular Components** (Livello 2)
1. [SearchInput](#searchinput-component)
2. [MessageBubble](#messagebubble-component)
3. [DocumentCard](#documentcard-component)

### 🧬 **Organism Components** (Livello 3)
1. [Navigation](#navigation-component)
2. [Header](#header-component)
3. [Footer](#footer-component)

### 📄 **Template Components** (Livello 4)
1. [AppLayout](#applayout-template)
2. [AuthLayout](#authlayout-template)
3. [BackendLayout](#backendlayout-template)

---

## 🔬 Atomic Components

### Button Component

#### 📋 **Overview**
Componente button versatile con supporto per varianti agricole, stati di loading e icone.

#### 🎨 **Variants**
```tsx
// Standard variants
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>

// Agricultural variants
<Button variant="agricultural">Agricultural</Button>
<Button variant="earth">Earth</Button>
<Button variant="harvest">Harvest</Button>
<Button variant="weather">Weather</Button>

// Outline agricultural variants
<Button variant="outline-agricultural">Outline Agricultural</Button>
<Button variant="outline-earth">Outline Earth</Button>
<Button variant="outline-harvest">Outline Harvest</Button>

// Semantic variants
<Button variant="success">Success</Button>
<Button variant="warning">Warning</Button>
<Button variant="info">Info</Button>
```

#### 📏 **Sizes**
```tsx
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

// Icon variants
<Button size="icon">🌾</Button>
<Button size="icon-sm">🌱</Button>
<Button size="icon-lg">🚜</Button>
```

#### ⚡ **States & Features**
```tsx
// Loading state
<Button loading>Loading...</Button>
<Button loading loadingText="Caricamento...">Submit</Button>

// With icons
<Button startIcon={<Sprout />}>Pianta</Button>
<Button endIcon={<ArrowRight />}>Continua</Button>

// Disabled
<Button disabled>Disabled</Button>

// Icon only
<IconButton icon={<Settings />} aria-label="Impostazioni" />
```

#### 🎭 **Button Groups**
```tsx
<ButtonGroup orientation="horizontal">
  <Button variant="agricultural">Colture</Button>
  <Button variant="earth">Terreni</Button>
  <Button variant="harvest">Raccolto</Button>
</ButtonGroup>

<ButtonGroup orientation="vertical">
  <Button>Opzione 1</Button>
  <Button>Opzione 2</Button>
  <Button>Opzione 3</Button>
</ButtonGroup>
```

#### ♿ **Accessibility**
- **ARIA Support**: Automatic aria-busy e aria-disabled per loading/disabled states
- **Keyboard Navigation**: Tab/Enter/Space support
- **Screen Readers**: Proper labeling per icon buttons

#### 💡 **Usage Guidelines**
- Usa varianti **agricultural** per azioni primarie agricole
- **Loading states** per operazioni async (upload, API calls)
- **Icon buttons** per azioni comuni (edit, delete, share)
- **Button groups** per opzioni correlate

---

### Input Component

#### 📋 **Overview**
Sistema di input avanzato con validazione, stati di errore e helper text integrati.

#### 🎨 **Variants**
```tsx
// Basic variants
<Input variant="default" placeholder="Input normale" />
<Input variant="success" placeholder="Input successo" />
<Input variant="error" placeholder="Input errore" />
<Input variant="warning" placeholder="Input warning" />

// Agricultural variants
<Input variant="agricultural" placeholder="Input agricolo" />
<Input variant="earth" placeholder="Input terra" />
<Input variant="harvest" placeholder="Input raccolto" />
```

#### 📏 **Sizes**
```tsx
<Input size="sm" placeholder="Input piccolo" />
<Input size="default" placeholder="Input normale" />
<Input size="lg" placeholder="Input grande" />
```

#### ⚡ **Features**
```tsx
// With validation
<Input 
  error={true}
  errorMessage="Email non valida"
  placeholder="email@esempio.com"
/>

<Input 
  success={true}
  successMessage="Email verificata"
  placeholder="email@esempio.com"
/>

// With icons
<Input 
  startIcon={<Mail />}
  placeholder="La tua email"
/>

<Input 
  endIcon={<Search />}
  placeholder="Cerca..."
/>

// Loading state
<Input loading placeholder="Caricamento..." />

// Character count
<Input 
  showCharCount
  maxLength={100}
  placeholder="Descrizione (max 100 caratteri)"
/>

// Helper text
<Input 
  helperText="Il tuo nome completo come appare sui documenti"
  placeholder="Nome completo"
/>
```

#### 🔧 **Specialized Inputs**
```tsx
// Password with toggle
<PasswordInput placeholder="Password sicura" />

// Search with clear
<SearchInput 
  placeholder="Cerca documenti..."
  onClear={() => console.log('Cleared')}
/>

// Textarea with resize
<Textarea 
  placeholder="Descrizione dettagliata..."
  resize="vertical"
  rows={4}
/>
```

#### ♿ **Accessibility**
- **Error Announcements**: Screen reader support per errori
- **ARIA Described By**: Collegamento automatico con helper text
- **Required Indicators**: Visual e semantic markers

#### 💡 **Usage Guidelines**
- **Error states** immediati per validazione real-time
- **Helper text** per guida utente
- **Character count** per limitazioni contenuto
- **Loading states** per ricerche async

---

### Card Component

#### 📋 **Overview**
Sistema di card flessibile per organizzare contenuti con stili agricoli.

#### 🎨 **Variants**
```tsx
// Basic variants
<Card variant="default">Default Card</Card>
<Card variant="agricultural">Agricultural Card</Card>
<Card variant="earth">Earth Card</Card>
<Card variant="harvest">Harvest Card</Card>
<Card variant="weather">Weather Card</Card>

// Layout variants
<Card variant="elevated">Elevated Card</Card>
<Card variant="outlined">Outlined Card</Card>
<Card variant="ghost">Ghost Card</Card>
```

#### 🎭 **Card Components**
```tsx
<Card variant="agricultural">
  <CardHeader centered>
    <CardTitle level="h2" size="lg">
      Raccolto Mais 2024
    </CardTitle>
    <CardDescription size="default">
      Analisi produttività stagionale
    </CardDescription>
  </CardHeader>
  
  <CardContent padding="lg">
    <p>Contenuto della card con informazioni dettagliate...</p>
  </CardContent>
  
  <CardFooter>
    <Button variant="agricultural">Visualizza Report</Button>
    <Button variant="outline">Esporta Dati</Button>
  </CardFooter>
</Card>
```

#### 🚜 **Agricultural Cards**
```tsx
// Agriculture metric card
<AgricultureMetricCard
  title="Produzione Mais"
  value={3542}
  unit="kg"
  description="Raccolto appezzamento Nord"
  status="optimal"
  icon={<Wheat />}
  trend="up"
  trendValue="+15%"
/>

// Field status card
<FieldStatusCard
  fieldName="Campo Sud"
  crop="Grano"
  status="good"
  area="12.5 ha"
  soilMoisture={65}
  temperature={23}
  lastIrrigation="2 giorni fa"
  nextHarvest="15 giorni"
/>
```

#### ⚡ **Interactive Cards**
```tsx
<Card 
  interactive
  onCardClick={() => console.log('Card clicked')}
  variant="agricultural"
>
  <CardContent>Clickable Card</CardContent>
</Card>
```

#### 💡 **Usage Guidelines**
- **Agricultural variants** per contenuti specifici del settore
- **Interactive cards** per navigazione
- **Metric cards** per KPI e statistiche
- **Consistent padding** tramite props

---

### Badge Component

#### 📋 **Overview**
Sistema di badge per status, etichette e notifiche con temi agricoli.

#### 🎨 **Variants**
```tsx
// Standard variants
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>

// Agricultural variants
<Badge variant="agricultural">Agricultural</Badge>
<Badge variant="earth">Earth</Badge>
<Badge variant="harvest">Harvest</Badge>
<Badge variant="weather">Weather</Badge>

// Outline agricultural
<Badge variant="outline-agricultural">Outline Agricultural</Badge>
<Badge variant="outline-earth">Outline Earth</Badge>

// Semantic variants
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="info">Info</Badge>

// Agricultural status
<Badge variant="optimal">Optimal</Badge>
<Badge variant="attention">Attention</Badge>
<Badge variant="critical">Critical</Badge>
<Badge variant="monitoring">Monitoring</Badge>
```

#### 📏 **Sizes**
```tsx
<Badge size="xs">XS</Badge>
<Badge size="default">Default</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>
<Badge size="xl">Extra Large</Badge>
```

#### ⚡ **Features**
```tsx
// With dot indicator
<Badge showDot dotColor="#10b981">With Dot</Badge>

// Removable badges
<Badge removable onRemove={() => console.log('Removed')}>
  Removable
</Badge>

// With icons
<Badge icon={<Leaf />} iconPosition="left">
  Organic
</Badge>

<Badge icon={<Star />} iconPosition="right">
  Premium
</Badge>
```

#### 🚜 **Specialized Badges**
```tsx
// Status badge with pulse
<StatusBadge status="optimal" pulse>
  Sistema Online
</StatusBadge>

// Notification badge
<NotificationBadge count={5} max={99} />

// Agricultural badge
<AgriculturalBadge type="crop" status="good">
  Mais Dolce
</AgriculturalBadge>

// Badge group
<BadgeGroup spacing="sm" wrap>
  <Badge variant="agricultural">PAC</Badge>
  <Badge variant="earth">BIO</Badge>
  <Badge variant="harvest">PNRR</Badge>
</BadgeGroup>
```

#### 💡 **Usage Guidelines**
- **Status badges** per stati sistema/colture
- **Notification badges** per contatori
- **Agricultural badges** per categorizzazione settoriale
- **Badge groups** per tag multipli

---

### Avatar Component

#### 📋 **Overview**
Sistema avatar con supporto per immagini, fallback e indicatori di stato.

#### 📏 **Sizes**
```tsx
<Avatar size="xs" />      // 24x24
<Avatar size="sm" />      // 32x32  
<Avatar size="default" /> // 40x40
<Avatar size="md" />      // 48x48
<Avatar size="lg" />      // 56x56
<Avatar size="xl" />      // 64x64
<Avatar size="2xl" />     // 80x80
<Avatar size="3xl" />     // 96x96
```

#### 🎨 **Variants & Shapes**
```tsx
// Variants
<Avatar variant="default" />
<Avatar variant="bordered" />
<Avatar variant="agricultural" />
<Avatar variant="earth" />
<Avatar variant="harvest" />

// Shapes
<Avatar shape="circle" />
<Avatar shape="square" />
<Avatar shape="rounded" />
```

#### ⚡ **Features**
```tsx
// With image
<Avatar>
  <AvatarImage src="/avatar.jpg" alt="Mario Rossi" />
  <AvatarFallback>MR</AvatarFallback>
</Avatar>

// Status indicator
<Avatar 
  status="online" 
  statusPosition="bottom-right"
>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>U</AvatarFallback>
</Avatar>

// Notification badge
<Avatar 
  notification 
  notificationCount={3}
>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>U</AvatarFallback>
</Avatar>

// Clickable
<Avatar onClick={() => console.log('Avatar clicked')}>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>U</AvatarFallback>
</Avatar>
```

#### 🚜 **Agricultural Avatars**
```tsx
// Role-based avatars
<AgriculturalAvatar 
  role="farmer" 
  name="Mario Rossi"
  src="/farmer.jpg"
/>

<AgriculturalAvatar 
  role="agronomist" 
  name="Dr. Lucia Bianchi"
/>

<AgriculturalAvatar 
  role="technician" 
  name="Paolo Verdi"
/>

// Avatar group
<AvatarGroup max={3} size="sm">
  <AgriculturalAvatar role="farmer" name="Mario" />
  <AgriculturalAvatar role="agronomist" name="Lucia" />
  <AgriculturalAvatar role="technician" name="Paolo" />
  <AgriculturalAvatar role="admin" name="Anna" />
</AvatarGroup>
```

#### 🎭 **Fallback Types**
```tsx
<Avatar>
  <AvatarFallback type="user" />    // User icon
  <AvatarFallback type="farmer" />  // Tractor icon
  <AvatarFallback type="organization" /> // Building icon
  <AvatarFallback type="equipment" />    // Settings icon
</Avatar>
```

#### 💡 **Usage Guidelines**
- **Agricultural roles** per team agricoli
- **Status indicators** per presenza online
- **Avatar groups** per team overview
- **Notification badges** per messaggi non letti

---

### Spinner Component

#### 📋 **Overview**
Componente loading con varianti animate per feedback utente.

#### 📏 **Sizes**
```tsx
<Spinner size="xs" />      // 12x12
<Spinner size="sm" />      // 16x16
<Spinner size="default" /> // 20x20
<Spinner size="md" />      // 24x24
<Spinner size="lg" />      // 32x32
<Spinner size="xl" />      // 40x40
```

#### 🎨 **Variants**
```tsx
<Spinner variant="default" />       // Border spinner
<Spinner variant="primary" />       // Primary color
<Spinner variant="secondary" />     // Secondary color
<Spinner variant="destructive" />   // Error state
<Spinner variant="agricultural" />  // Agricultural theme
<Spinner variant="dots" />          // Dots animation
```

#### ⚡ **Speed Control**
```tsx
<Spinner speed="slow" />    // 2s duration
<Spinner speed="default" /> // 1s duration  
<Spinner speed="fast" />    // 0.5s duration
```

#### 🎭 **Composed Spinners**
```tsx
// With text
<SpinnerWithText 
  size="lg" 
  variant="agricultural"
  text="Caricamento dati agricoli..."
  textPosition="bottom"
/>

// Loading overlay
<LoadingOverlay 
  visible={loading}
  variant="agricultural"
  text="Elaborazione in corso..."
  backdrop="blur"
/>
```

#### 💡 **Usage Guidelines**
- **Agricultural variant** per operazioni settoriali
- **Size matching** con parent container
- **Text descriptions** per operazioni lunghe
- **Overlay** per blocking operations

---

## 🧪 Molecular Components

### SearchInput Component

#### 📋 **Overview**
Componente di ricerca avanzato con dropdown suggerimenti e funzionalità intelligenti.

#### ⚡ **Basic Usage**
```tsx
<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  onSubmit={handleSearch}
  placeholder="Cerca documenti agricoli..."
  variant="agricultural"
  clearable
/>
```

#### 🎯 **With Suggestions**
```tsx
const suggestions = [
  {
    id: "pac-2023",
    text: "Regolamento PAC 2023",
    category: "Normativa",
    metadata: {
      description: "Politica Agricola Comune 2023-2027"
    }
  },
  {
    id: "bio-cert", 
    text: "Certificazione BIO",
    category: "Certificazioni",
    metadata: {
      description: "Procedura certificazione biologica"
    }
  }
];

<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  onSubmit={handleSearch}
  onSuggestionSelect={handleSuggestionSelect}
  suggestions={suggestions}
  maxSuggestions={6}
  showCategories={true}
  searchDelay={300}
/>
```

#### 🎨 **Variants & Configuration**
```tsx
// Different variants
<SearchInput variant="default" />
<SearchInput variant="agricultural" />
<SearchInput variant="earth" />
<SearchInput variant="harvest" />

// Size variants
<SearchInput size="sm" />
<SearchInput size="default" />
<SearchInput size="lg" />

// Configuration
<SearchInput
  loading={searching}
  disabled={!canSearch}
  clearable={true}
  searchDelay={500}
  maxSuggestions={10}
/>
```

#### 🎭 **Groups**
```tsx
<SearchInputGroup>
  <SearchInput placeholder="Cerca..." />
  <Button variant="agricultural">
    <Filter />
  </Button>
</SearchInputGroup>
```

#### ♿ **Accessibility**
- **Keyboard Navigation**: Arrow keys per navigare suggerimenti
- **ARIA Support**: Live regions per suggerimenti
- **Screen Reader**: Announcements per risultati

#### 💡 **Usage Guidelines**
- **Agricultural variant** per ricerche settoriali
- **Categories** per organizzare suggerimenti
- **Debouncing** per performance API
- **Clear button** per UX fluida

---

### MessageBubble Component

#### 📋 **Overview**
Componente per messaggi chat con supporto avatar, timestamp e funzionalità AI.

#### ⚡ **Basic Usage**
```tsx
const message = {
  id: "msg-1",
  content: "Ciao! Come posso aiutarti con la tua azienda agricola?",
  sender: "ai",
  timestamp: new Date(),
  confidence: 0.95
};

const aiUser = {
  id: "ai",
  name: "AgriAI Assistant", 
  role: "agronomist",
  status: "online"
};

<MessageBubble
  message={message}
  user={aiUser}
  isCurrentUser={false}
  variant="agricultural"
  showAvatar={true}
  showTimestamp={true}
  showConfidence={true}
/>
```

#### 🎨 **Variants & Users**
```tsx
// AI message
<MessageBubble
  message={aiMessage}
  user={aiUser}
  isCurrentUser={false}
  variant="agricultural"
  showConfidence={true}
  showSources={true}
  showFeedback={true}
/>

// User message  
<MessageBubble
  message={userMessage}
  user={currentUser}
  isCurrentUser={true}
  variant="default"
  showStatus={true}
/>

// System message
<MessageBubble
  message={systemMessage}
  variant="earth"
  showAvatar={false}
  showTimestamp={true}
/>
```

#### 🤖 **AI Features**
```tsx
const aiMessage = {
  id: "ai-msg",
  content: "Il bando PNRR Agrisolare offre incentivi fino al 40%...",
  sender: "ai",
  timestamp: new Date(),
  confidence: 0.88,
  sources: [
    {
      id: "src-1",
      title: "Decreto PNRR Agrisolare",
      excerpt: "Incentivi per fotovoltaico agricolo",
      confidence: 0.92
    }
  ]
};

<MessageBubble
  message={aiMessage}
  user={aiUser}
  showConfidence={true}
  showSources={true}
  showFeedback={true}
  onFeedback={(messageId, feedback) => {
    console.log(`Feedback: ${feedback} for ${messageId}`);
  }}
  onSourceClick={(source) => {
    console.log('Source clicked:', source);
  }}
/>
```

#### 👥 **User Types & Roles**
```tsx
// Agricultural roles
<MessageBubble
  user={{
    id: "farmer1",
    name: "Mario Rossi",
    role: "farmer",
    status: "online"
  }}
/>

<MessageBubble  
  user={{
    id: "agro1", 
    name: "Dr. Lucia Bianchi",
    role: "agronomist",
    status: "busy"
  }}
/>
```

#### 🎭 **Message Groups**
```tsx
<MessageGroup>
  <MessageBubble message={message1} />
  <MessageBubble message={message2} />
  <MessageBubble message={message3} />
</MessageGroup>
```

#### 💡 **Usage Guidelines**
- **AI messages** con confidence e sources
- **Agricultural roles** per avatar specifici
- **Feedback system** per miglioramento AI
- **Groups** per conversazioni fluide

---

### DocumentCard Component

#### 📋 **Overview**
Card specializzata per documenti con metadata, AI analysis e azioni complete.

#### ⚡ **Basic Usage**
```tsx
const document = {
  id: "doc-1",
  title: "Regolamento PAC 2023-2027",
  description: "Nuovo regolamento della Politica Agricola Comune",
  type: "pdf",
  status: "published", 
  thumbnailUrl: "/thumbnails/pac-2023.jpg",
  metadata: {
    size: 2457600,
    pages: 156,
    author: "Commissione Europea",
    uploadDate: new Date("2024-01-15"),
    tags: ["PAC", "Normativa", "EU"],
    category: "Normativa"
  }
};

<DocumentCard
  document={document}
  variant="default"
  themeVariant="agricultural"
  showThumbnail={true}
  showMetadata={true}
  showActions={true}
  onView={handleDocumentView}
  onDownload={handleDocumentDownload}
/>
```

#### 🎨 **Variants & Layouts**
```tsx
// Layout variants
<DocumentCard variant="default" />   // Full card
<DocumentCard variant="compact" />   // Condensed
<DocumentCard variant="detailed" />  // Extended info
<DocumentCard variant="grid" />      // Grid layout

// Theme variants
<DocumentCard themeVariant="agricultural" />
<DocumentCard themeVariant="earth" />
<DocumentCard themeVariant="harvest" />
<DocumentCard themeVariant="weather" />
```

#### 🤖 **AI Analysis**
```tsx
const documentWithAI = {
  ...document,
  aiAnalysis: {
    summary: "Il regolamento introduce nuove misure per la sostenibilità...",
    extractedKeywords: ["ecoschemi", "condizionalità", "pagamenti diretti"],
    scope: "Normativa europea",
    confidence: 0.92,
    correlations: ["PSR", "FEASR"]
  }
};

<DocumentCard
  document={documentWithAI}
  showAIAnalysis={true}
  variant="detailed"
/>
```

#### 📊 **Progress Tracking**
```tsx
const uploadingDocument = {
  ...document,
  status: "processing",
  progress: {
    stage: "Estrazione testo",
    progress: 65,
    eta: new Date(Date.now() + 5 * 60000)
  }
};

<DocumentCard
  document={uploadingDocument}
  showProgress={true}
  variant="detailed"
/>
```

#### 🎭 **Document Grid**
```tsx
<DocumentGrid columns={3} gap="md">
  {documents.map(doc => (
    <DocumentCard
      key={doc.id}
      document={doc}
      variant="grid"
      themeVariant="agricultural"
      onView={handleView}
      onDownload={handleDownload}
    />
  ))}
</DocumentGrid>
```

#### 💡 **Usage Guidelines**
- **Grid variant** per overview documenti
- **Detailed variant** per analisi approfondite
- **Progress indicators** per upload
- **AI analysis** per insights automatici

---

## 🧬 Organism Components

### Navigation Component

#### 📋 **Overview**
Sistema di navigazione completo con role-based access control e responsive design.

#### ⚡ **Basic Usage**
```tsx
<Navigation
  variant="horizontal"
  showBreadcrumb={true}
  showUserMenu={true}
  userMenuPosition="end"
  collapsible={true}
/>
```

#### 🎨 **Variants**
```tsx
// Horizontal navigation
<Navigation variant="horizontal" />

// Vertical sidebar
<Navigation variant="vertical" />

// Sidebar layout  
<Navigation variant="sidebar" />
```

#### 🔐 **Role-Based Items**
```tsx
const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    requiredRole: "MEMBER"
  },
  {
    id: "admin",
    label: "Amministrazione", 
    href: "/admin",
    icon: Shield,
    requiredRole: "ADMIN",
    children: [
      {
        id: "users",
        label: "Gestione Utenti",
        href: "/admin/users",
        icon: Users
      }
    ]
  }
];

<Navigation 
  items={navigationItems}
  variant="horizontal"
/>
```

#### 🍞 **Breadcrumb Navigation**
```tsx
const breadcrumbItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Backend", href: "/backend", icon: Building },
  { label: "Documenti", href: "/backend/documents", icon: FileText },
  { label: "PAC 2023" } // Current page
];

<Navigation 
  breadcrumbItems={breadcrumbItems}
  showBreadcrumb={true}
/>
```

#### 📱 **Mobile Support**
```tsx
<Navigation 
  variant="horizontal"
  collapsible={true}      // Mobile hamburger menu
  showUserMenu={true}     // User menu in mobile
/>
```

#### 💡 **Usage Guidelines**
- **Horizontal** per app navigation principale  
- **Sidebar** per dashboard/backend layouts
- **Role filtering** automatico basato su auth
- **Breadcrumb** per deep navigation

---

### Header Component

#### 📋 **Overview**
Header principale con search, notifiche, theme toggle e controlli utente.

#### ⚡ **Basic Usage**
```tsx
<Header
  variant="default"
  showSearch={true}
  showNotifications={true}
  showThemeToggle={true}
  showConnectionStatus={true}
  sticky={true}
/>
```

#### 🎨 **Variants**
```tsx
// Standard header
<Header variant="default" />

// Compact header
<Header variant="compact" />

// Floating header  
<Header variant="floating" />
```

#### 🔍 **Search Integration**
```tsx
const searchSuggestions = [
  {
    id: "weather",
    text: "Previsioni meteo 7 giorni",
    category: "Meteo"
  },
  {
    id: "fertilization",
    text: "Calcolo fertilizzazione NPK", 
    category: "Agronomia"
  }
];

<Header
  showSearch={true}
  searchSuggestions={searchSuggestions}
  onSearch={handleSearch}
  onSuggestionSelect={handleSuggestionSelect}
/>
```

#### 🔔 **Notifications**
```tsx
const notifications = [
  {
    id: "weather-alert",
    title: "Allerta Meteo",
    message: "Prevista pioggia intensa nelle prossime 24h",
    type: "warning",
    timestamp: new Date(),
    read: false,
    category: "system"
  }
];

<Header
  showNotifications={true}
  notifications={notifications}
  onNotificationClick={handleNotificationClick}
  onMarkAllRead={handleMarkAllRead}
/>
```

#### 🎭 **Variants Usage**
```tsx
// App header
<Header
  variant="default"
  showSearch={true}
  showNotifications={true}
  showThemeToggle={true}
/>

// Dashboard header
<Header
  variant="compact"  
  showSearch={true}
  showNotifications={true}
  showThemeToggle={false}
/>

// Landing page header
<Header
  variant="floating"
  showSearch={false}
  showNotifications={false}
  sticky={false}
/>
```

#### 💡 **Usage Guidelines**
- **Default variant** per applicazioni principali
- **Compact** per dashboard/backend
- **Floating** per landing pages  
- **Search** sempre disponibile quando pertinente

---

### Footer Component

#### 📋 **Overview**
Footer completo con links organizzati, social media, newsletter e informazioni legali.

#### ⚡ **Basic Usage**
```tsx
<Footer
  variant="default"
  showNewsletter={true}
  showSocial={true}
  showContact={true}
  showBackToTop={true}
/>
```

#### 🎨 **Variants**
```tsx
// Default footer
<Footer variant="default" />

// Minimal footer
<Footer variant="minimal" />

// Extended footer
<Footer variant="extended" />
```

#### 📧 **Newsletter Integration**
```tsx
<Footer
  showNewsletter={true}
  onNewsletterSignup={async (email) => {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) throw new Error('Subscription failed');
  }}
/>
```

#### 🌐 **Social Links**
```tsx
const customSocialLinks = [
  {
    id: "facebook",
    platform: "Facebook",
    href: "https://facebook.com/agriai",
    icon: Facebook,
    color: "#1877F2"
  },
  {
    id: "linkedin", 
    platform: "LinkedIn",
    href: "https://linkedin.com/company/agriai",
    icon: Linkedin,
    color: "#0A66C2"
  }
];

<Footer
  socialLinks={customSocialLinks}
  onSocialClick={(platform) => {
    analytics.track('Social Click', { platform });
  }}
/>
```

#### 🔗 **Custom Sections**
```tsx
const customSections = [
  {
    id: "solutions",
    title: "Soluzioni AgriAI",
    links: [
      {
        id: "precision",
        label: "Agricoltura di Precisione",
        href: "/solutions/precision",
        icon: Target
      },
      {
        id: "monitoring",
        label: "Monitoraggio Colture", 
        href: "/solutions/monitoring",
        icon: Eye
      }
    ]
  }
];

<Footer sections={customSections} />
```

#### 💡 **Usage Guidelines**
- **Default** per applicazioni principali
- **Minimal** per embedded/mobile
- **Extended** per homepage/marketing
- **Newsletter** per growth

---

## 📄 Template Components

### AppLayout Template

#### 📋 **Overview**
Layout principale dell'applicazione con header, navigation, sidebar e footer integrati.

#### ⚡ **Basic Usage**
```tsx
<AppLayout variant="default">
  <div className="container mx-auto py-6">
    <h1>Contenuto Principale</h1>
    <p>Il tuo contenuto qui...</p>
  </div>
</AppLayout>
```

#### 🎨 **Variants**
```tsx
// Standard layout
<AppLayout variant="default">
  {children}
</AppLayout>

// With sidebar
<AppLayout variant="sidebar">
  {children}
</AppLayout>

// Fullscreen (no header/footer)
<AppLayout variant="fullscreen">
  {children}
</AppLayout>

// Compact layout
<AppLayout variant="compact">
  {children}
</AppLayout>
```

#### 🎛️ **Configuration**
```tsx
<AppLayout
  variant="sidebar"
  loading={isLoading}
  error={errorMessage}
  onRetry={handleRetry}
  showBreadcrumb={true}
  mobileLayout="drawer"
  header={<CustomHeader />}
  sidebar={<CustomSidebar />}
  footer={<CustomFooter />}
>
  {children}
</AppLayout>
```

#### 🔌 **Configuration Helpers**
```tsx
import { getAppLayoutConfig } from '@/config/design-system';

// Standard app
<AppLayout {...getAppLayoutConfig('standard')}>
  {children}
</AppLayout>

// Dashboard app
<AppLayout {...getAppLayoutConfig('dashboard')}>
  {children}
</AppLayout>

// Chat app
<AppLayout {...getAppLayoutConfig('chat')}>
  {children}
</AppLayout>
```

#### 💡 **Usage Guidelines**
- **Default** per app principali
- **Sidebar** per dashboard/backend
- **Fullscreen** per focus mode (chat, editor)
- **Compact** per mobile/embedded

---

### AuthLayout Template

#### 📋 **Overview**
Layout pulito per pagine di autenticazione con branding e UX ottimizzata.

#### ⚡ **Basic Usage**
```tsx
<AuthLayout
  title="Accedi al tuo account"
  subtitle="Benvenuto in AgriAI"
  type="login"
>
  <LoginForm />
</AuthLayout>
```

#### 🎨 **Variants & Types**
```tsx
// Login layout
<LoginLayout>
  <LoginForm />
</LoginLayout>

// Register layout  
<RegisterLayout>
  <RegisterForm />
</RegisterLayout>

// Forgot password
<ForgotPasswordLayout>
  <ForgotPasswordForm />
</ForgotPasswordLayout>

// Reset password
<ResetPasswordLayout>
  <ResetPasswordForm />
</ResetPasswordLayout>
```

#### 🎨 **Background Variants**
```tsx
<AuthLayout
  backgroundVariant="gradient"    // Gradient agricolo
  showDecorations={true}         // Elementi decorativi
  showThemeToggle={true}         // Toggle tema
  showBackLink={true}            // Link ritorno
>
  <AuthForm />
</AuthLayout>

<AuthLayout
  backgroundVariant="pattern"    // Pattern geometrico
  showDecorations={false}
>
  <AuthForm />
</AuthLayout>

<AuthLayout
  backgroundVariant="image"      // Immagine di sfondo
  showDecorations={true}
>
  <AuthForm />
</AuthLayout>
```

#### 🔌 **Configuration Helpers**
```tsx
import { getAuthLayoutConfig } from '@/config/design-system';

<AuthLayout {...getAuthLayoutConfig('login')}>
  <LoginForm />
</AuthLayout>

<AuthLayout {...getAuthLayoutConfig('register')}>
  <RegisterForm />
</AuthLayout>
```

#### 💡 **Usage Guidelines**
- **Gradient background** per appeal visivo
- **Decorations** per branding agricolo
- **Theme toggle** per accessibilità
- **Back link** per navigazione fluida

---

### BackendLayout Template

#### 📋 **Overview**
Layout per pannelli amministrativi con sidebar, navigation e sistema metrico.

#### ⚡ **Basic Usage**
```tsx
<BackendLayout
  title="Dashboard AgriAI"
  description="Pannello di controllo amministrativo"
>
  <DashboardContent />
</BackendLayout>
```

#### 🔐 **Permission Control**
```tsx
<BackendLayout
  title="Gestione Utenti"
  requiredPermission="ADMIN"
  actions={
    <Button variant="agricultural">
      <Plus />
      Nuovo Utente
    </Button>
  }
>
  <UserManagement />
</BackendLayout>
```

#### 🍞 **Breadcrumb Navigation**
```tsx
const breadcrumbs = [
  { label: "Dashboard", href: "/backend", icon: BarChart3 },
  { label: "Documenti", href: "/backend/documents", icon: FileText },
  { label: "PAC 2023" }
];

<BackendLayout
  title="Regolamento PAC 2023"
  breadcrumbs={breadcrumbs}
  actions={
    <div className="flex gap-2">
      <Button variant="outline">Esporta</Button>
      <Button variant="agricultural">Modifica</Button>
    </div>
  }
>
  <DocumentDetails />
</BackendLayout>
```

#### 🎛️ **Sidebar Control**
```tsx
<BackendLayout
  showSidebar={true}
  collapsibleSidebar={true}
  sidebar={<CustomAdminSidebar />}
>
  <AdminContent />
</BackendLayout>
```

#### 🔌 **Configuration Helpers**
```tsx
import { getBackendLayoutConfig } from '@/config/design-system';

// Admin layout
<BackendLayout {...getBackendLayoutConfig('admin')}>
  <AdminPanel />
</BackendLayout>

// Member layout
<BackendLayout {...getBackendLayoutConfig('member')}>
  <MemberPanel />
</BackendLayout>
```

#### 📊 **System Metrics**
Il layout include automaticamente metriche di sistema quando si accede al dashboard principale (`/backend`):

- **Utenti Attivi**
- **Documenti Totali** 
- **Query AI**
- **Stato Sistema**

#### 💡 **Usage Guidelines**
- **Admin permission** per funzionalità avanzate
- **Breadcrumb** per navigation profonda
- **Actions** per operazioni pagina
- **Collapsible sidebar** per spazio ottimale

---

## 🎯 Configuration System

### Quick Setup
```tsx
import {
  // Components
  Button, Input, Card, Badge, Avatar,
  SearchInput, MessageBubble, DocumentCard,
  Navigation, Header, Footer,
  AppLayout, AuthLayout, BackendLayout,
  
  // Configuration utilities
  getButtonConfig, getInputConfig,
  getSearchInputConfig, getMessageBubbleConfig,
  getNavigationConfig, getHeaderConfig, getFooterConfig,
  getAppLayoutConfig, getAuthLayoutConfig, getBackendLayoutConfig,
  
  // Design tokens
  AgriAIColors, DESIGN_CONSTANTS
} from '@/config/design-system';

// Quick component setup
<Button {...getButtonConfig('agricultural')} />
<Header {...getHeaderConfig('app')} />
<AppLayout {...getAppLayoutConfig('dashboard')} />
```

### Theme Integration
```tsx
import { useTheme } from '@/contexts/ThemeContext';

function ThemedComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  return (
    <div className={`theme-${resolvedTheme}`}>
      <Button variant="agricultural">
        Themed Button
      </Button>
    </div>
  );
}
```

### Design Tokens Usage
```tsx
import { AgriAIColors, DESIGN_CONSTANTS } from '@/config/design-system';

// Colors
const primaryColor = AgriAIColors.brand.primary[500];
const agriculturalBg = AgriAIColors.semantic.growth;

// Constants
const maxSuggestions = DESIGN_CONSTANTS.MOLECULAR.searchInput.maxSuggestions;
const sidebarWidth = DESIGN_CONSTANTS.TEMPLATE.appLayout.sidebarWidth;
```

---

## ♿ Accessibility Guidelines

### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 ratio
- **Keyboard Navigation**: Full support per tutti i componenti
- **Screen Readers**: ARIA labels e live regions
- **Focus Management**: Visible focus indicators

### Implementation Examples
```tsx
// Accessible button
<Button 
  variant="agricultural"
  aria-label="Pianta mais nel campo nord"
  disabled={isPlanting}
  aria-describedby="planting-help"
>
  Pianta Mais
</Button>

// Accessible input
<Input
  aria-label="Email utente"
  aria-invalid={hasError}
  aria-describedby="email-error"
  required
/>

// Accessible navigation
<Navigation
  role="navigation"
  aria-label="Menu principale AgriAI"
/>
```

---

## 📱 Responsive Design

### Breakpoint System
```css
/* Design system breakpoints */
xs: 475px    /* Mobile small */
sm: 640px    /* Mobile */
md: 768px    /* Tablet */
lg: 1024px   /* Desktop */
xl: 1280px   /* Large desktop */
2xl: 1536px  /* Extra large */
```

### Mobile-First Approach
```tsx
// Responsive components
<SearchInput 
  size="sm"              // Mobile
  className="md:size-default" // Desktop
/>

<DocumentGrid 
  columns={1}            // Mobile: 1 column
  className="md:grid-cols-2 lg:grid-cols-3" // Responsive
/>

<AppLayout
  variant="compact"      // Mobile layout
  mobileLayout="drawer"  // Drawer navigation
/>
```

---

## 🎨 Theme System

### Theme Support
- **Light Theme**: Default bright theme
- **Dark Theme**: Dark mode support
- **System Theme**: Auto-detection
- **Agricultural Themes**: Sector-specific colors

### Usage Examples
```tsx
import { useTheme, ThemeToggle } from '@/config/design-system';

function ThemeAwareComponent() {
  const { theme, resolvedTheme } = useTheme();
  
  return (
    <div>
      <ThemeToggle />
      <Card variant={resolvedTheme === 'dark' ? 'earth' : 'agricultural'}>
        Theme-aware content
      </Card>
    </div>
  );
}
```

---

## 🚀 Performance Guidelines

### Optimization Tips
- **Tree Shaking**: Import solo componenti necessari
- **Lazy Loading**: Componenti pesanti on-demand
- **Memoization**: Callbacks per prevenire re-render
- **Bundle Splitting**: Separazione vendor/app code

### Implementation
```tsx
// Tree shaking friendly imports
import { Button } from '@/config/design-system';

// Lazy loading
const DocumentCard = lazy(() => import('@/components/molecules/DocumentCard'));

// Memoized callbacks
const handleSearch = useCallback((query) => {
  // Search logic
}, [dependencies]);
```

---

## 📊 Testing Strategy

### Component Testing
- **Unit Tests**: Ogni componente isolato
- **Integration Tests**: Combinazioni componenti
- **Visual Regression**: Screenshot testing
- **Accessibility Tests**: Automated a11y checks

### Example Tests
```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/config/design-system';

test('renders agricultural button correctly', () => {
  render(<Button variant="agricultural">Test</Button>);
  
  const button = screen.getByRole('button');
  expect(button).toHaveClass('bg-agricultural');
  expect(button).toBeAccessible();
});
```

---

## 📈 Analytics Integration

### Event Tracking
```tsx
// Component with analytics
<Button
  variant="agricultural"
  onClick={() => {
    analytics.track('Button Click', {
      variant: 'agricultural',
      context: 'dashboard'
    });
    handleClick();
  }}
>
  Track Me
</Button>

// Header with search tracking  
<Header
  onSearch={(query) => {
    analytics.track('Search', { query, source: 'header' });
    handleSearch(query);
  }}
/>
```

---

## 🔄 Migration Guide

### From Existing Components
```tsx
// Before (old component)
<OldButton color="green" size="large">
  Click me
</OldButton>

// After (design system)
<Button variant="agricultural" size="lg">
  Click me  
</Button>
```

### Gradual Adoption
1. **Start with Atomic**: Replace buttons, inputs first
2. **Add Molecular**: Implement search, cards
3. **Integrate Organisms**: Navigation, header, footer
4. **Complete Templates**: Full layout migration

---

## 🛠️ Development Tools

### Storybook Integration
```bash
# Install dependencies
npm install @storybook/react @storybook/addon-docs

# Run Storybook
npm run storybook
```

### VS Code Extensions
- **Tailwind CSS IntelliSense**: Class completion
- **TypeScript Hero**: Auto imports
- **ES7+ React/Redux Snippets**: Code snippets

---

## 🏆 Best Practices

### Component Design
1. **Composition over Inheritance**: Build complex from simple
2. **Single Responsibility**: One purpose per component
3. **Prop Interface**: Clear and intuitive APIs
4. **Default Values**: Sensible defaults for all props

### Code Organization
```tsx
// File structure
src/
  components/
    ui/           # Atomic components
    molecules/    # Molecular components  
    organisms/    # Organism components
    templates/    # Template components
  config/
    design-system.ts  # Central exports
```

### Naming Conventions
- **Components**: PascalCase (`SearchInput`)
- **Props**: camelCase (`showSuggestions`)
- **Files**: kebab-case (`search-input.tsx`)
- **CSS Classes**: Tailwind utility classes

---

Questa documentazione rappresenta la **guida completa** per l'utilizzo del design system AgriAI. Ogni componente è progettato per essere **riutilizzabile**, **accessibile** e **tematicamente coerente** con il settore agricolo.

Per ulteriori dettagli su componenti specifici, consulta i file sorgente individuali o la documentazione Storybook interattiva.

**Happy coding! 🌾**