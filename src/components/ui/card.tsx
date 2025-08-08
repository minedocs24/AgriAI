/**
 * Card Component per AgriAI - Versione Moderna
 * Componente card moderno con elevation system avanzato e microinterazioni
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// === MODERN CARD VARIANTS ===
const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "shadow-md border-border hover:shadow-lg hover:border-border/50",
        agricultural: "shadow-agricultural border-growth/20 hover:shadow-lg hover:border-growth/30 hover:-translate-y-1",
        earth: "shadow-earth border-soil/20 hover:shadow-lg hover:border-soil/30 hover:-translate-y-1",
        harvest: "shadow-harvest border-harvest/20 hover:shadow-lg hover:border-harvest/30 hover:-translate-y-1",
        weather: "shadow-weather border-weather/20 hover:shadow-lg hover:border-weather/30 hover:-translate-y-1",
        elevated: "shadow-xl border-border hover:shadow-2xl hover:-translate-y-2",
        outlined: "shadow-none border-2 border-border hover:border-primary/50",
        ghost: "shadow-none border-transparent bg-transparent hover:bg-accent/50",
        gradient: "bg-gradient-to-br from-card to-card/80 border-border/50 shadow-lg hover:shadow-xl",
        glass: "backdrop-blur-sm bg-card/80 border-border/50 shadow-lg hover:shadow-xl",
      },
      padding: {
        none: "",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      interactive: {
        true: "cursor-pointer hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-ring focus:ring-offset-2",
        false: "",
      },
      elevation: {
        none: "shadow-none",
        sm: "shadow-sm",
        md: "shadow-md",
        lg: "shadow-lg",
        xl: "shadow-xl",
        "2xl": "shadow-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "none",
      interactive: false,
      elevation: "md",
    },
  }
);

// === MODERN CARD PROPS ===
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Rende la card cliccabile */
  interactive?: boolean;
  /** Callback per click */
  onCardClick?: () => void;
  /** Effetto hover personalizzato */
  hoverEffect?: "lift" | "glow" | "scale" | "none";
  /** Animazione di entrata */
  animation?: "fade-in" | "slide-up" | "scale-in" | "none";
}

// === MODERN CARD COMPONENT ===
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    padding, 
    interactive, 
    elevation,
    hoverEffect = "lift",
    animation = "fade-in",
    onCardClick, 
    onClick, 
    ...props 
  }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (onCardClick) {
        onCardClick();
      }
      if (onClick) {
        onClick(e);
      }
    };

    // Classi di hover effect
    const hoverEffectClasses = {
      lift: "hover:-translate-y-1 hover:shadow-lg",
      glow: "hover:shadow-lg hover:shadow-primary/25",
      scale: "hover:scale-[1.02]",
      none: "",
    };

    // Classi di animazione
    const animationClasses = {
      "fade-in": "animate-fade-in",
      "slide-up": "animate-slide-up",
      "scale-in": "animate-scale-in",
      none: "",
    };

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, interactive, elevation }),
          hoverEffectClasses[hoverEffect],
          animationClasses[animation],
          className
        )}
        onClick={interactive ? handleClick : onClick}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(e as any);
                }
              }
            : undefined
        }
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

// === MODERN CARD HEADER ===
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "centered" | "compact" | "bordered";
  spacing?: "none" | "sm" | "default" | "lg";
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, variant = "default", spacing = "default", ...props }, ref) => {
    const variantClasses = {
      default: "flex flex-col space-y-1.5",
      centered: "flex flex-col space-y-1.5 text-center",
      compact: "flex flex-col space-y-1",
      bordered: "flex flex-col space-y-1.5 border-b border-border pb-4",
    };

    const spacingClasses = {
      none: "",
      sm: "p-4",
      default: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          spacingClasses[spacing],
          className
        )}
        {...props}
      />
    );
  }
);
CardHeader.displayName = "CardHeader";

// === MODERN CARD TITLE ===
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: "sm" | "default" | "lg" | "xl" | "2xl";
  weight?: "normal" | "medium" | "semibold" | "bold";
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, level = 2, size = "default", weight = "semibold", ...props }, ref) => {
    const Component = `h${level}` as keyof JSX.IntrinsicElements;
    
    const sizeClasses = {
      sm: "text-sm",
      default: "text-lg",
      lg: "text-xl",
      xl: "text-2xl",
      "2xl": "text-3xl",
    };

    const weightClasses = {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    };

    return (
      <Component
        ref={ref}
        className={cn(
          "leading-tight tracking-tight",
          sizeClasses[size],
          weightClasses[weight],
          className
        )}
        {...props}
      />
    );
  }
);
CardTitle.displayName = "CardTitle";

// === MODERN CARD DESCRIPTION ===
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: "sm" | "default" | "lg";
  variant?: "default" | "muted" | "accent";
}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, size = "default", variant = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-base",
    };

    const variantClasses = {
      default: "text-foreground",
      muted: "text-muted-foreground",
      accent: "text-accent-foreground",
    };

    return (
      <p
        ref={ref}
        className={cn(
          "leading-relaxed",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
CardDescription.displayName = "CardDescription";

// === MODERN CARD CONTENT ===
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "default" | "lg";
  spacing?: "none" | "sm" | "default" | "lg";
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding = "default", spacing = "default", children, ...props }, ref) => {
    const paddingClasses = {
      none: "",
      sm: "p-4",
      default: "p-6",
      lg: "p-8",
    };

    const spacingClasses = {
      none: "",
      sm: "space-y-2",
      default: "space-y-4",
      lg: "space-y-6",
    };

    return (
      <div
        ref={ref}
        className={cn(
          paddingClasses[padding],
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
CardContent.displayName = "CardContent";

// === MODERN CARD FOOTER ===
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: "start" | "center" | "end" | "between" | "around";
  padding?: "none" | "sm" | "default" | "lg";
  variant?: "default" | "bordered" | "separated";
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, justify = "start", padding = "default", variant = "default", ...props }, ref) => {
    const justifyClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
    };

    const paddingClasses = {
      none: "",
      sm: "p-4",
      default: "p-6",
      lg: "p-8",
    };

    const variantClasses = {
      default: "flex items-center",
      bordered: "flex items-center border-t border-border pt-4",
      separated: "flex items-center space-x-2",
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          justifyClasses[justify],
          paddingClasses[padding],
          className
        )}
        {...props}
      />
    );
  }
);
CardFooter.displayName = "CardFooter";

// === MODERN AGRICULTURE METRIC CARD ===
interface AgricultureMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  status?: "optimal" | "warning" | "attention" | "info";
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  className?: string;
  onClick?: () => void;
}

const AgricultureMetricCard = React.forwardRef<HTMLDivElement, AgricultureMetricCardProps>(
  ({ 
    title, 
    value, 
    unit, 
    description, 
    status = "info", 
    icon, 
    trend, 
    trendValue, 
    className,
    onClick,
    ...props 
  }, ref) => {
    const statusClasses = {
      optimal: "border-growth/20 bg-growth/5 text-growth",
      warning: "border-harvest/20 bg-harvest/5 text-harvest",
      attention: "border-error/20 bg-error/5 text-error",
      info: "border-weather/20 bg-weather/5 text-weather",
    };

    const trendClasses = {
      up: "text-success",
      down: "text-error",
      stable: "text-muted-foreground",
    };

    const trendIcons = {
      up: "↗",
      down: "↘",
      stable: "→",
    };

    return (
      <Card
        ref={ref}
        variant="agricultural"
        interactive={!!onClick}
        onClick={onClick}
        className={cn(
          "relative overflow-hidden",
          statusClasses[status],
          className
        )}
        {...props}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle size="sm" className="text-current">
              {title}
            </CardTitle>
            {icon && (
              <div className="p-2 rounded-lg bg-current/10">
                {icon}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-bold text-current">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-current/70">
                {unit}
              </span>
            )}
          </div>
          
          {description && (
            <CardDescription className="text-current/70">
              {description}
            </CardDescription>
          )}
          
          {trend && (
            <div className={cn("flex items-center space-x-1 text-sm", trendClasses[trend])}>
              <span>{trendIcons[trend]}</span>
              {trendValue && <span>{trendValue}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
AgricultureMetricCard.displayName = "AgricultureMetricCard";

// === MODERN FIELD STATUS CARD ===
interface FieldStatusCardProps {
  fieldName: string;
  cropType: string;
  area: string;
  status: "healthy" | "needs_attention" | "critical";
  metrics: {
    moisture: number;
    temperature: number;
    ph: number;
  };
  lastUpdate: string;
  className?: string;
  onViewDetails?: () => void;
}

const FieldStatusCard = React.forwardRef<HTMLDivElement, FieldStatusCardProps>(
  ({ 
    fieldName, 
    cropType, 
    area, 
    status, 
    metrics, 
    lastUpdate, 
    className,
    onViewDetails,
    ...props 
  }, ref) => {
    const statusConfig = {
      healthy: {
        color: "text-success",
        bg: "bg-success/10",
        border: "border-success/20",
        icon: "🌱",
      },
      needs_attention: {
        color: "text-warning",
        bg: "bg-warning/10",
        border: "border-warning/20",
        icon: "⚠️",
      },
      critical: {
        color: "text-error",
        bg: "bg-error/10",
        border: "border-error/20",
        icon: "🚨",
      },
    };

    const config = statusConfig[status];

    return (
      <Card
        ref={ref}
        variant="outlined"
        interactive={!!onViewDetails}
        onClick={onViewDetails}
        className={cn(
          "relative",
          config.border,
          className
        )}
        {...props}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle size="sm">{fieldName}</CardTitle>
              <CardDescription>{cropType} • {area}</CardDescription>
            </div>
            <div className={cn("p-2 rounded-lg", config.bg)}>
              <span className="text-2xl">{config.icon}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{metrics.moisture}%</div>
              <div className="text-xs text-muted-foreground">Umidità</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{metrics.temperature}°C</div>
              <div className="text-xs text-muted-foreground">Temperatura</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{metrics.ph}</div>
              <div className="text-xs text-muted-foreground">pH</div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-muted-foreground">
            Ultimo aggiornamento: {lastUpdate}
          </div>
        </CardContent>
      </Card>
    );
  }
);
FieldStatusCard.displayName = "FieldStatusCard";

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
};
