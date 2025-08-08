/**
 * AppLayout Template per AgriAI
 * Layout principale dell'applicazione con header, navigation, sidebar e footer
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Header, getHeaderConfig } from "@/components/organisms/Header";
import { Navigation, getNavigationConfig } from "@/components/organisms/Navigation";
import { Footer, getFooterConfig } from "@/components/organisms/Footer";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Menu,
  X
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// === TYPES ===
export interface AppLayoutProps {
  /** Contenuto principale */
  children: React.ReactNode;
  /** Header personalizzato */
  header?: React.ReactNode;
  /** Navigation personalizzata */
  navigation?: React.ReactNode;
  /** Sidebar personalizzata */
  sidebar?: React.ReactNode;
  /** Footer personalizzato */
  footer?: React.ReactNode;
  /** Variante del layout */
  variant?: "default" | "sidebar" | "fullscreen" | "compact";
  /** Mostra loading overlay */
  loading?: boolean;
  /** Messaggio di errore globale */
  error?: string | null;
  /** CSS classes aggiuntive */
  className?: string;
  /** Callback per retry in caso di errore */
  onRetry?: () => void;
  /** Mostra breadcrumb */
  showBreadcrumb?: boolean;
  /** Layout per mobile */
  mobileLayout?: "standard" | "bottom-nav" | "drawer";
}

// === LOADING STATES ===
interface LoadingStates {
  header: boolean;
  navigation: boolean;
  content: boolean;
  sidebar: boolean;
  footer: boolean;
}

// === APP LAYOUT TEMPLATE ===
export const AppLayout = React.forwardRef<HTMLDivElement, AppLayoutProps>(
  ({
    children,
    header,
    navigation,
    sidebar,
    footer,
    variant = "default",
    loading = false,
    error = null,
    className,
    onRetry,
    showBreadcrumb = true,
    mobileLayout = "standard",
    ...props
  }, ref) => {
    // === HOOKS ===
    const location = useLocation();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { resolvedTheme } = useTheme();

    // === STATE ===
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [loadingStates, setLoadingStates] = useState<LoadingStates>({
      header: false,
      navigation: false,
      content: false,
      sidebar: false,
      footer: false
    });

    // === COMPUTED VALUES ===
    const hasSidebar = variant === "sidebar" || sidebar;
    const isFullscreen = variant === "fullscreen";
    const isCompact = variant === "compact";
    const showGlobalLoading = loading || authLoading;

    // === EFFECTS ===
    useEffect(() => {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }, []);

    // Close sidebar on route change
    useEffect(() => {
      setSidebarOpen(false);
    }, [location.pathname]);

    // === HANDLERS ===
    const handleRetry = () => {
      if (onRetry) {
        onRetry();
      } else {
        window.location.reload();
      }
    };

    const updateLoadingState = (section: keyof LoadingStates, loading: boolean) => {
      setLoadingStates(prev => ({ ...prev, [section]: loading }));
    };

    // === RENDER HELPERS ===
    const renderConnectionStatus = () => {
      if (isOnline) return null;

      return (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2 text-sm">
            <WifiOff className="h-4 w-4" />
            <span>Connessione assente. Alcune funzionalità potrebbero non essere disponibili.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="ml-2 h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Riprova
            </Button>
          </div>
        </div>
      );
    };

    const renderGlobalError = () => {
      if (!error) return null;

      return (
        <div className="bg-destructive/10 border-destructive/20 border-l-4 border-l-destructive p-4 m-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-destructive">Si è verificato un errore</h4>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="mt-3"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Riprova
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    };

    const renderGlobalLoading = () => {
      if (!showGlobalLoading) return null;

      return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Spinner size="lg" variant="agricultural" />
            <div>
              <h3 className="font-medium">Caricamento AgriAI</h3>
              <p className="text-sm text-muted-foreground">Preparazione dell'ambiente agricolo...</p>
            </div>
          </div>
        </div>
      );
    };

    const renderHeader = () => {
      if (isFullscreen) return null;
      
      if (header) return header;

      return (
        <Header
          {...getHeaderConfig(variant === "sidebar" ? "dashboard" : "app")}
          sticky={!isCompact}
          className={cn(
            loadingStates.header && "opacity-50",
            isCompact && "py-2"
          )}
          onSearch={(query) => {
            console.log('Global search:', query);
          }}
        />
      );
    };

    const renderNavigation = () => {
      if (isFullscreen || variant === "sidebar") return null;
      
      if (navigation) return navigation;

      return (
        <Navigation
          {...getNavigationConfig("main")}
          showBreadcrumb={showBreadcrumb}
          className={cn(
            "border-b",
            loadingStates.navigation && "opacity-50"
          )}
        />
      );
    };

    const renderSidebar = () => {
      if (!hasSidebar) return null;

      const sidebarContent = sidebar || (
        <Navigation
          {...getNavigationConfig("sidebar")}
          className="h-full"
        />
      );

      // Mobile sidebar
      if (sidebarOpen) {
        return (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Menu Navigazione</SheetTitle>
                <SheetDescription>
                  Accedi a tutte le funzionalità di AgriAI
                </SheetDescription>
              </SheetHeader>
              <div className="h-full overflow-auto">
                {sidebarContent}
              </div>
            </SheetContent>
          </Sheet>
        );
      }

      // Desktop sidebar
      return (
        <aside className={cn(
          "hidden lg:flex w-64 border-r bg-background flex-col",
          loadingStates.sidebar && "opacity-50"
        )}>
          {sidebarContent}
        </aside>
      );
    };

    const renderMainContent = () => {
      return (
        <main
          className={cn(
            "flex-1 overflow-auto",
            loadingStates.content && "opacity-50",
            hasSidebar && "lg:ml-0",
            isCompact && "py-2"
          )}
        >
          {/* Mobile menu button for sidebar */}
          {hasSidebar && (
            <div className="lg:hidden p-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="gap-2"
              >
                <Menu className="h-4 w-4" />
                Menu
              </Button>
            </div>
          )}

          {/* Content */}
          <div className={cn(
            !isFullscreen && !isCompact && "container mx-auto",
            !isFullscreen && !isCompact && "py-6",
            isCompact && "p-4"
          )}>
            {children}
          </div>
        </main>
      );
    };

    const renderFooter = () => {
      if (isFullscreen) return null;
      
      if (footer) return footer;

      return (
        <Footer
          {...getFooterConfig(isCompact ? "embedded" : "app")}
          className={cn(
            loadingStates.footer && "opacity-50"
          )}
        />
      );
    };

    // === RENDER ===
    return (
      <div
        ref={ref}
        className={cn(
          "min-h-screen flex flex-col bg-background text-foreground",
          resolvedTheme === "dark" && "dark",
          className
        )}
        {...props}
      >
        {/* Global Loading Overlay */}
        {renderGlobalLoading()}

        {/* Connection Status */}
        {renderConnectionStatus()}

        {/* Global Error */}
        {renderGlobalError()}

        {/* Header */}
        {renderHeader()}

        {/* Navigation */}
        {renderNavigation()}

        {/* Main Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {renderSidebar()}

          {/* Main Content */}
          {renderMainContent()}
        </div>

        {/* Footer */}
        {renderFooter()}

        {/* Global Components */}
        <Toaster />
        <Sonner />

        {/* Development tools */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 z-40">
            <div className="bg-muted border rounded-lg p-2 text-xs space-y-1">
              <div>Theme: {resolvedTheme}</div>
              <div>User: {user?.name || 'Anonymous'}</div>
              <div>Route: {location.pathname}</div>
              <div className="flex items-center gap-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isOnline ? "bg-success" : "bg-destructive"
                )} />
                {isOnline ? "Online" : "Offline"}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

AppLayout.displayName = "AppLayout";

// === LAYOUT VARIANTS ===

export const SidebarLayout = React.forwardRef<HTMLDivElement, Omit<AppLayoutProps, 'variant'>>(
  (props, ref) => {
    return <AppLayout {...props} ref={ref} variant="sidebar" />;
  }
);

SidebarLayout.displayName = "SidebarLayout";

export const FullscreenLayout = React.forwardRef<HTMLDivElement, Omit<AppLayoutProps, 'variant'>>(
  (props, ref) => {
    return <AppLayout {...props} ref={ref} variant="fullscreen" />;
  }
);

FullscreenLayout.displayName = "FullscreenLayout";

export const CompactLayout = React.forwardRef<HTMLDivElement, Omit<AppLayoutProps, 'variant'>>(
  (props, ref) => {
    return <AppLayout {...props} ref={ref} variant="compact" />;
  }
);

CompactLayout.displayName = "CompactLayout";

// === EXPORTS ===
export default AppLayout;