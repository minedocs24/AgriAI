/**
 * Spinner Component per AgriAI
 * Componente di loading con animazioni smooth
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// === SPINNER VARIANTS ===
const spinnerVariants = cva(
  "animate-spin rounded-full border-solid border-current",
  {
    variants: {
      size: {
        xs: "h-3 w-3 border",
        sm: "h-4 w-4 border",
        default: "h-5 w-5 border-2",
        lg: "h-6 w-6 border-2",
        xl: "h-8 w-8 border-2",
        "2xl": "h-10 w-10 border-2",
      },
      variant: {
        default: "border-b-transparent border-l-transparent",
        dots: "border-b-transparent border-r-transparent",
        pulse: "border-b-transparent border-l-transparent opacity-75",
      },
      speed: {
        slow: "animate-[spin_1.5s_linear_infinite]",
        default: "animate-[spin_1s_linear_infinite]", 
        fast: "animate-[spin_0.75s_linear_infinite]",
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default", 
      speed: "default",
    },
  }
);

// === SPINNER PROPS ===
export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /** Testo accessibile per screen readers */
  label?: string;
}

// === SPINNER COMPONENT ===
const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, variant, speed, label = "Caricamento...", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size, variant, speed }), className)}
        role="status"
        aria-label={label}
        aria-live="polite"
        {...props}
      >
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);
Spinner.displayName = "Spinner";

// === SPINNER WITH TEXT ===
interface SpinnerWithTextProps extends SpinnerProps {
  text?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const SpinnerWithText = React.forwardRef<HTMLDivElement, SpinnerWithTextProps>(
  ({ text, position = "right", className, ...props }, ref) => {
    const isVertical = position === "top" || position === "bottom";
    const flexDirection = {
      top: "flex-col-reverse",
      bottom: "flex-col",
      left: "flex-row-reverse", 
      right: "flex-row"
    }[position];

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2",
          flexDirection,
          isVertical && "text-center",
          className
        )}
      >
        <Spinner {...props} />
        {text && (
          <span className="text-sm text-muted-foreground animate-pulse">
            {text}
          </span>
        )}
      </div>
    );
  }
);
SpinnerWithText.displayName = "SpinnerWithText";

// === LOADING OVERLAY ===
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  className?: string;
  spinnerProps?: SpinnerProps;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  text = "Caricamento...",
  className,
  spinnerProps,
}) => {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <SpinnerWithText 
            text={text}
            position="bottom"
            {...spinnerProps}
          />
        </div>
      )}
    </div>
  );
};

// === EXPORTS ===
export { 
  Spinner, 
  SpinnerWithText, 
  LoadingOverlay, 
  spinnerVariants 
};
export type { SpinnerProps, SpinnerWithTextProps, LoadingOverlayProps };