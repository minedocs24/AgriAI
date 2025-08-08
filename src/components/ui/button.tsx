/**
 * Button Component per AgriAI - Versione Moderna
 * Componente pulsante moderno con microinterazioni avanzate e design system aggiornato
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

// === MODERN BUTTON VARIANTS ===
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] hover:scale-[1.02]",
  {
    variants: {
      variant: {
        // Varianti standard moderne
        default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg active:shadow-sm",
        destructive: "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg active:shadow-sm",
        outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent shadow-sm hover:shadow-md",
        secondary: "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80 hover:shadow-lg active:shadow-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto shadow-none hover:shadow-none active:scale-100",
        
        // Varianti agricole moderne
        agricultural: "bg-growth text-white shadow-agricultural hover:bg-growth/90 hover:shadow-lg active:shadow-agricultural",
        earth: "bg-soil text-white shadow-earth hover:bg-soil/90 hover:shadow-lg active:shadow-earth",
        harvest: "bg-harvest text-white shadow-harvest hover:bg-harvest/90 hover:shadow-lg active:shadow-harvest",
        weather: "bg-weather text-white shadow-weather hover:bg-weather/90 hover:shadow-lg active:shadow-weather",
        
        // Varianti outline agricole moderne
        "outline-agricultural": "border-2 border-growth text-growth hover:bg-growth hover:text-white shadow-sm hover:shadow-md",
        "outline-earth": "border-2 border-soil text-soil hover:bg-soil hover:text-white shadow-sm hover:shadow-md",
        "outline-harvest": "border-2 border-harvest text-harvest hover:bg-harvest hover:text-white shadow-sm hover:shadow-md",
        
        // Varianti speciali moderne
        success: "bg-success text-white shadow-md hover:bg-success/90 hover:shadow-lg active:shadow-sm",
        warning: "bg-warning text-white shadow-md hover:bg-warning/90 hover:shadow-lg active:shadow-sm",
        info: "bg-info text-white shadow-md hover:bg-info/90 hover:shadow-lg active:shadow-sm",
        
        // Varianti gradient moderne
        "gradient-primary": "bg-gradient-to-r from-brand-primary-500 to-brand-primary-600 text-white shadow-md hover:from-brand-primary-600 hover:to-brand-primary-700 hover:shadow-lg active:shadow-sm",
        "gradient-earth": "bg-gradient-to-r from-brand-earth-500 to-brand-earth-600 text-white shadow-md hover:from-brand-earth-600 hover:to-brand-earth-700 hover:shadow-lg active:shadow-sm",
        "gradient-harvest": "bg-gradient-to-r from-brand-grain-500 to-brand-grain-600 text-white shadow-md hover:from-brand-grain-600 hover:to-brand-grain-700 hover:shadow-lg active:shadow-sm",
      },
      size: {
        xs: "h-7 px-2 text-xs rounded-md",
        sm: "h-9 px-3 text-sm rounded-md",
        default: "h-10 px-4 py-2 text-sm rounded-lg",
        lg: "h-11 px-8 text-base rounded-lg",
        xl: "h-12 px-10 text-lg rounded-xl",
        "2xl": "h-14 px-12 text-xl rounded-xl",
        icon: "h-10 w-10 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-12 w-12 rounded-xl",
        "icon-xl": "h-14 w-14 rounded-xl",
      },
      loading: {
        true: "cursor-wait",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
    },
  }
);

// === MODERN BUTTON PROPS ===
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Renderizza come elemento figlio tramite Slot */
  asChild?: boolean;
  /** Stato loading con spinner */
  loading?: boolean;
  /** Testo loading personalizzato */
  loadingText?: string;
  /** Icona iniziale */
  startIcon?: React.ReactNode;
  /** Icona finale */
  endIcon?: React.ReactNode;
  /** Tooltip accessibile */
  "aria-describedby"?: string;
  /** Effetto ripple personalizzato */
  ripple?: boolean;
  /** Variante di animazione */
  animation?: "default" | "bounce" | "pulse" | "none";
}

// === MODERN BUTTON COMPONENT ===
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    startIcon,
    endIcon,
    disabled,
    children,
    ripple = true,
    animation = "default",
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;
    
    // Gestione icone e contenuto
    const content = (
      <>
        {loading && (
          <Spinner 
            size="sm" 
            className="animate-spin" 
            aria-hidden="true"
          />
        )}
        {!loading && startIcon && startIcon}
        {loading && loadingText ? loadingText : children}
        {!loading && endIcon && endIcon}
      </>
    );

    // Classi di animazione
    const animationClasses = {
      default: "transition-all duration-200",
      bounce: "transition-all duration-200 hover:animate-bounce",
      pulse: "transition-all duration-200 hover:animate-pulse",
      none: "",
    };

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, loading }),
          animationClasses[animation],
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// === MODERN BUTTON GROUP ===
interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  spacing?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "segmented" | "pills";
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", spacing = "sm", variant = "default", children, ...props }, ref) => {
    const spacingClasses = {
      none: "",
      sm: orientation === "horizontal" ? "space-x-1" : "space-y-1",
      md: orientation === "horizontal" ? "space-x-2" : "space-y-2",
      lg: orientation === "horizontal" ? "space-x-3" : "space-y-3",
    };

    const variantClasses = {
      default: "flex",
      segmented: "flex rounded-lg border border-input bg-muted p-1",
      pills: "flex rounded-full border border-input bg-muted p-1",
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          orientation === "vertical" ? "flex-col" : "flex-row",
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ButtonGroup.displayName = "ButtonGroup";

// === MODERN ICON BUTTON ===
interface IconButtonProps extends Omit<ButtonProps, "startIcon" | "endIcon"> {
  icon: React.ReactNode;
  label: string;
  tooltip?: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, tooltip, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn("hover:bg-accent/50", className)}
        aria-label={label}
        title={tooltip || label}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";

// === MODERN FLOATING ACTION BUTTON ===
interface FloatingActionButtonProps extends Omit<ButtonProps, "size"> {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  size?: "sm" | "md" | "lg";
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ position = "bottom-right", size = "md", className, ...props }, ref) => {
    const positionClasses = {
      "bottom-right": "bottom-6 right-6",
      "bottom-left": "bottom-6 left-6",
      "top-right": "top-6 right-6",
      "top-left": "top-6 left-6",
    };

    const sizeClasses = {
      sm: "h-12 w-12",
      md: "h-14 w-14",
      lg: "h-16 w-16",
    };

    return (
      <Button
        ref={ref}
        size="icon"
        variant="gradient-primary"
        className={cn(
          "fixed z-50 rounded-full shadow-xl hover:shadow-2xl",
          positionClasses[position],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
FloatingActionButton.displayName = "FloatingActionButton";

export { Button, ButtonGroup, IconButton, FloatingActionButton, buttonVariants };
