/**
 * AuthLayout Template per AgriAI
 * Layout pulito per pagine di autenticazione (login/register)
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sprout, 
  Shield, 
  Leaf, 
  Wheat, 
  Sun, 
  CloudRain,
  ArrowLeft,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// === TYPES ===
export interface AuthLayoutProps {
  /** Contenuto del form di autenticazione */
  children: React.ReactNode;
  /** Titolo della pagina */
  title: string;
  /** Sottotitolo/descrizione */
  subtitle?: string;
  /** Tipo di autenticazione */
  type?: "login" | "register" | "forgot-password" | "reset-password";
  /** Mostra link di ritorno */
  showBackLink?: boolean;
  /** URL per il link di ritorno */
  backLinkHref?: string;
  /** Mostra elementi decorativi */
  showDecorations?: boolean;
  /** Mostra toggle tema */
  showThemeToggle?: boolean;
  /** Variante del background */
  backgroundVariant?: "gradient" | "pattern" | "image" | "solid";
  /** CSS classes aggiuntive */
  className?: string;
  /** Callback per il back link */
  onBack?: () => void;
}

// === BACKGROUND PATTERNS ===
const BackgroundPatterns = {
  agricultural: (
    <div className="absolute inset-0 opacity-5">
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm-20 0c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20-20-8.954-20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />
    </div>
  ),
  organic: (
    <div className="absolute inset-0 opacity-10">
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h-2z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px'
      }} />
    </div>
  )
};

// === DECORATIVE ELEMENTS ===
const DecorativeElements = () => (
  <>
    {/* Floating agricultural icons */}
    <div className="absolute top-20 left-10 opacity-20 animate-pulse">
      <Wheat className="h-12 w-12 text-growth rotate-12" />
    </div>
    
    <div className="absolute top-40 right-16 opacity-15 animate-pulse delay-1000">
      <Leaf className="h-10 w-10 text-harvest rotate-[-15deg]" />
    </div>
    
    <div className="absolute bottom-32 left-20 opacity-10 animate-pulse delay-2000">
      <CloudRain className="h-8 w-8 text-sky-500 rotate-6" />
    </div>
    
    <div className="absolute bottom-20 right-10 opacity-25 animate-pulse delay-500">
      <Sun className="h-14 w-14 text-yellow-400 rotate-45" />
    </div>

    {/* Gradient orbs */}
    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-growth/20 to-harvest/20 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-earth/20 to-soil/20 rounded-full blur-2xl animate-pulse delay-1000" />
  </>
);

// === AUTH LAYOUT TEMPLATE ===
export const AuthLayout = React.forwardRef<HTMLDivElement, AuthLayoutProps>(
  ({
    children,
    title,
    subtitle,
    type = "login",
    showBackLink = true,
    backLinkHref = "/",
    showDecorations = true,
    showThemeToggle = true,
    backgroundVariant = "gradient",
    className,
    onBack,
    ...props
  }, ref) => {
    // === HOOKS ===
    const navigate = useNavigate();
    const { resolvedTheme } = useTheme();

    // === STATE ===
    const [mounted, setMounted] = useState(false);

    // === EFFECTS ===
    useEffect(() => {
      setMounted(true);
    }, []);

    // === HANDLERS ===
    const handleBack = () => {
      if (onBack) {
        onBack();
      } else {
        navigate(backLinkHref);
      }
    };

    // === COMPUTED VALUES ===
    const isLogin = type === "login";
    const isRegister = type === "register";
    const isForgotPassword = type === "forgot-password";
    const isResetPassword = type === "reset-password";

    // === RENDER HELPERS ===
    const renderBackground = () => {
      const baseClasses = "absolute inset-0 -z-10";

      switch (backgroundVariant) {
        case "gradient":
          return (
            <div className={cn(baseClasses)}>
              <div className="absolute inset-0 bg-gradient-to-br from-growth/5 via-harvest/5 to-earth/5" />
              <div className="absolute inset-0 bg-gradient-to-tr from-background via-transparent to-background/50" />
              {showDecorations && BackgroundPatterns.agricultural}
            </div>
          );

        case "pattern":
          return (
            <div className={cn(baseClasses)}>
              <div className="absolute inset-0 bg-background" />
              {BackgroundPatterns.organic}
            </div>
          );

        case "image":
          return (
            <div className={cn(baseClasses)}>
              <div className="absolute inset-0 bg-gradient-to-br from-growth/20 to-harvest/20" />
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'url("/agricultural-field.jpg")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              <div className="absolute inset-0 bg-background/80" />
            </div>
          );

        case "solid":
        default:
          return (
            <div className={cn(baseClasses, "bg-background")} />
          );
      }
    };

    const renderLogo = () => (
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-r from-growth to-harvest rounded-2xl shadow-lg">
          <Sprout className="h-10 w-10 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">AgriAI</h1>
          <p className="text-sm text-muted-foreground">Agricoltura Intelligente</p>
        </div>
      </div>
    );

    const renderHeader = () => (
      <div className="text-center space-y-4 mb-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Type-specific badges */}
        {isLogin && (
          <Badge variant="agricultural" className="gap-1">
            <Shield className="h-3 w-3" />
            Accesso Sicuro
          </Badge>
        )}
        
        {isRegister && (
          <Badge variant="harvest" className="gap-1">
            <Leaf className="h-3 w-3" />
            Nuovo Account
          </Badge>
        )}
        
        {(isForgotPassword || isResetPassword) && (
          <Badge variant="earth" className="gap-1">
            <Shield className="h-3 w-3" />
            Recupero Password
          </Badge>
        )}
      </div>
    );

    const renderFooter = () => (
      <div className="mt-8 space-y-6">
        <Separator />
        
        {/* Navigation links */}
        <div className="text-center space-y-3">
          {isLogin && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Non hai un account?{" "}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate("/register")}
                  className="h-auto p-0 text-agricultural"
                >
                  Registrati qui
                </Button>
              </p>
              <p className="text-sm text-muted-foreground">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate("/forgot-password")}
                  className="h-auto p-0"
                >
                  Hai dimenticato la password?
                </Button>
              </p>
            </div>
          )}

          {isRegister && (
            <p className="text-sm text-muted-foreground">
              Hai già un account?{" "}
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate("/login")}
                className="h-auto p-0 text-agricultural"
              >
                Accedi qui
              </Button>
            </p>
          )}

          {(isForgotPassword || isResetPassword) && (
            <p className="text-sm text-muted-foreground">
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate("/login")}
                className="h-auto p-0 text-agricultural"
              >
                Torna al login
              </Button>
            </p>
          )}
        </div>

        {/* Support links */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">
            Hai bisogno di aiuto?
          </p>
          <div className="flex justify-center gap-4 text-xs">
            <Button
              variant="link"
              size="sm"
              onClick={() => window.open("/help", "_blank")}
              className="h-auto p-0 text-xs"
            >
              Centro Assistenza
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
            <Button
              variant="link"
              size="sm"
              onClick={() => window.open("/contact", "_blank")}
              className="h-auto p-0 text-xs"
            >
              Contattaci
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>

        {/* Version info */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            AgriAI v1.3 - Made with 🌱 in Italy
          </p>
        </div>
      </div>
    );

    // === RENDER ===
    if (!mounted) {
      return null; // Avoid hydration mismatch
    }

    return (
      <div
        ref={ref}
        className={cn(
          "min-h-screen flex items-center justify-center p-4 relative overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Background */}
        {renderBackground()}

        {/* Decorative elements */}
        {showDecorations && (
          <div className="absolute inset-0 pointer-events-none">
            <DecorativeElements />
          </div>
        )}

        {/* Header controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          {/* Back button */}
          {showBackLink && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2 bg-background/80 backdrop-blur-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Indietro
            </Button>
          )}

          {/* Theme toggle */}
          {showThemeToggle && (
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-1">
              <ThemeToggle />
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="w-full max-w-md mx-auto relative z-10">
          <Card className="bg-background/80 backdrop-blur-sm border shadow-lg">
            <CardHeader className="pb-6">
              {renderLogo()}
              {renderHeader()}
            </CardHeader>

            <CardContent className="space-y-6">
              {children}
              {renderFooter()}
            </CardContent>
          </Card>
        </div>

        {/* Development info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-4 right-4 z-20">
            <div className="bg-background/90 backdrop-blur-sm border rounded-lg p-2 text-xs space-y-1">
              <div>Layout: AuthLayout</div>
              <div>Type: {type}</div>
              <div>Theme: {resolvedTheme}</div>
              <div>Background: {backgroundVariant}</div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AuthLayout.displayName = "AuthLayout";

// === LAYOUT VARIANTS ===

export const LoginLayout = React.forwardRef<HTMLDivElement, Omit<AuthLayoutProps, 'type'>>(
  (props, ref) => {
    return (
      <AuthLayout
        {...props}
        ref={ref}
        type="login"
        title="Accedi al tuo account"
        subtitle="Benvenuto in AgriAI. Accedi per continuare."
      />
    );
  }
);

LoginLayout.displayName = "LoginLayout";

export const RegisterLayout = React.forwardRef<HTMLDivElement, Omit<AuthLayoutProps, 'type'>>(
  (props, ref) => {
    return (
      <AuthLayout
        {...props}
        ref={ref}
        type="register"
        title="Crea il tuo account"
        subtitle="Unisciti alla community AgriAI e trasforma la tua agricoltura."
      />
    );
  }
);

RegisterLayout.displayName = "RegisterLayout";

export const ForgotPasswordLayout = React.forwardRef<HTMLDivElement, Omit<AuthLayoutProps, 'type'>>(
  (props, ref) => {
    return (
      <AuthLayout
        {...props}
        ref={ref}
        type="forgot-password"
        title="Recupera la password"
        subtitle="Inserisci la tua email per ricevere le istruzioni di recupero."
      />
    );
  }
);

ForgotPasswordLayout.displayName = "ForgotPasswordLayout";

export const ResetPasswordLayout = React.forwardRef<HTMLDivElement, Omit<AuthLayoutProps, 'type'>>(
  (props, ref) => {
    return (
      <AuthLayout
        {...props}
        ref={ref}
        type="reset-password"
        title="Reimposta la password"
        subtitle="Inserisci la tua nuova password sicura."
      />
    );
  }
);

ResetPasswordLayout.displayName = "ResetPasswordLayout";

// === EXPORTS ===
export default AuthLayout;