/**
 * AgriAI Design System - Export Centralizzato
 * Versione moderna con componenti aggiornati e layout system
 */

// === DESIGN TOKENS ===
export { 
  AgriAIColors, 
  AgriAISpacing, 
  AgriAITypography, 
  AgriAIShadows, 
  AgriAIBorderRadius, 
  AgriAIAnimations, 
  AgriAITransitionTiming,
  AgriAIBreakpoints,
  AgriAIZIndex,
  getColorValue,
  getSpacingValue,
  getTypographyValue,
  getShadowValue,
  getBorderRadiusValue,
  getAnimationValue
} from './design-tokens';

// === THEME SYSTEM ===
export { 
  ThemeProvider, 
  useTheme, 
  getThemeValue, 
  withThemeTransition 
} from '@/contexts/ThemeContext';

export { 
  ThemeToggle, 
  SimpleThemeToggle, 
  ThemeStatus, 
  ThemePreview 
} from '@/components/ui/theme-toggle';

// === ATOMIC COMPONENTS ===
export { 
  Button, 
  ButtonGroup, 
  IconButton, 
  FloatingActionButton,
  buttonVariants 
} from '@/components/ui/button';

export { 
  Input, 
  PasswordInput, 
  SearchInput, 
  Textarea, 
  inputVariants 
} from '@/components/ui/input';

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  AgricultureMetricCard,
  FieldStatusCard,
  cardVariants 
} from '@/components/ui/card';

export { 
  Badge, 
  StatusBadge, 
  NotificationBadge, 
  AgriculturalBadge, 
  BadgeGroup, 
  badgeVariants 
} from '@/components/ui/badge';

export { 
  Avatar, 
  AvatarImage, 
  AvatarFallback, 
  AvatarGroup, 
  AgriculturalAvatar, 
  avatarVariants 
} from '@/components/ui/avatar';

export { 
  Spinner, 
  SpinnerWithText, 
  LoadingOverlay, 
  spinnerVariants 
} from '@/components/ui/spinner';

// === MOLECULAR COMPONENTS ===
export { 
  SearchInput as MolecularSearchInput, 
  SearchInputGroup 
} from '@/components/molecules/SearchInput';
export type { SearchSuggestion } from '@/components/molecules/SearchInput';

export { 
  MessageBubble, 
  MessageGroup 
} from '@/components/molecules/MessageBubble';
export type { 
  ChatMessage, 
  MessageUser, 
  MessageSource, 
  MessageStatus, 
  MessageSender, 
  FeedbackType 
} from '@/components/molecules/MessageBubble';

export { 
  DocumentCard, 
  DocumentGrid 
} from '@/components/molecules/DocumentCard';
export type { 
  DocumentItem, 
  DocumentMetadata, 
  DocumentAIAnalysis, 
  DocumentProgress, 
  DocumentType, 
  DocumentStatus 
} from '@/components/molecules/DocumentCard';

// === ORGANISM COMPONENTS ===
export { 
  Navigation 
} from '@/components/organisms/Navigation';
export type { 
  NavigationItem, 
  BreadcrumbItem 
} from '@/components/organisms/Navigation';

export { 
  Header, 
  CompactHeader, 
  FloatingHeader 
} from '@/components/organisms/Header';
export type { Notification } from '@/components/organisms/Header';

export { 
  Footer, 
  MinimalFooter, 
  ExtendedFooter 
} from '@/components/organisms/Footer';
export type { 
  FooterSection, 
  FooterLink, 
  SocialLink 
} from '@/components/organisms/Footer';

// === MODERN LAYOUT COMPONENTS ===
export { 
  ModernHeader 
} from '@/components/layout/ModernHeader';

export { 
  ModernSidebar 
} from '@/components/layout/ModernSidebar';

export { 
  ModernLayout,
  DashboardLayout,
  ChatLayout,
  FullscreenLayout,
  HeaderOnlyLayout,
  SidebarOnlyLayout,
  MinimalLayout
} from '@/components/layout/ModernLayout';

// === TEMPLATE COMPONENTS ===
export { 
  AppLayout, 
  SidebarLayout, 
  FullscreenLayout as TemplateFullscreenLayout, 
  CompactLayout 
} from '@/components/templates/AppLayout';

export { 
  AuthLayout, 
  LoginLayout, 
  RegisterLayout, 
  ForgotPasswordLayout, 
  ResetPasswordLayout 
} from '@/components/templates/AuthLayout';

export { 
  BackendLayout 
} from '@/components/templates/BackendLayout';

// === ANIMATION SYSTEM ===
export {
  AnimatedContainer,
  AnimatedCard,
  AnimatedButton,
  PageTransition,
  LoadingSpinner,
  LoadingDots,
  RippleEffect,
  ParallaxContainer,
  useScrollAnimation,
  useHoverAnimation,
  fadeInVariants,
  slideInVariants,
  scaleInVariants,
  staggerContainerVariants,
  cardHoverVariants,
  buttonPressVariants,
  pageTransitionVariants
} from '@/components/animations/ModernAnimations';

// === DESIGN SYSTEM UTILITIES ===
export const getSearchInputConfig = (category: 'documents' | 'users' | 'general' = 'general') => {
  const configs = {
    documents: {
      placeholder: 'Cerca documenti agricoli...',
      categories: ['PAC', 'Normative', 'Guide', 'Schede tecniche'],
      suggestions: ['PAC 2024', 'Regolamento UE', 'Guida irrigazione']
    },
    users: {
      placeholder: 'Cerca utenti...',
      categories: ['Agricoltori', 'Consulenti', 'Amministratori'],
      suggestions: ['Mario Rossi', 'Giovanni Bianchi', 'Maria Verdi']
    },
    general: {
      placeholder: 'Cerca in AgriAI...',
      categories: ['Documenti', 'Utenti', 'Normative', 'Guide'],
      suggestions: ['PAC', 'Irrigazione', 'Fertilizzanti', 'Meteo']
    }
  };
  return configs[category];
};

export const getMessageBubbleConfig = (messageType: 'ai' | 'user' | 'system' = 'ai') => {
  const configs = {
    ai: {
      avatar: '🤖',
      backgroundColor: 'bg-muted',
      textColor: 'text-foreground',
      borderColor: 'border-border'
    },
    user: {
      avatar: '👤',
      backgroundColor: 'bg-primary',
      textColor: 'text-primary-foreground',
      borderColor: 'border-primary'
    },
    system: {
      avatar: '⚙️',
      backgroundColor: 'bg-secondary',
      textColor: 'text-secondary-foreground',
      borderColor: 'border-secondary'
    }
  };
  return configs[messageType];
};

export const getDocumentCardConfig = (context: 'library' | 'search' | 'upload' = 'library') => {
  const configs = {
    library: {
      showProgress: false,
      showActions: true,
      showMetadata: true,
      layout: 'grid'
    },
    search: {
      showProgress: false,
      showActions: false,
      showMetadata: true,
      layout: 'list'
    },
    upload: {
      showProgress: true,
      showActions: false,
      showMetadata: false,
      layout: 'compact'
    }
  };
  return configs[context];
};

export const getNavigationConfig = (context: 'main' | 'sidebar' | 'mobile' = 'main') => {
  const configs = {
    main: {
      orientation: 'horizontal',
      showIcons: true,
      showLabels: true,
      responsive: true
    },
    sidebar: {
      orientation: 'vertical',
      showIcons: true,
      showLabels: true,
      collapsible: true
    },
    mobile: {
      orientation: 'vertical',
      showIcons: true,
      showLabels: true,
      overlay: true
    }
  };
  return configs[context];
};

export const getHeaderConfig = (context: 'app' | 'landing' | 'dashboard' = 'app') => {
  const configs = {
    app: {
      variant: 'default',
      showSearch: true,
      showNotifications: true,
      showUserMenu: true,
      sticky: true
    },
    landing: {
      variant: 'transparent',
      showSearch: false,
      showNotifications: false,
      showUserMenu: true,
      sticky: false
    },
    dashboard: {
      variant: 'glass',
      showSearch: true,
      showNotifications: true,
      showUserMenu: true,
      sticky: true
    }
  };
  return configs[context];
};

export const getFooterConfig = (context: 'app' | 'landing' | 'embedded' = 'app') => {
  const configs = {
    app: {
      variant: 'default',
      showNewsletter: true,
      showSocialLinks: true,
      showLegalLinks: true
    },
    landing: {
      variant: 'extended',
      showNewsletter: true,
      showSocialLinks: true,
      showLegalLinks: true
    },
    embedded: {
      variant: 'minimal',
      showNewsletter: false,
      showSocialLinks: false,
      showLegalLinks: true
    }
  };
  return configs[context];
};

export const getAppLayoutConfig = (context: 'standard' | 'dashboard' | 'chat' | 'fullscreen' = 'standard') => {
  const configs = {
    standard: {
      header: 'default',
      sidebar: 'default',
      content: 'p-6',
      responsive: true
    },
    dashboard: {
      header: 'glass',
      sidebar: 'default',
      content: 'p-4',
      responsive: true
    },
    chat: {
      header: 'transparent',
      sidebar: 'compact',
      content: 'p-0',
      responsive: true
    },
    fullscreen: {
      header: 'transparent',
      sidebar: 'floating',
      content: 'p-0',
      responsive: false
    }
  };
  return configs[context];
};

export const getAuthLayoutConfig = (context: 'login' | 'register' | 'landing' = 'login') => {
  const configs = {
    login: {
      variant: 'default',
      showLogo: true,
      showBackground: true,
      showThemeToggle: true
    },
    register: {
      variant: 'default',
      showLogo: true,
      showBackground: true,
      showThemeToggle: true
    },
    landing: {
      variant: 'minimal',
      showLogo: false,
      showBackground: false,
      showThemeToggle: false
    }
  };
  return configs[context];
};

export const getBackendLayoutConfig = (context: 'admin' | 'member' | 'analytics' = 'member') => {
  const configs = {
    admin: {
      sidebar: 'default',
      header: 'glass',
      content: 'p-4',
      showQuickActions: true
    },
    member: {
      sidebar: 'default',
      header: 'default',
      content: 'p-6',
      showQuickActions: false
    },
    analytics: {
      sidebar: 'compact',
      header: 'transparent',
      content: 'p-2',
      showQuickActions: true
    }
  };
  return configs[context];
};

// === COLOR UTILITIES ===
export const getColorClass = (color: string, variant?: string) => {
  const colorMap: Record<string, string> = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    info: 'text-info',
    growth: 'text-growth',
    harvest: 'text-harvest',
    soil: 'text-soil',
    weather: 'text-weather',
    muted: 'text-muted-foreground',
    foreground: 'text-foreground',
    background: 'text-background'
  };
  
  return colorMap[color] || 'text-foreground';
};

export const getBackgroundClass = (color: string, variant?: string) => {
  const bgMap: Record<string, string> = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
    growth: 'bg-growth',
    harvest: 'bg-harvest',
    soil: 'bg-soil',
    weather: 'bg-weather',
    muted: 'bg-muted',
    foreground: 'bg-foreground',
    background: 'bg-background'
  };
  
  return bgMap[color] || 'bg-background';
};

export const getBorderClass = (color: string, variant?: string) => {
  const borderMap: Record<string, string> = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    success: 'border-success',
    warning: 'border-warning',
    error: 'border-error',
    info: 'border-info',
    growth: 'border-growth',
    harvest: 'border-harvest',
    soil: 'border-soil',
    weather: 'border-weather',
    muted: 'border-border',
    foreground: 'border-foreground',
    background: 'border-background'
  };
  
  return borderMap[color] || 'border-border';
};

// === SPACING UTILITIES ===
export const getSpacingClass = (size: string) => {
  const spacingMap: Record<string, string> = {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
    '2xl': 'p-12',
    '3xl': 'p-16'
  };
  
  return spacingMap[size] || 'p-4';
};

export const getMarginClass = (size: string) => {
  const marginMap: Record<string, string> = {
    xs: 'm-1',
    sm: 'm-2',
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
    '2xl': 'm-12',
    '3xl': 'm-16'
  };
  
  return marginMap[size] || 'm-4';
};

// === TYPOGRAPHY UTILITIES ===
export const getFontSizeClass = (size: string) => {
  const fontSizeMap: Record<string, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl'
  };
  
  return fontSizeMap[size] || 'text-base';
};

export const getFontWeightClass = (weight: string) => {
  const fontWeightMap: Record<string, string> = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };
  
  return fontWeightMap[weight] || 'font-normal';
};

// === SHADOW UTILITIES ===
export const getShadowClass = (shadow: string) => {
  const shadowMap: Record<string, string> = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
    agricultural: 'shadow-agricultural',
    earth: 'shadow-earth',
    harvest: 'shadow-harvest',
    weather: 'shadow-weather'
  };
  
  return shadowMap[shadow] || 'shadow-md';
};

// === BORDER RADIUS UTILITIES ===
export const getBorderRadiusClass = (radius: string) => {
  const radiusMap: Record<string, string> = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  };
  
  return radiusMap[radius] || 'rounded-md';
};

// === CONSTANTS ===
export const DESIGN_CONSTANTS = {
  MAX_CONTENT_WIDTH: '1280px',
  SIDEBAR_WIDTH: '256px',
  SIDEBAR_COLLAPSED_WIDTH: '64px',
  HEADER_HEIGHT: '64px',
  MOBILE_BREAKPOINT: '768px',
  TABLET_BREAKPOINT: '1024px',
  DESKTOP_BREAKPOINT: '1280px',
  ANIMATION_DURATION: {
    FAST: '150ms',
    NORMAL: '250ms',
    SLOW: '350ms'
  },
  Z_INDEX: {
    HEADER: 100,
    SIDEBAR: 200,
    MODAL: 300,
    TOOLTIP: 400,
    TOAST: 500
  }
} as const;

// === DESIGN SYSTEM METADATA ===
export const DESIGN_SYSTEM_VERSION = '2.0.0';
export const DESIGN_SYSTEM_BUILD_DATE = new Date().toISOString();
export const DESIGN_SYSTEM_COMPONENTS_COUNT = {
  atomic: 6,
  molecular: 3,
  organism: 3,
  template: 3,
  layout: 3,
  animation: 8,
  total: 26
};

export const AGRIAI_DESIGN_SYSTEM = {
  name: 'AgriAI Design System',
  version: DESIGN_SYSTEM_VERSION,
  description: 'Sistema di design moderno per la piattaforma AgriAI',
  author: 'AgriAI Team',
  license: 'MIT',
  repository: 'https://github.com/agriai/design-system',
  documentation: 'https://design.agriai.com',
  components: DESIGN_SYSTEM_COMPONENTS_COUNT,
  features: [
    'Design tokens centralizzati',
    'Sistema di temi dark/light',
    'Componenti atomici moderni',
    'Layout system responsive',
    'Sistema di animazioni',
    'Microinterazioni',
    'Accessibilità WCAG 2.1',
    'Performance ottimizzate'
  ],
  technologies: [
    'React 18',
    'TypeScript 5.5',
    'Tailwind CSS',
    'Framer Motion',
    'Radix UI',
    'shadcn/ui'
  ]
} as const;