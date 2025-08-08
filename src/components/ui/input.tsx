/**
 * Input Component per AgriAI - Versione Moderna
 * Componente input moderno con floating labels, validation states avanzati e microinterazioni
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Search, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// === MODERN INPUT VARIANTS ===
const inputVariants = cva(
  "flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-input hover:border-input/80 focus:border-ring",
        agricultural: "border-growth/30 hover:border-growth/50 focus:border-growth shadow-sm",
        earth: "border-soil/30 hover:border-soil/50 focus:border-soil shadow-sm",
        harvest: "border-harvest/30 hover:border-harvest/50 focus:border-harvest shadow-sm",
        weather: "border-weather/30 hover:border-weather/50 focus:border-weather shadow-sm",
        error: "border-destructive hover:border-destructive/80 focus:border-destructive",
        success: "border-success hover:border-success/80 focus:border-success",
        warning: "border-warning hover:border-warning/80 focus:border-warning",
      },
      size: {
        sm: "h-8 px-2 text-xs",
        default: "h-10 px-3 py-2 text-sm",
        lg: "h-12 px-4 py-3 text-base",
        xl: "h-14 px-5 py-4 text-lg",
      },
      state: {
        default: "",
        error: "border-destructive focus:border-destructive",
        success: "border-success focus:border-success",
        warning: "border-warning focus:border-warning",
        loading: "border-muted-foreground/30",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
);

// === MODERN INPUT PROPS ===
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  /** Icona iniziale */
  startIcon?: React.ReactNode;
  /** Icona finale */
  endIcon?: React.ReactNode;
  /** Stato di validazione */
  validationState?: "default" | "error" | "success" | "warning" | "loading";
  /** Messaggio di errore */
  errorMessage?: string;
  /** Messaggio di successo */
  successMessage?: string;
  /** Messaggio di avviso */
  warningMessage?: string;
  /** Testo di aiuto */
  helperText?: string;
  /** Contatore caratteri */
  showCharacterCount?: boolean;
  /** Limite massimo caratteri */
  maxLength?: number;
  /** Label fluttuante */
  floatingLabel?: string;
  /** Animazione di entrata */
  animation?: "fade-in" | "slide-up" | "scale-in" | "none";
}

// === MODERN INPUT COMPONENT ===
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant, 
    size, 
    state,
    validationState,
    startIcon, 
    endIcon, 
    errorMessage,
    successMessage,
    warningMessage,
    helperText,
    showCharacterCount,
    maxLength,
    floatingLabel,
    animation = "fade-in",
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [characterCount, setCharacterCount] = React.useState(0);
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    // Gestione stato interno
    const currentState = validationState || state || "default";
    const hasError = currentState === "error";
    const hasSuccess = currentState === "success";
    const hasWarning = currentState === "warning";
    const isLoading = currentState === "loading";

    // Gestione tipo input
    const inputType = type === "password" && showPassword ? "text" : type;

    // Gestione caratteri
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCharacterCount(value.length);
      setHasValue(value.length > 0);
      
      if (props.onChange) {
        props.onChange(e);
      }
    };

    // Gestione focus
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    // Icone di stato
    const getStateIcon = () => {
      if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      if (hasError) return <AlertCircle className="h-4 w-4 text-destructive" />;
      if (hasSuccess) return <CheckCircle className="h-4 w-4 text-success" />;
      if (hasWarning) return <AlertCircle className="h-4 w-4 text-warning" />;
      return null;
    };

    // Messaggi di stato
    const getStateMessage = () => {
      if (hasError) return errorMessage;
      if (hasSuccess) return successMessage;
      if (hasWarning) return warningMessage;
      return helperText;
    };

    // Classi di animazione
    const animationClasses = {
      "fade-in": "animate-fade-in",
      "slide-up": "animate-slide-up",
      "scale-in": "animate-scale-in",
      none: "",
    };

    return (
      <div className={cn("relative w-full", animationClasses[animation])}>
        {/* Floating Label */}
        {floatingLabel && (
          <label
            className={cn(
              "absolute left-3 top-2 text-sm transition-all duration-200 pointer-events-none",
              isFocused || hasValue
                ? "text-xs -translate-y-2 text-primary"
                : "text-muted-foreground"
            )}
          >
            {floatingLabel}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Start Icon */}
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {startIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant, size, state: currentState }),
              startIcon && "pl-10",
              endIcon && "pr-10",
              floatingLabel && (isFocused || hasValue) && "pt-6",
              className
            )}
            ref={ref}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            maxLength={maxLength}
            {...props}
          />

          {/* End Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {/* State Icon */}
            {getStateIcon()}
            
            {/* Password Toggle */}
            {type === "password" && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Clear Button */}
            {endIcon === "clear" && hasValue && (
              <button
                type="button"
                onClick={() => {
                  const event = { target: { value: "" } } as React.ChangeEvent<HTMLInputElement>;
                  handleInputChange(event);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Custom End Icon */}
            {endIcon && endIcon !== "clear" && endIcon}
          </div>
        </div>

        {/* Helper Text & Character Count */}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex-1">
            {getStateMessage() && (
              <p
                className={cn(
                  "text-xs",
                  hasError && "text-destructive",
                  hasSuccess && "text-success",
                  hasWarning && "text-warning",
                  !hasError && !hasSuccess && !hasWarning && "text-muted-foreground"
                )}
              >
                {getStateMessage()}
              </p>
            )}
          </div>

          {/* Character Count */}
          {showCharacterCount && maxLength && (
            <span className="text-xs text-muted-foreground">
              {characterCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";

// === MODERN PASSWORD INPUT ===
interface PasswordInputProps extends Omit<InputProps, "type" | "endIcon"> {
  showToggle?: boolean;
  strengthIndicator?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showToggle = true, strengthIndicator = false, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="password"
        endIcon={showToggle ? "password" : undefined}
        {...props}
      />
    );
  }
);
PasswordInput.displayName = "PasswordInput";

// === MODERN SEARCH INPUT ===
interface SearchInputProps extends Omit<InputProps, "type" | "startIcon"> {
  onClear?: () => void;
  showClearButton?: boolean;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, showClearButton = true, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        startIcon={<Search className="h-4 w-4" />}
        endIcon={showClearButton ? "clear" : undefined}
        placeholder={props.placeholder || "Cerca..."}
        {...props}
      />
    );
  }
);
SearchInput.displayName = "SearchInput";

// === MODERN TEXTAREA ===
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputVariants> {
  /** Icona iniziale */
  startIcon?: React.ReactNode;
  /** Stato di validazione */
  validationState?: "default" | "error" | "success" | "warning" | "loading";
  /** Messaggio di errore */
  errorMessage?: string;
  /** Messaggio di successo */
  successMessage?: string;
  /** Messaggio di avviso */
  warningMessage?: string;
  /** Testo di aiuto */
  helperText?: string;
  /** Contatore caratteri */
  showCharacterCount?: boolean;
  /** Limite massimo caratteri */
  maxLength?: number;
  /** Label fluttuante */
  floatingLabel?: string;
  /** Numero di righe */
  rows?: number;
  /** Ridimensionabile */
  resizable?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant, 
    size, 
    state,
    validationState,
    startIcon, 
    errorMessage,
    successMessage,
    warningMessage,
    helperText,
    showCharacterCount,
    maxLength,
    floatingLabel,
    rows = 3,
    resizable = true,
    ...props 
  }, ref) => {
    const [characterCount, setCharacterCount] = React.useState(0);
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    // Gestione stato interno
    const currentState = validationState || state || "default";
    const hasError = currentState === "error";
    const hasSuccess = currentState === "success";
    const hasWarning = currentState === "warning";

    // Gestione caratteri
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setCharacterCount(value.length);
      setHasValue(value.length > 0);
      
      if (props.onChange) {
        props.onChange(e);
      }
    };

    // Gestione focus
    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    // Messaggi di stato
    const getStateMessage = () => {
      if (hasError) return errorMessage;
      if (hasSuccess) return successMessage;
      if (hasWarning) return warningMessage;
      return helperText;
    };

    return (
      <div className="relative w-full">
        {/* Floating Label */}
        {floatingLabel && (
          <label
            className={cn(
              "absolute left-3 top-2 text-sm transition-all duration-200 pointer-events-none",
              isFocused || hasValue
                ? "text-xs -translate-y-2 text-primary"
                : "text-muted-foreground"
            )}
          >
            {floatingLabel}
          </label>
        )}

        {/* Textarea Container */}
        <div className="relative">
          {/* Start Icon */}
          {startIcon && (
            <div className="absolute left-3 top-3 text-muted-foreground">
              {startIcon}
            </div>
          )}

          {/* Textarea Field */}
          <textarea
            className={cn(
              inputVariants({ variant, size, state: currentState }),
              startIcon && "pl-10",
              floatingLabel && (isFocused || hasValue) && "pt-6",
              !resizable && "resize-none",
              className
            )}
            ref={ref}
            rows={rows}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            maxLength={maxLength}
            {...props}
          />
        </div>

        {/* Helper Text & Character Count */}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex-1">
            {getStateMessage() && (
              <p
                className={cn(
                  "text-xs",
                  hasError && "text-destructive",
                  hasSuccess && "text-success",
                  hasWarning && "text-warning",
                  !hasError && !hasSuccess && !hasWarning && "text-muted-foreground"
                )}
              >
                {getStateMessage()}
              </p>
            )}
          </div>

          {/* Character Count */}
          {showCharacterCount && maxLength && (
            <span className="text-xs text-muted-foreground">
              {characterCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Input, PasswordInput, SearchInput, Textarea, inputVariants };
