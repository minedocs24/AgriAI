/**
 * Avatar Component per AgriAI
 * Componente avatar esteso con dimensioni, status indicator e fallback personalizzati
 */

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { User, Tractor, Leaf, Building } from "lucide-react";
import { cn } from "@/lib/utils";

// === AVATAR VARIANTS ===
const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden transition-all duration-200",
  {
    variants: {
      size: {
        xs: "h-6 w-6",
        sm: "h-8 w-8",
        default: "h-10 w-10",
        md: "h-12 w-12",
        lg: "h-16 w-16",
        xl: "h-20 w-20",
        "2xl": "h-24 w-24",
        "3xl": "h-32 w-32",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-lg",
        rounded: "rounded-md",
      },
      variant: {
        default: "border-2 border-transparent",
        bordered: "border-2 border-border",
        agricultural: "border-2 border-growth/30",
        earth: "border-2 border-soil/30",
        harvest: "border-2 border-harvest/30",
      },
    },
    defaultVariants: {
      size: "default",
      shape: "circle",
      variant: "default",
    },
  }
);

// === AVATAR PROPS ===
interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  /** Status indicator */
  status?: "online" | "offline" | "busy" | "away";
  /** Posizione status indicator */
  statusPosition?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  /** Mostra badge di notifica */
  notification?: boolean;
  /** Numero di notifiche */
  notificationCount?: number;
  /** Click handler per avatar */
  onClick?: () => void;
}

// === AVATAR COMPONENT ===
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ 
  className, 
  size, 
  shape, 
  variant,
  status,
  statusPosition = "bottom-right",
  notification = false,
  notificationCount,
  onClick,
  ...props 
}, ref) => {
  const isClickable = !!onClick;

  const statusColors = {
    online: "bg-success border-background",
    offline: "bg-muted-foreground border-background",
    busy: "bg-destructive border-background", 
    away: "bg-warning border-background",
  };

  const statusPositions = {
    "top-right": "top-0 right-0",
    "bottom-right": "bottom-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-left": "bottom-0 left-0",
  };

  const getStatusSize = (avatarSize: string) => {
    const sizes = {
      xs: "h-2 w-2",
      sm: "h-2 w-2",
      default: "h-3 w-3",
      md: "h-3 w-3",
      lg: "h-4 w-4",
      xl: "h-4 w-4",
      "2xl": "h-5 w-5",
      "3xl": "h-6 w-6",
    };
    return sizes[avatarSize as keyof typeof sizes] || sizes.default;
  };

  return (
    <div className="relative inline-block">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          avatarVariants({ size, shape, variant }),
          isClickable && "cursor-pointer hover:opacity-80",
          className
        )}
        onClick={onClick}
        {...props}
      >
        {props.children}
      </AvatarPrimitive.Root>
      
      {/* Status Indicator */}
      {status && (
        <div
          className={cn(
            "absolute rounded-full border-2",
            statusColors[status],
            statusPositions[statusPosition],
            getStatusSize(size || "default")
          )}
          aria-label={`Status: ${status}`}
        />
      )}
      
      {/* Notification Badge */}
      {notification && (
        <div
          className={cn(
            "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white",
            size === "xs" && "h-4 w-4 text-xs",
            size === "sm" && "h-4 w-4 text-xs",
            (size === "lg" || size === "xl" || size === "2xl" || size === "3xl") && "h-6 w-6"
          )}
        >
          {notificationCount && notificationCount > 9 ? "9+" : notificationCount || ""}
        </div>
      )}
    </div>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

// === AVATAR IMAGE ===
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

// === AVATAR FALLBACK ===
interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> {
  /** Icona personalizzata per fallback */
  icon?: React.ReactNode;
  /** Tipo di avatar per icona automatica */
  type?: "user" | "farmer" | "organization" | "equipment";
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, icon, type = "user", children, ...props }, ref) => {
  const getDefaultIcon = () => {
    const iconMap = {
      user: User,
      farmer: Leaf,
      organization: Building,
      equipment: Tractor,
    };
    
    const IconComponent = iconMap[type];
    return <IconComponent className="h-1/2 w-1/2 text-muted-foreground" />;
  };

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center bg-muted font-medium text-muted-foreground",
        className
      )}
      {...props}
    >
      {children || icon || getDefaultIcon()}
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// === AVATAR GROUP ===
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Massimo numero di avatar da mostrare */
  max?: number;
  /** Dimensione degli avatar */
  size?: "xs" | "sm" | "default" | "md" | "lg" | "xl" | "2xl" | "3xl";
  /** Overlap tra avatar */
  spacing?: "none" | "sm" | "md" | "lg";
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, max = 5, size = "default", spacing = "md", children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const visibleChildren = childrenArray.slice(0, max);
    const remainingCount = Math.max(0, childrenArray.length - max);

    const spacingClasses = {
      none: "space-x-0",
      sm: "-space-x-1",
      md: "-space-x-2",
      lg: "-space-x-3",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <div key={index} className="relative ring-2 ring-background rounded-full">
            {React.cloneElement(child as React.ReactElement, { size })}
          </div>
        ))}
        
        {remainingCount > 0 && (
          <Avatar
            size={size}
            className="relative ring-2 ring-background"
          >
            <AvatarFallback className="bg-muted text-muted-foreground">
              +{remainingCount}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = "AvatarGroup";

// === AGRICULTURAL AVATAR ===
interface AgriculturalAvatarProps extends Omit<AvatarProps, "variant"> {
  /** Tipo di utente agricolo */
  role: "farmer" | "agronomist" | "technician" | "admin" | "inspector";
  /** Nome per generare initials */
  name?: string;
  /** URL immagine */
  src?: string;
  /** Alt text per immagine */
  alt?: string;
}

const AgriculturalAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AgriculturalAvatarProps
>(({ role, name, src, alt, className, ...props }, ref) => {
  const roleConfig = {
    farmer: {
      variant: "agricultural" as const,
      icon: Leaf,
      fallbackBg: "bg-growth/10 text-growth",
    },
    agronomist: {
      variant: "earth" as const,
      icon: User,
      fallbackBg: "bg-soil/10 text-soil",
    },
    technician: {
      variant: "harvest" as const,
      icon: Tractor,
      fallbackBg: "bg-harvest/10 text-harvest",
    },
    admin: {
      variant: "default" as const,
      icon: Building,
      fallbackBg: "bg-primary/10 text-primary",
    },
    inspector: {
      variant: "bordered" as const,
      icon: User,
      fallbackBg: "bg-muted text-muted-foreground",
    },
  };

  const config = roleConfig[role];
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <Avatar
      ref={ref}
      variant={config.variant}
      className={className}
      {...props}
    >
      {src && <AvatarImage src={src} alt={alt || name || `Avatar ${role}`} />}
      <AvatarFallback 
        icon={<config.icon className="h-1/2 w-1/2" />}
        className={config.fallbackBg}
      >
        {initials || <config.icon className="h-1/2 w-1/2" />}
      </AvatarFallback>
    </Avatar>
  );
});
AgriculturalAvatar.displayName = "AgriculturalAvatar";

// === EXPORTS ===
export { 
  Avatar, 
  AvatarImage, 
  AvatarFallback, 
  AvatarGroup,
  AgriculturalAvatar,
  avatarVariants 
};

export type { 
  AvatarProps, 
  AvatarFallbackProps, 
  AvatarGroupProps,
  AgriculturalAvatarProps
};
