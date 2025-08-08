/**
 * Design Tokens per AgriAI - Versione Moderna
 * Sistema centralizzato di design tokens per programmatic access
 */

// === MODERN COLOR SYSTEM ===
export const AgriAIColors = {
  // Core Theme Colors
  primary: {
    50: 'hsl(110, 52%, 96%)',
    100: 'hsl(110, 48%, 90%)',
    200: 'hsl(115, 42%, 80%)',
    300: 'hsl(118, 40%, 68%)',
    400: 'hsl(120, 45%, 55%)',
    500: 'hsl(122, 47%, 45%)', // Primary
    600: 'hsl(125, 50%, 38%)',
    700: 'hsl(128, 55%, 32%)',
    800: 'hsl(130, 62%, 26%)',
    900: 'hsl(132, 70%, 20%)',
    950: 'hsl(135, 80%, 12%)',
  },
  earth: {
    50: 'hsl(35, 28%, 96%)',
    100: 'hsl(35, 32%, 90%)',
    200: 'hsl(32, 30%, 80%)',
    300: 'hsl(30, 28%, 68%)',
    400: 'hsl(28, 32%, 55%)',
    500: 'hsl(25, 38%, 45%)', // Secondary
    600: 'hsl(22, 42%, 38%)',
    700: 'hsl(20, 48%, 32%)',
    800: 'hsl(18, 55%, 26%)',
    900: 'hsl(15, 62%, 20%)',
  },
  grain: {
    50: 'hsl(48, 32%, 96%)',
    100: 'hsl(48, 36%, 90%)',
    200: 'hsl(46, 34%, 80%)',
    300: 'hsl(44, 30%, 70%)',
    400: 'hsl(42, 36%, 60%)',
    500: 'hsl(40, 42%, 52%)', // Accent
    600: 'hsl(38, 48%, 44%)',
    700: 'hsl(36, 54%, 36%)',
    800: 'hsl(34, 60%, 28%)',
    900: 'hsl(32, 68%, 22%)',
  },
  sky: {
    50: 'hsl(200, 42%, 96%)',
    100: 'hsl(200, 46%, 90%)',
    400: 'hsl(200, 56%, 60%)',
    500: 'hsl(200, 62%, 50%)', // Info
    600: 'hsl(200, 68%, 42%)',
  },
  
  // Semantic Colors
  success: 'hsl(122, 47%, 45%)',
  warning: 'hsl(40, 42%, 52%)',
  error: 'hsl(0, 65%, 55%)',
  info: 'hsl(200, 62%, 50%)',
  
  // Agricultural Semantic Colors
  growth: 'hsl(120, 45%, 55%)',
  harvest: 'hsl(40, 42%, 52%)',
  soil: 'hsl(25, 38%, 45%)',
  weather: 'hsl(200, 56%, 60%)',
  
  // Neutral Colors
  background: 'hsl(0, 0%, 100%)',
  foreground: 'hsl(240, 10%, 3.9%)',
  card: 'hsl(0, 0%, 100%)',
  cardForeground: 'hsl(240, 10%, 3.9%)',
  popover: 'hsl(0, 0%, 100%)',
  popoverForeground: 'hsl(240, 10%, 3.9%)',
  muted: 'hsl(240, 4.8%, 95.9%)',
  mutedForeground: 'hsl(240, 3.8%, 46.1%)',
  border: 'hsl(240, 5.9%, 90%)',
  input: 'hsl(240, 5.9%, 90%)',
  ring: 'hsl(122, 47%, 45%)',
} as const;

// === THEME VARIANTS FOR THEME CONTEXT ===
export type ThemeVariant = 'light' | 'dark';

export const themeVariants = {
  light: {
    colors: {
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(240, 10%, 3.9%)',
      card: 'hsl(0, 0%, 100%)',
      cardForeground: 'hsl(240, 10%, 3.9%)',
      popover: 'hsl(0, 0%, 100%)',
      popoverForeground: 'hsl(240, 10%, 3.9%)',
      primary: 'hsl(122, 47%, 45%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(25, 38%, 45%)',
      secondaryForeground: 'hsl(0, 0%, 100%)',
      muted: 'hsl(240, 4.8%, 95.9%)',
      mutedForeground: 'hsl(240, 3.8%, 46.1%)',
      accent: 'hsl(40, 42%, 52%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      border: 'hsl(240, 5.9%, 90%)',
      input: 'hsl(240, 5.9%, 90%)',
      ring: 'hsl(122, 47%, 45%)',
      success: 'hsl(122, 47%, 45%)',
      warning: 'hsl(40, 42%, 52%)',
      error: 'hsl(0, 65%, 55%)',
      info: 'hsl(200, 62%, 50%)',
    }
  },
  dark: {
    colors: {
      background: 'hsl(240, 10%, 3.9%)',
      foreground: 'hsl(0, 0%, 98%)',
      card: 'hsl(240, 10%, 3.9%)',
      cardForeground: 'hsl(0, 0%, 98%)',
      popover: 'hsl(240, 10%, 3.9%)',
      popoverForeground: 'hsl(0, 0%, 98%)',
      primary: 'hsl(122, 47%, 45%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(25, 38%, 45%)',
      secondaryForeground: 'hsl(0, 0%, 100%)',
      muted: 'hsl(240, 3.7%, 15.9%)',
      mutedForeground: 'hsl(240, 5%, 64.9%)',
      accent: 'hsl(40, 42%, 52%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      border: 'hsl(240, 3.7%, 15.9%)',
      input: 'hsl(240, 3.7%, 15.9%)',
      ring: 'hsl(122, 47%, 45%)',
      success: 'hsl(122, 47%, 45%)',
      warning: 'hsl(40, 42%, 52%)',
      error: 'hsl(0, 65%, 55%)',
      info: 'hsl(200, 62%, 50%)',
    }
  }
} as const;

// === MODERN SPACING SYSTEM ===
export const AgriAISpacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
  '5xl': '8rem',    // 128px
} as const;

// === MODERN TYPOGRAPHY SYSTEM ===
export const AgriAITypography = {
  fontSizes: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },
  lineHeights: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// === MODERN SHADOW SYSTEM ===
export const AgriAIShadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  
  // Agricultural Shadows
  agricultural: '0 8px 25px -5px rgb(122 47% 45% / 0.15), 0 4px 10px -2px rgb(122 47% 45% / 0.1)',
  earth: '0 8px 25px -5px rgb(25 38% 45% / 0.15), 0 4px 10px -2px rgb(25 38% 45% / 0.1)',
  harvest: '0 8px 25px -5px rgb(40 42% 52% / 0.15), 0 4px 10px -2px rgb(40 42% 52% / 0.1)',
  weather: '0 8px 25px -5px rgb(200 56% 60% / 0.15), 0 4px 10px -2px rgb(200 56% 60% / 0.1)',
} as const;

// === MODERN BORDER RADIUS SYSTEM ===
export const AgriAIBorderRadius = {
  none: '0',
  sm: '0.5rem',     // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.5rem',     // 24px
  '2xl': '2rem',    // 32px
  full: '9999px',
} as const;

// === MODERN ANIMATION SYSTEM ===
export const AgriAIAnimations = {
  durations: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  timingFunctions: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    agricultural: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  keyframes: {
    fadeIn: {
      from: { opacity: '0', transform: 'translateY(10px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    slideUp: {
      from: { opacity: '0', transform: 'translateY(20px)' },
      to: { opacity: '1', transform: 'translateY(0)' },
    },
    scaleIn: {
      from: { opacity: '0', transform: 'scale(0.9)' },
      to: { opacity: '1', transform: 'scale(1)' },
    },
    agriculturalPulse: {
      '0%, 100%': { transform: 'scale(1)', opacity: '1' },
      '50%': { transform: 'scale(1.05)', opacity: '0.8' },
    },
    buttonPress: {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(0.98)' },
      '100%': { transform: 'scale(1)' },
    },
    cardHover: {
      '0%': { transform: 'translateY(0)', boxShadow: 'var(--shadow-md)' },
      '100%': { transform: 'translateY(-2px)', boxShadow: 'var(--shadow-lg)' },
    },
  },
} as const;

// === MODERN TRANSITION TIMING ===
export const AgriAITransitionTiming = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: '300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  agricultural: '250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
} as const;

// === MODERN BREAKPOINTS ===
export const AgriAIBreakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// === MODERN Z-INDEX SYSTEM ===
export const AgriAIZIndex = {
  header: '100',
  sidebar: '200',
  dropdown: '300',
  popover: '400',
  modal: '500',
  tooltip: '600',
  toast: '700',
} as const;

// === UTILITY FUNCTIONS ===
export const getColorValue = (color: string, variant?: string): string => {
  if (variant && AgriAIColors[color as keyof typeof AgriAIColors]?.[variant as keyof typeof AgriAIColors[typeof color]]) {
    return AgriAIColors[color as keyof typeof AgriAIColors][variant as keyof typeof AgriAIColors[typeof color]] as string;
  }
  return AgriAIColors[color as keyof typeof AgriAIColors] as string;
};

export const getSpacingValue = (size: keyof typeof AgriAISpacing): string => {
  return AgriAISpacing[size];
};

export const getTypographyValue = (type: keyof typeof AgriAITypography, variant: string): string => {
  return AgriAITypography[type][variant as keyof typeof AgriAITypography[typeof type]] as string;
};

export const getShadowValue = (shadow: keyof typeof AgriAIShadows): string => {
  return AgriAIShadows[shadow];
};

export const getBorderRadiusValue = (radius: keyof typeof AgriAIBorderRadius): string => {
  return AgriAIBorderRadius[radius];
};

export const getAnimationValue = (type: keyof typeof AgriAIAnimations, variant: string): string => {
  return AgriAIAnimations[type][variant as keyof typeof AgriAIAnimations[typeof type]] as string;
};

// === DESIGN TOKEN EXPORTS ===
export type AgriAIColorKey = keyof typeof AgriAIColors;
export type AgriAISpacingKey = keyof typeof AgriAISpacing;
export type AgriAITypographyKey = keyof typeof AgriAITypography;
export type AgriAIShadowKey = keyof typeof AgriAIShadows;
export type AgriAIBorderRadiusKey = keyof typeof AgriAIBorderRadius;
export type AgriAIAnimationKey = keyof typeof AgriAIAnimations;
export type AgriAIBreakpointKey = keyof typeof AgriAIBreakpoints;
export type AgriAIZIndexKey = keyof typeof AgriAIZIndex;