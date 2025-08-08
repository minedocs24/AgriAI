/**
 * Theme Toggle Component per AgriAI
 * Permette il cambio dinamico tra tema light e dark
 */

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

// === THEME TOGGLE BUTTON ===
interface ThemeToggleProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "ghost",
  size = "icon",
  className,
  showLabel = false,
}) => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("theme-transition", className)}
          aria-label="Cambia tema"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          {showLabel && <span className="ml-2">Tema</span>}
          <span className="sr-only">Cambia tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="min-w-[120px] theme-transition"
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={cn(
            "cursor-pointer theme-transition",
            theme === "light" && "bg-accent text-accent-foreground"
          )}
        >
          <Sun className="mr-2 h-4 w-4" />
          Chiaro
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={cn(
            "cursor-pointer theme-transition",
            theme === "dark" && "bg-accent text-accent-foreground"
          )}
        >
          <Moon className="mr-2 h-4 w-4" />
          Scuro
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// === SIMPLE TOGGLE BUTTON ===
interface SimpleThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const SimpleThemeToggle: React.FC<SimpleThemeToggleProps> = ({
  className,
  size = "md",
}) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "theme-transition hover:shadow-agricultural rounded-full",
        sizeClasses[size],
        className
      )}
      aria-label={`Cambia al tema ${theme === "light" ? "scuro" : "chiaro"}`}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">
        Cambia al tema {theme === "light" ? "scuro" : "chiaro"}
      </span>
    </Button>
  );
};

// === THEME STATUS INDICATOR ===
interface ThemeStatusProps {
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
}

export const ThemeStatus: React.FC<ThemeStatusProps> = ({
  className,
  showIcon = true,
  showText = true,
}) => {
  const { theme, themeConfig } = useTheme();

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-muted-foreground",
      className
    )}>
      {showIcon && (
        <div className="relative">
          {theme === "light" ? (
            <Sun className="h-4 w-4 text-harvest" />
          ) : (
            <Moon className="h-4 w-4 text-brand-primary-400" />
          )}
        </div>
      )}
      {showText && (
        <span className="font-medium">
          {themeConfig.name}
        </span>
      )}
    </div>
  );
};

// === THEME PREVIEW CARD ===
interface ThemePreviewProps {
  themeName: "light" | "dark";
  isActive?: boolean;
  onSelect?: () => void;
  className?: string;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({
  themeName,
  isActive = false,
  onSelect,
  className,
}) => {
  const colors = themeName === "light" 
    ? {
        bg: "hsl(0, 0%, 100%)",
        card: "hsl(0, 0%, 100%)",
        border: "hsl(240, 5.9%, 90%)",
        primary: "hsl(122, 45%, 42%)",
        secondary: "hsl(25, 35%, 42%)",
        accent: "hsl(40, 40%, 48%)",
      }
    : {
        bg: "hsl(240, 10%, 3.9%)",
        card: "hsl(240, 10%, 3.9%)",
        border: "hsl(240, 3.7%, 15.9%)",
        primary: "hsl(118, 38%, 65%)",
        secondary: "hsl(30, 25%, 65%)",
        accent: "hsl(44, 28%, 68%)",
      };

  return (
    <div
      className={cn(
        "relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md",
        isActive 
          ? "border-primary shadow-agricultural" 
          : "border-border hover:border-muted-foreground",
        className
      )}
      onClick={onSelect}
      style={{ backgroundColor: colors.bg }}
    >
      {/* Preview Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {themeName === "light" ? (
            <Sun className="h-4 w-4" style={{ color: colors.primary }} />
          ) : (
            <Moon className="h-4 w-4" style={{ color: colors.primary }} />
          )}
          <span className="text-sm font-medium capitalize" style={{ color: colors.primary }}>
            {themeName === "light" ? "Tema Chiaro" : "Tema Scuro"}
          </span>
        </div>
        {isActive && (
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.primary }} />
        )}
      </div>

      {/* Color Swatches */}
      <div className="grid grid-cols-3 gap-2">
        <div 
          className="h-8 rounded border" 
          style={{ 
            backgroundColor: colors.primary,
            borderColor: colors.border 
          }} 
        />
        <div 
          className="h-8 rounded border" 
          style={{ 
            backgroundColor: colors.secondary,
            borderColor: colors.border 
          }} 
        />
        <div 
          className="h-8 rounded border" 
          style={{ 
            backgroundColor: colors.accent,
            borderColor: colors.border 
          }} 
        />
      </div>

      {/* Theme Description */}
      <div className="mt-2 text-xs opacity-70">
        {themeName === "light" 
          ? "Tema chiaro agricolo con tonalità naturali"
          : "Tema scuro con colori agricoli adattati"
        }
      </div>
    </div>
  );
};

// === EXPORTS ===
export default ThemeToggle;