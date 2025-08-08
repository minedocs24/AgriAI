/**
 * Badge Component per AgriAI
 * Componente badge esteso con varianti agricole, stati e dimensioni
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, Dot } from "lucide-react";
import { cn } from "@/lib/utils";

// === BADGE VARIANTS ===
const badgeVariants = cva(
  "inline-flex items-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Varianti standard
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border border-border hover:bg-accent",
        ghost: "text-foreground hover:bg-accent",
        
        // Varianti agricole
        agricultural: "border-transparent bg-growth text-white hover:bg-growth/90",
        earth: "border-transparent bg-soil text-white hover:bg-soil/90",
        harvest: "border-transparent bg-harvest text-white hover:bg-harvest/90",
        weather: "border-transparent bg-weather text-white hover:bg-weather/90",
        
        // Varianti outline agricole
        "outline-agricultural": "border border-growth text-growth hover:bg-growth hover:text-white",
        "outline-earth": "border border-soil text-soil hover:bg-soil hover:text-white",
        "outline-harvest": "border border-harvest text-harvest hover:bg-harvest hover:text-white",
        "outline-weather": "border border-weather text-weather hover:bg-weather hover:text-white",
        
        // Stati specializzati
        success: "border-transparent bg-success text-white hover:bg-success/90",
        warning: "border-transparent bg-warning text-white hover:bg-warning/90",
        info: "border-transparent bg-info text-white hover:bg-info/90",
        
        // Stati agricoli
        optimal: "border-transparent bg-growth/90 text-white hover:bg-growth",
        attention: "border-transparent bg-harvest/90 text-white hover:bg-harvest",
        critical: "border-transparent bg-destructive/90 text-white hover:bg-destructive",
        monitoring: "border-transparent bg-weather/90 text-white hover:bg-weather",
      },
      size: {
        xs: "px-1.5 py-0.5 text-xs rounded",
        sm: "px-2 py-0.5 text-xs rounded",
        default: "px-2.5 py-0.5 text-xs rounded-full",
        md: "px-3 py-1 text-sm rounded-full",
        lg: "px-4 py-1.5 text-sm rounded-full",
        xl: "px-5 py-2 text-base rounded-full",
      },
      dot: {
        true: "pl-1.5",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      dot: false,
    },
  }
);

// === BADGE PROPS ===
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Mostra un dot colorato */
  showDot?: boolean;
  /** Colore del dot personalizzato */
  dotColor?: string;
  /** Badge removibile */
  removable?: boolean;
  /** Callback per rimozione */
  onRemove?: () => void;
  /** Icona personalizzata */
  icon?: React.ReactNode;
  /** Posizione dell'icona */
  iconPosition?: "left" | "right";
}

// === BADGE COMPONENT ===
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    showDot = false, 
    dotColor,
    removable = false,
    onRemove,
    icon,
    iconPosition = "left",
    children,
    ...props 
  }, ref) => {
    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onRemove) {
        onRemove();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({ variant, size, dot: showDot }),
          removable && "pr-1",
          className
        )}
        {...props}
      >
        {/* Dot indicatore */}
        {showDot && (
          <Dot 
            className={cn(
              "mr-1 h-2 w-2",
              dotColor ? "" : "text-current"
            )}
            style={dotColor ? { color: dotColor } : undefined}
          />
        )}
        
        {/* Icona sinistra */}
        {icon && iconPosition === "left" && (
          <span className="mr-1 flex-shrink-0">
            {icon}
          </span>
        )}
        
        {/* Contenuto */}
        <span className="truncate">
          {children}
        </span>
        
        {/* Icona destra */}
        {icon && iconPosition === "right" && (
          <span className="ml-1 flex-shrink-0">
            {icon}
          </span>
        )}
        
        {/* Pulsante rimozione */}
        {removable && (
          <button
            type="button"
            className="ml-1 flex-shrink-0 rounded-full p-0.5 hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-white/50"
            onClick={handleRemove}
            aria-label="Rimuovi badge"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);
Badge.displayName = "Badge";

// === STATUS BADGE ===
interface StatusBadgeProps extends Omit<BadgeProps, "variant" | "showDot"> {
  status: "optimal" | "warning" | "critical" | "info" | "offline";
  pulse?: boolean;
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, pulse = false, className, children, ...props }, ref) => {
    const statusConfig = {
      optimal: {
        variant: "optimal" as const,
        label: children || "Ottimale",
        dotColor: "rgb(34 197 94)", // green-500
      },
      warning: {
        variant: "attention" as const,
        label: children || "Attenzione",
        dotColor: "rgb(245 158 11)", // amber-500
      },
      critical: {
        variant: "critical" as const,
        label: children || "Critico",
        dotColor: "rgb(239 68 68)", // red-500
      },
      info: {
        variant: "monitoring" as const,
        label: children || "Info",
        dotColor: "rgb(59 130 246)", // blue-500
      },
      offline: {
        variant: "outline" as const,
        label: children || "Offline",
        dotColor: "rgb(156 163 175)", // gray-400
      },
    };

    const config = statusConfig[status];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        showDot={true}
        dotColor={config.dotColor}
        className={cn(
          pulse && "animate-pulse",
          className
        )}
        {...props}
      >
        {config.label}
      </Badge>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

// === NOTIFICATION BADGE ===
interface NotificationBadgeProps extends Omit<BadgeProps, "children"> {
  count: number;
  max?: number;
  showZero?: boolean;
}

const NotificationBadge = React.forwardRef<HTMLDivElement, NotificationBadgeProps>(
  ({ count, max = 99, showZero = false, className, ...props }, ref) => {
    if (count === 0 && !showZero) {
      return null;
    }

    const displayCount = count > max ? `${max}+` : count.toString();

    return (
      <Badge
        ref={ref}
        variant="destructive"
        size="xs"
        className={cn("min-w-[1.25rem] justify-center", className)}
        {...props}
      >
        {displayCount}
      </Badge>
    );
  }
);
NotificationBadge.displayName = "NotificationBadge";

// === AGRICULTURAL BADGE ===
interface AgriculturalBadgeProps extends Omit<BadgeProps, "variant"> {
  type: "crop" | "soil" | "weather" | "equipment" | "season";
  status?: "good" | "moderate" | "poor";
}

const AgriculturalBadge = React.forwardRef<HTMLDivElement, AgriculturalBadgeProps>(
  ({ type, status = "good", className, children, ...props }, ref) => {
    const typeConfig = {
      crop: {
        variant: "agricultural" as const,
        icon: "🌱",
      },
      soil: {
        variant: "earth" as const,
        icon: "🌍",
      },
      weather: {
        variant: "weather" as const,
        icon: "⛅",
      },
      equipment: {
        variant: "outline" as const,
        icon: "🚜",
      },
      season: {
        variant: "harvest" as const,
        icon: "📅",
      },
    };

    const statusVariant = status === "good" 
      ? typeConfig[type].variant 
      : status === "moderate" 
      ? "warning" 
      : "critical";

    return (
      <Badge
        ref={ref}
        variant={statusVariant}
        icon={<span>{typeConfig[type].icon}</span>}
        className={className}
        {...props}
      >
        {children}
      </Badge>
    );
  }
);
AgriculturalBadge.displayName = "AgriculturalBadge";

// === BADGE GROUP ===
interface BadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: "sm" | "md" | "lg";
  wrap?: boolean;
}

const BadgeGroup = React.forwardRef<HTMLDivElement, BadgeGroupProps>(
  ({ className, spacing = "sm", wrap = true, ...props }, ref) => {
    const spacingClasses = {
      sm: "gap-1",
      md: "gap-2",
      lg: "gap-3",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          spacingClasses[spacing],
          wrap && "flex-wrap",
          className
        )}
        {...props}
      />
    );
  }
);
BadgeGroup.displayName = "BadgeGroup";

// === EXPORTS ===
export { 
  Badge, 
  StatusBadge, 
  NotificationBadge, 
  AgriculturalBadge,
  BadgeGroup,
  badgeVariants 
};

export type { 
  BadgeProps, 
  StatusBadgeProps, 
  NotificationBadgeProps, 
  AgriculturalBadgeProps,
  BadgeGroupProps
};
