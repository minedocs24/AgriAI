/**
 * Modern Header Component per AgriAI
 * Header moderno con backdrop blur, search integration, notification system e microinterazioni
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface ModernHeaderProps {
  className?: string;
  variant?: 'default' | 'transparent' | 'glass';
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  showThemeToggle?: boolean;
  onMenuClick?: () => void;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onUserMenuClick?: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  className,
  variant = 'default',
  showSearch = true,
  showNotifications = true,
  showUserMenu = true,
  showThemeToggle = true,
  onMenuClick,
  onSearch,
  onNotificationClick,
  onUserMenuClick,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [showUserMenuPanel, setShowUserMenuPanel] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Nuovo documento caricato',
      message: 'Il documento "PAC_2024.pdf" è stato processato con successo',
      type: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minuti fa
      read: false,
    },
    {
      id: '2',
      title: 'Aggiornamento sistema',
      message: 'Il sistema è stato aggiornato alla versione 2.1.0',
      type: 'info',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 ore fa
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Gestione scroll per backdrop blur
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Gestione click outside per chiudere i panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.header-notifications') && !target.closest('.header-user-menu')) {
        setShowNotificationsPanel(false);
        setShowUserMenuPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gestione search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setSearchQuery('');
      setShowSearchBar(false);
    }
  };

  // Gestione notifiche
  const handleNotificationClick = (notification: Notification) => {
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  // Gestione logout
  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenuPanel(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Varianti header
  const headerVariants = {
    default: 'bg-background/95 backdrop-blur-sm border-b border-border/50',
    transparent: 'bg-transparent',
    glass: 'bg-background/80 backdrop-blur-md border-b border-border/30',
  };

  // Classi dinamiche
  const headerClasses = cn(
    'sticky top-0 z-header transition-all duration-300',
    headerVariants[variant],
    isScrolled && 'shadow-sm',
    className
  );

  return (
    <header className={headerClasses}>
      <div className="container-responsive">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Brand */}
          <div className="flex items-center space-x-4">
            {onMenuClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-brand-primary-500 to-brand-primary-600 rounded-xl shadow-agricultural">
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-brand-primary-600 font-bold text-sm">A</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-foreground">AgriAI</h1>
                <p className="text-xs text-muted-foreground">Il tuo assistente agricolo</p>
              </div>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          {showSearch && !isMobile && (
            <div className="flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cerca documenti, norme, consigli..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-ring"
                />
              </form>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button - Mobile */}
            {showSearch && isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearchBar(!showSearchBar)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Theme Toggle */}
            {showThemeToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="relative"
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
            )}

            {/* Connection Status */}
            <div className="hidden sm:flex items-center space-x-1 text-muted-foreground">
              <Wifi className="h-4 w-4" />
              <span className="text-xs">Online</span>
            </div>

            {/* Notifications */}
            {showNotifications && isAuthenticated && (
              <div className="relative header-notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>

                {/* Notifications Panel */}
                {showNotificationsPanel && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg z-dropdown animate-fade-in">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold">Notifiche</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          Nessuna notifica
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              'p-4 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors',
                              !notification.read && 'bg-muted/30'
                            )}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={cn(
                                'w-2 h-2 rounded-full mt-2',
                                notification.type === 'success' && 'bg-success',
                                notification.type === 'warning' && 'bg-warning',
                                notification.type === 'error' && 'bg-destructive',
                                notification.type === 'info' && 'bg-info'
                              )} />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{notification.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {notification.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu */}
            {showUserMenu && isAuthenticated && user && (
              <div className="relative header-user-menu">
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 h-10 px-3"
                  onClick={() => setShowUserMenuPanel(!showUserMenuPanel)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} alt={user.firstName} />
                    <AvatarFallback className="text-xs">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium">
                    {user.firstName}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {/* User Menu Panel */}
                {showUserMenuPanel && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg z-dropdown animate-fade-in">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} alt={user.firstName} />
                          <AvatarFallback>
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setShowUserMenuPanel(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profilo
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setShowUserMenuPanel(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Impostazioni
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Login Button */}
            {showUserMenu && !isAuthenticated && (
              <Button variant="outline" size="sm">
                Accedi
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar - Mobile */}
        {showSearch && isMobile && showSearchBar && (
          <div className="pb-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cerca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowSearchBar(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}; 