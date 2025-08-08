/**
 * Header Organism per AgriAI
 * Componente header principale con logo, navigazione, notifiche e controlli utente
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  Sprout,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Computer,
  Settings,
  MoreHorizontal,
  Zap,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge, NotificationBadge } from "@/components/ui/badge";
import { SearchInput, SearchSuggestion } from "@/components/molecules/SearchInput";
import { ThemeToggle, ThemeStatus } from "@/components/ui/theme-toggle";
import { Navigation, NavigationItem } from "./Navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// === TYPES ===
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  category?: "system" | "chat" | "documents" | "users";
}

export interface HeaderProps {
  /** Variante del layout */
  variant?: "default" | "compact" | "floating";
  /** Mostra search bar */
  showSearch?: boolean;
  /** Mostra notifications */
  showNotifications?: boolean;
  /** Mostra theme toggle */
  showThemeToggle?: boolean;
  /** Mostra connection status */
  showConnectionStatus?: boolean;
  /** Items di navigazione personalizzati */
  navigationItems?: NavigationItem[];
  /** Notifiche attive */
  notifications?: Notification[];
  /** Suggestions per la ricerca */
  searchSuggestions?: SearchSuggestion[];
  /** Logo personalizzato */
  logo?: React.ReactNode;
  /** Sticky behavior */
  sticky?: boolean;
  /** CSS classes aggiuntive */
  className?: string;
  /** Callback per ricerca */
  onSearch?: (query: string) => void;
  /** Callback per notification click */
  onNotificationClick?: (notification: Notification) => void;
  /** Callback per mark all read */
  onMarkAllRead?: () => void;
}

// === DEFAULT SEARCH SUGGESTIONS ===
const defaultSearchSuggestions: SearchSuggestion[] = [
  {
    id: "pac-2023",
    text: "Regolamento PAC 2023",
    category: "Normativa",
    metadata: {
      description: "Politica Agricola Comune 2023-2027"
    }
  },
  {
    id: "bio-cert",
    text: "Certificazione BIO",
    category: "Certificazioni",
    metadata: {
      description: "Procedura certificazione biologica"
    }
  },
  {
    id: "pnrr-agrisolare",
    text: "PNRR Agrisolare",
    category: "Finanziamenti",
    metadata: {
      description: "Bando fotovoltaico agricolo"
    }
  },
  {
    id: "smart-farming",
    text: "Smart Farming IoT",
    category: "Tecnologia",
    metadata: {
      description: "Soluzioni digitali agricole"
    }
  }
];

// === MOCK NOTIFICATIONS ===
const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    title: "Nuovo documento caricato",
    message: "È stato aggiunto il regolamento PAC 2024",
    type: "info",
    timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    read: false,
    category: "documents",
    actionUrl: "/backend?tab=documents"
  },
  {
    id: "notif-2",
    title: "Chat completata",
    message: "La conversazione con AgriAI è stata elaborata",
    type: "success",
    timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    read: false,
    category: "chat"
  },
  {
    id: "notif-3",
    title: "Manutenzione programmata",
    message: "Sistema offline dalle 2:00 alle 4:00",
    type: "warning",
    timestamp: new Date(Date.now() - 60 * 60000), // 1 hour ago
    read: true,
    category: "system"
  }
];

// === HEADER ORGANISM ===
export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({
    variant = "default",
    showSearch = true,
    showNotifications = true,
    showThemeToggle = true,
    showConnectionStatus = true,
    navigationItems,
    notifications = mockNotifications,
    searchSuggestions = defaultSearchSuggestions,
    logo,
    sticky = true,
    className,
    onSearch,
    onNotificationClick,
    onMarkAllRead,
    ...props
  }, ref) => {
    // === HOOKS ===
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { theme, resolvedTheme } = useTheme();
    
    // === STATE ===
    const [searchQuery, setSearchQuery] = useState("");
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    // === COMPUTED VALUES ===
    const unreadNotifications = notifications.filter(n => !n.read);
    const isCompact = variant === "compact";
    const isFloating = variant === "floating";

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

    // === HANDLERS ===
    const handleSearch = (query: string) => {
      if (onSearch) {
        onSearch(query);
      } else {
        // Default search behavior - navigate to search results
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
    };

    const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
      setSearchQuery(suggestion.text);
      handleSearch(suggestion.text);
    };

    const handleNotificationClick = (notification: Notification) => {
      if (onNotificationClick) {
        onNotificationClick(notification);
      } else if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
      setNotificationsOpen(false);
    };

    const handleMarkAllRead = () => {
      if (onMarkAllRead) {
        onMarkAllRead();
      }
      setNotificationsOpen(false);
    };

    // === RENDER HELPERS ===
    const renderLogo = () => {
      if (logo) return logo;

      return (
        <Button
          variant="ghost"
          className="gap-3 hover:bg-transparent px-2"
          onClick={() => navigate('/')}
        >
          <div className="p-1.5 bg-gradient-to-r from-growth to-harvest rounded-lg">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          {!isCompact && (
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-foreground">AgriAI</h1>
              <p className="text-xs text-muted-foreground -mt-1">
                Assistente Agricolo
              </p>
            </div>
          )}
        </Button>
      );
    };

    const renderSearch = () => {
      if (!showSearch) return null;

      return (
        <div className={cn(
          "flex-1 max-w-md mx-4",
          isCompact && "max-w-sm"
        )}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearch}
            onSuggestionSelect={handleSuggestionSelect}
            placeholder="Cerca documenti, normative, guide..."
            suggestions={searchSuggestions}
            variant="agricultural"
            size={isCompact ? "sm" : "default"}
            maxSuggestions={6}
            showCategories={true}
            searchDelay={300}
            clearable={true}
          />
        </div>
      );
    };

    const renderConnectionStatus = () => {
      if (!showConnectionStatus) return null;

      return (
        <div className="hidden lg:flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1 text-success">
              <Wifi className="h-4 w-4" />
              <span className="text-xs">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-destructive">
              <WifiOff className="h-4 w-4" />
              <span className="text-xs">Offline</span>
            </div>
          )}
        </div>
      );
    };

    const renderNotifications = () => {
      if (!showNotifications || !isAuthenticated) return null;

      return (
        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadNotifications.length > 0 && (
                <NotificationBadge
                  count={unreadNotifications.length}
                  className="absolute -top-1 -right-1"
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Notifiche</h4>
                {unreadNotifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="text-xs"
                  >
                    Segna tutto come letto
                  </Button>
                )}
              </div>

              {/* Notifications list */}
              {notifications.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nessuna notifica</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        notification.read 
                          ? "bg-muted/50 border-transparent" 
                          : "bg-background border-border hover:bg-accent"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-1 rounded-full",
                          notification.type === "error" && "bg-destructive/10 text-destructive",
                          notification.type === "warning" && "bg-warning/10 text-warning",
                          notification.type === "success" && "bg-success/10 text-success",
                          notification.type === "info" && "bg-info/10 text-info"
                        )}>
                          {notification.category === "system" && <Settings className="h-3 w-3" />}
                          {notification.category === "documents" && <Shield className="h-3 w-3" />}
                          {notification.category === "chat" && <Zap className="h-3 w-3" />}
                          {!notification.category && <Bell className="h-3 w-3" />}
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium">
                              {notification.title}
                            </h5>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Intl.RelativeTimeFormat('it', { numeric: 'auto' })
                              .format(
                                Math.round((notification.timestamp.getTime() - Date.now()) / 60000),
                                'minute'
                              )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      navigate('/notifications');
                      setNotificationsOpen(false);
                    }}
                  >
                    Vedi tutte le notifiche
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      );
    };

    const renderActions = () => {
      return (
        <div className="flex items-center gap-2">
          {renderConnectionStatus()}
          {renderNotifications()}
          
          {showThemeToggle && (
            <ThemeToggle />
          )}

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Azioni rapide</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => navigate('/help')}>
                <span>Centro assistenza</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => navigate('/feedback')}>
                <span>Invia feedback</span>
              </DropdownMenuItem>
              
              {showThemeToggle && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Tema</DropdownMenuLabel>
                  <ThemeStatus />
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    };

    // === RENDER ===
    return (
      <header
        ref={ref}
        className={cn(
          "border-b bg-background/80 backdrop-blur-sm transition-all duration-200",
          sticky && "sticky top-0 z-50",
          isFloating && "mx-4 mt-4 rounded-lg border shadow-lg",
          isCompact && "py-2",
          !isCompact && "py-3",
          className
        )}
        {...props}
      >
        <div className={cn(
          "container mx-auto px-4",
          isFloating && "px-6"
        )}>
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              {renderLogo()}
            </div>

            {/* Search - Hidden on mobile when compact */}
            <div className={cn(
              "hidden md:flex flex-1",
              isCompact && "lg:flex"
            )}>
              {renderSearch()}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {renderActions()}
            </div>
          </div>

          {/* Mobile search - Show below on small screens */}
          {showSearch && (
            <div className={cn(
              "md:hidden mt-3 pb-1",
              isCompact && "lg:hidden"
            )}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
                onSuggestionSelect={handleSuggestionSelect}
                placeholder="Cerca..."
                suggestions={searchSuggestions}
                variant="agricultural"
                size="sm"
                maxSuggestions={4}
                showCategories={false}
                searchDelay={300}
                clearable={true}
              />
            </div>
          )}
        </div>

        {/* Navigation - Below header */}
        <Navigation
          items={navigationItems}
          variant="horizontal"
          showBreadcrumb={true}
          showUserMenu={true}
          userMenuPosition="end"
          className="border-t"
        />
      </header>
    );
  }
);

Header.displayName = "Header";

// === COMPACT HEADER VARIANT ===
export const CompactHeader = React.forwardRef<HTMLElement, Omit<HeaderProps, 'variant'>>(
  (props, ref) => {
    return <Header {...props} ref={ref} variant="compact" />;
  }
);

CompactHeader.displayName = "CompactHeader";

// === FLOATING HEADER VARIANT ===
export const FloatingHeader = React.forwardRef<HTMLElement, Omit<HeaderProps, 'variant'>>(
  (props, ref) => {
    return <Header {...props} ref={ref} variant="floating" />;
  }
);

FloatingHeader.displayName = "FloatingHeader";

// === EXPORTS ===
export default Header;
export type { Notification };