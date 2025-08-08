/**
 * Theme Context e Provider per AgriAI
 * Gestisce il sistema di temi dark/light con persistenza localStorage
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { themeVariants, type ThemeVariant } from '@/config/design-tokens';

// === TYPES ===
type Theme = ThemeVariant;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isLoading: boolean;
  themeConfig: typeof themeVariants[Theme];
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  disableTransitions?: boolean;
}

// === CONTEXT ===
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// === THEME PROVIDER ===
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
  storageKey = 'agriai-theme',
  disableTransitions = false,
  ...props
}) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  // === THEME MANAGEMENT ===
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Persist to localStorage
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
    
    // Apply theme to document
    applyThemeToDocument(newTheme, disableTransitions);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // === THEME APPLICATION ===
  const applyThemeToDocument = (theme: Theme, skipTransitions = false) => {
    const root = document.documentElement;
    
    // Temporarily disable transitions for instant theme switching
    if (skipTransitions) {
      const css = document.createElement('style');
      css.textContent = '*,*::before,*::after{transition:none!important;animation-duration:0.01ms!important;}';
      document.head.appendChild(css);
      
      setTimeout(() => {
        document.head.removeChild(css);
      }, 1);
    }

    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add new theme class
    root.classList.add(theme);

    // Apply CSS custom properties
    const themeColors = themeVariants[theme].colors;
    Object.entries(themeColors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Set data attribute for CSS selectors
    root.setAttribute('data-theme', theme);
    
    // Update meta theme-color for PWA
    updateMetaThemeColor(theme);
  };

  // === META THEME COLOR ===
  const updateMetaThemeColor = (theme: Theme) => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const themeColor = themeVariants[theme].colors.background;
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = themeColor;
      document.head.appendChild(meta);
    }
  };

  // === SYSTEM THEME DETECTION ===
  const getSystemTheme = (): Theme => {
    if (typeof window === 'undefined') return defaultTheme;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // === INITIALIZATION ===
  useEffect(() => {
    let initialTheme = defaultTheme;
    
    try {
      // Try to get theme from localStorage
      const storedTheme = localStorage.getItem(storageKey) as Theme | null;
      
      if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
        initialTheme = storedTheme;
      } else {
        // Fallback to system preference
        initialTheme = getSystemTheme();
      }
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
      initialTheme = getSystemTheme();
    }

    setThemeState(initialTheme);
    applyThemeToDocument(initialTheme, true);
    setIsLoading(false);
  }, [defaultTheme, storageKey]);

  // === SYSTEM THEME CHANGE LISTENER ===
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if no manual preference is stored
      try {
        const storedTheme = localStorage.getItem(storageKey);
        if (!storedTheme) {
          const newTheme = e.matches ? 'dark' : 'light';
          setThemeState(newTheme);
          applyThemeToDocument(newTheme);
        }
      } catch (error) {
        console.warn('Error handling system theme change:', error);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [storageKey]);

  // === CONTEXT VALUE ===
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isLoading,
    themeConfig: themeVariants[theme],
  };

  return (
    <ThemeContext.Provider {...props} value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// === THEME HOOK ===
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

// === THEME HOOK WITH FALLBACK ===
export const useThemeSafe = (): ThemeContextType | null => {
  try {
    return useTheme();
  } catch {
    return null;
  }
};

// === THEME DETECTION UTILITIES ===
export const isThemeDark = (theme: Theme): boolean => theme === 'dark';
export const isThemeLight = (theme: Theme): boolean => theme === 'light';

// === CSS-IN-JS THEME VALUES ===
export const getThemeValue = (theme: Theme, tokenPath: string): string => {
  const config = themeVariants[theme];
  const keys = tokenPath.split('.');
  
  let value: any = config;
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) break;
  }
  
  return value || '';
};

// === THEME TRANSITION UTILITIES ===
export const withThemeTransition = (callback: () => void, duration = 300) => {
  const root = document.documentElement;
  
  // Add transition styles
  root.style.transition = `background-color ${duration}ms ease, color ${duration}ms ease, border-color ${duration}ms ease`;
  
  // Execute callback
  callback();
  
  // Remove transition styles after completion
  setTimeout(() => {
    root.style.transition = '';
  }, duration);
};

// === TYPE EXPORTS ===
export type { Theme, ThemeContextType, ThemeProviderProps };