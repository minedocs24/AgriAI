# Design System AgriAI - Guida e Convenzioni

## 📋 Panoramica

Il Design System di AgriAI è basato su **shadcn/ui** e **Tailwind CSS** con estensioni specifiche per il dominio agricolo. Utilizza un approccio **component-driven** con **design tokens** completi per garantire coerenza visiva e scalabilità.

## 🎨 Sistema Colori

### Colori del Brand Agricolo

```typescript
// Verde Agricoltura (Primary)
bg-brand-primary-50   // Verde molto chiaro
bg-brand-primary-500  // Verde agricoltura principale
bg-brand-primary-900  // Verde molto scuro

// Terra (Secondary) 
bg-brand-earth-50     // Terra molto chiara
bg-brand-earth-500    // Terra principale
bg-brand-earth-900    // Terra molto scura

// Grano (Accent)
bg-brand-grain-50     // Grano molto chiaro
bg-brand-grain-500    // Grano principale
bg-brand-grain-900    // Grano molto scuro

// Cielo (Info)
bg-brand-sky-400      // Cielo sereno
bg-brand-sky-500      // Cielo principale
```

### Colori Semantici Agricoli

```typescript
// Colori specifici del dominio agricolo
text-growth    // Verde crescita piante
text-harvest   // Giallo tempo di raccolto
text-soil      // Marrone qualità del suolo
text-weather   // Azzurro condizioni meteo

// Background
bg-growth      // Sfondo crescita
bg-harvest     // Sfondo raccolto
bg-soil        // Sfondo suolo
bg-weather     // Sfondo meteo

// Bordi
border-growth  // Bordo crescita
border-harvest // Bordo raccolto
border-soil    // Bordo suolo
border-weather // Bordo meteo
```

### Colori Standard del Tema

```typescript
// Colori base del tema (supportano dark/light mode automaticamente)
bg-background        // Sfondo principale
bg-card             // Sfondo carte
bg-primary          // Colore primario (verde agricoltura)
bg-secondary        // Colore secondario (terra)
bg-accent           // Colore accent (grano)
bg-muted            // Colore attenuato

text-foreground     // Testo principale
text-primary        // Testo primario
text-secondary      // Testo secondario
text-muted-foreground // Testo attenuato
```

## 🔤 Tipografia

### Classi Font Size

```typescript
text-xs     // 12px - Caption, note
text-sm     // 14px - Secondary text
text-base   // 16px - Body text (default)
text-lg     // 18px - Large body text
text-xl     // 20px - Small headings
text-2xl    // 24px - Medium headings
text-3xl    // 30px - Large headings
text-4xl    // 36px - Page titles
text-5xl    // 48px - Hero titles
```

### Font Weight

```typescript
font-light      // 300
font-normal     // 400
font-medium     // 500
font-semibold   // 600 (default per headings)
font-bold       // 700
```

### Famiglie Font

```typescript
font-sans   // Inter (default)
font-serif  // Georgia 
font-mono   // SF Mono
```

## 📏 Spacing e Layout

### Spacing Scale

```typescript
p-1     // 4px
p-2     // 8px
p-4     // 16px (base)
p-6     // 24px
p-8     // 32px
p-12    // 48px
p-16    // 64px
p-24    // 96px
```

### Container Responsivi

```typescript
.container-responsive  // Container con padding adattivo
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

## 🎭 Componenti Agricoli Personalizzati

### Card Agricole

```typescript
// Card con shadow agricola
.card-agricultural
// Card con shadow terra
.card-earth
```

### Status Indicators

```typescript
// Per dati agricoli specifici
.status-optimal    // Stato ottimale (verde)
.status-warning    // Attenzione (giallo)
.status-attention  // Richiede attenzione (marrone)
.status-info       // Informativo (azzurro)
```

### Shadows Personalizzate

```typescript
shadow-agricultural  // Shadow verde agricoltura
shadow-earth        // Shadow terra
```

## 🌗 Sistema Temi

### Utilizzo Theme Context

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme, toggleTheme } = useTheme();
  
  return (
    <div className="theme-transition">
      <p>Tema attuale: {theme}</p>
      <button onClick={toggleTheme}>
        Cambia tema
      </button>
    </div>
  );
}
```

### Componenti Theme Toggle

```tsx
import { ThemeToggle, SimpleThemeToggle } from '@/components/ui/theme-toggle';

// Toggle completo con dropdown
<ThemeToggle />

// Toggle semplice
<SimpleThemeToggle />

// Con personalizzazioni
<ThemeToggle 
  variant="outline" 
  size="sm" 
  showLabel={true} 
/>
```

## 🎬 Animazioni

### Classi Animate

```typescript
animate-fade-in        // Fade in smooth
animate-slide-up       // Slide da sotto
animate-slide-down     // Slide da sopra
animate-scale-in       // Scale in
animate-agricultural   // Timing function naturale
```

### Transizioni

```typescript
.theme-transition      // Transizione smooth per cambio tema
transition-agricultural // Timing function agricolo
```

## 📱 Breakpoints

```typescript
xs: '475px'    // Extra small
sm: '640px'    // Small  
md: '768px'    // Medium
lg: '1024px'   // Large
xl: '1280px'   // Extra large
2xl: '1536px'  // 2X large
```

## 🔧 Convenzioni di Utilizzo

### 1. Naming Convention

- **Colori brand**: `brand-[categoria]-[peso]` (es. `brand-primary-500`)
- **Colori semantici**: `[significato]` (es. `growth`, `harvest`)
- **Componenti**: `card-[tipo]` (es. `card-agricultural`)
- **Status**: `status-[tipo]` (es. `status-optimal`)

### 2. Priorità Colori

1. **Colori tema base** (`primary`, `secondary`, `accent`) per interfaccia generale
2. **Colori semantici agricoli** (`growth`, `harvest`, etc.) per dati specifici
3. **Colori brand** per branding e marketing

### 3. Accessibilità

- Tutti i colori mantengono contrasto WCAG 2.1 AA
- Focus ring sempre visibile: `focus-visible:ring-2 focus-visible:ring-ring`
- Screen reader support: utilizzare `sr-only` per testo nascosto

### 4. Responsiveness

- Mobile-first approach
- Utilizzare breakpoints in ordine crescente
- Container responsive per layout consistenti

### 5. Performance

- Classi CSS-in-JS evitate in favore di Tailwind
- Transizioni smooth senza impattare performance
- Dark mode senza flash (FOUC prevention)

## 🚀 Esempi Pratici

### Card Dati Agricoli

```tsx
<div className="card-agricultural p-6">
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-growth/10 rounded-lg">
      <Leaf className="h-5 w-5 text-growth" />
    </div>
    <h3 className="text-lg font-semibold">Crescita Colture</h3>
  </div>
  
  <div className="grid grid-cols-2 gap-4">
    <div className="status-optimal p-3 rounded">
      <p className="text-sm">Stato Ottimale</p>
      <p className="text-2xl font-bold">95%</p>
    </div>
    <div className="status-warning p-3 rounded">
      <p className="text-sm">Attenzione</p>
      <p className="text-2xl font-bold">12%</p>
    </div>
  </div>
</div>
```

### Layout Responsive

```tsx
<div className="container-responsive">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {cards.map(card => (
      <div key={card.id} className="card-earth animate-fade-in">
        {/* Contenuto card */}
      </div>
    ))}
  </div>
</div>
```

### Form con Temi

```tsx
<form className="space-y-6 theme-transition">
  <div className="space-y-2">
    <Label htmlFor="field">Campo Agricolo</Label>
    <Input 
      id="field"
      className="border-soil focus:ring-growth"
      placeholder="Nome del campo..."
    />
  </div>
  
  <Button className="bg-primary hover:bg-primary/90">
    Salva Dati
  </Button>
</form>
```

## 📝 Note Implementative

### CSS Custom Properties

Tutte le variabili sono definite in `:root` per light mode e `.dark` per dark mode. I colori utilizzano formato HSL per compatibilità ottimale.

### Design Tokens

I design tokens sono centralizzati in `src/config/design-tokens.ts` e possono essere importati per utilizzo programmatico:

```tsx
import { designTokens } from '@/config/design-tokens';

const primaryColor = designTokens.colors.brand.primary[500];
```

### Estensibilità

Il sistema è progettato per essere facilmente estendibile. Per aggiungere nuovi colori o componenti:

1. Aggiornare `design-tokens.ts`
2. Estendere `tailwind.config.ts`
3. Aggiungere CSS personalizzato in `index.css`
4. Documentare in questo file

---

**Questo design system è specificamente progettato per AgriAI e il dominio agricolo, mantenendo accessibilità, performance e coerenza visiva come priorità principali.**