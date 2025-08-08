/**
 * Modern Sidebar Component per AgriAI
 * Sidebar moderna con navigation avanzata, role-based access e microinterazioni
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Home,
  MessageSquare,
  FileText,
  Settings,
  Users,
  BarChart3,
  Database,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Leaf,
  Droplets,
  Thermometer,
  Sun
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
  roles?: string[];
  children?: NavigationItem[];
  external?: boolean;
}

interface ModernSidebarProps {
  className?: string;
  variant?: 'default' | 'compact' | 'floating';
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  showUserSection?: boolean;
  showQuickActions?: boolean;
  onItemClick?: (item: NavigationItem) => void;
}

export const ModernSidebar: React.FC<ModernSidebarProps> = ({
  className,
  variant = 'default',
  collapsed = false,
  onCollapseChange,
  showUserSection = true,
  showQuickActions = true,
  onItemClick,
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const [isHovered, setIsHovered] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Navigation items con role-based access
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      href: '/dashboard',
      roles: ['PUBLIC', 'MEMBER', 'ADMIN'],
    },
    {
      id: 'chat',
      label: 'Chat AI',
      icon: <MessageSquare className="h-5 w-5" />,
      href: '/chat',
      badge: 'Nuovo',
      roles: ['PUBLIC', 'MEMBER', 'ADMIN'],
    },
    {
      id: 'documents',
      label: 'Documenti',
      icon: <FileText className="h-5 w-5" />,
      href: '/documents',
      roles: ['MEMBER', 'ADMIN'],
      children: [
        {
          id: 'documents-upload',
          label: 'Carica Documento',
          icon: <Plus className="h-4 w-4" />,
          href: '/documents/upload',
          roles: ['MEMBER', 'ADMIN'],
        },
        {
          id: 'documents-library',
          label: 'Libreria',
          icon: <Database className="h-4 w-4" />,
          href: '/documents/library',
          roles: ['MEMBER', 'ADMIN'],
        },
      ],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/analytics',
      roles: ['ADMIN'],
    },
    {
      id: 'users',
      label: 'Utenti',
      icon: <Users className="h-5 w-5" />,
      href: '/users',
      roles: ['ADMIN'],
    },
    {
      id: 'settings',
      label: 'Impostazioni',
      icon: <Settings className="h-5 w-5" />,
      href: '/settings',
      roles: ['MEMBER', 'ADMIN'],
    },
    {
      id: 'help',
      label: 'Aiuto',
      icon: <HelpCircle className="h-5 w-5" />,
      href: '/help',
      external: true,
      roles: ['PUBLIC', 'MEMBER', 'ADMIN'],
    },
  ];

  // Quick actions per agricoltori
  const quickActions = [
    {
      id: 'weather',
      label: 'Meteo',
      icon: <Sun className="h-4 w-4" />,
      href: '/weather',
      color: 'text-weather',
    },
    {
      id: 'soil',
      label: 'Suolo',
      icon: <MapPin className="h-4 w-4" />,
      href: '/soil',
      color: 'text-soil',
    },
    {
      id: 'irrigation',
      label: 'Irrigazione',
      icon: <Droplets className="h-4 w-4" />,
      href: '/irrigation',
      color: 'text-info',
    },
    {
      id: 'temperature',
      label: 'Temperatura',
      icon: <Thermometer className="h-4 w-4" />,
      href: '/temperature',
      color: 'text-warning',
    },
  ];

  // Filtra items per ruolo utente
  const filteredItems = navigationItems.filter(item => {
    if (!item.roles) return true;
    if (!user) return item.roles.includes('PUBLIC');
    return item.roles.includes(user.role);
  });

  // Gestione hover per auto-expand
  useEffect(() => {
    if (collapsed && isHovered) {
      // Auto-expand su hover quando collapsed
    }
  }, [collapsed, isHovered]);

  // Gestione click item
  const handleItemClick = (item: NavigationItem) => {
    if (item.children) {
      setExpandedItems(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    }
    
    if (onItemClick) {
      onItemClick(item);
    }
  };

  // Gestione toggle collapse
  const handleToggleCollapse = () => {
    if (onCollapseChange) {
      onCollapseChange(!collapsed);
    }
  };

  // Verifica se item è attivo
  const isItemActive = (item: NavigationItem) => {
    return location.pathname === item.href || 
           location.pathname.startsWith(item.href + '/');
  };

  // Verifica se item ha figli attivi
  const hasActiveChild = (item: NavigationItem) => {
    if (!item.children) return false;
    return item.children.some(child => isItemActive(child));
  };

  // Varianti sidebar
  const sidebarVariants = {
    default: 'bg-sidebar border-r border-sidebar-border',
    compact: 'bg-sidebar border-r border-sidebar-border',
    floating: 'bg-sidebar/95 backdrop-blur-sm border border-border shadow-xl',
  };

  // Classi dinamiche
  const sidebarClasses = cn(
    'flex flex-col transition-all duration-300',
    sidebarVariants[variant],
    collapsed ? 'w-16' : 'w-64',
    variant === 'floating' && 'rounded-r-xl',
    className
  );

  return (
    <aside 
      className={sidebarClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-brand-primary-500 to-brand-primary-600 rounded-xl">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                <span className="text-brand-primary-600 font-bold text-sm">A</span>
              </div>
            </div>
            <div>
              <h2 className="font-bold text-sidebar-foreground">AgriAI</h2>
              <p className="text-xs text-sidebar-accent-foreground">Dashboard</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className="shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Section */}
      {showUserSection && isAuthenticated && user && (
        <div className="p-4 border-b border-sidebar-border">
          <div className={cn(
            "flex items-center space-x-3",
            collapsed && "justify-center"
          )}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.firstName} />
              <AvatarFallback className="text-xs">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-sidebar-accent-foreground truncate">
                  {user.role}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {showQuickActions && !collapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <h3 className="text-xs font-medium text-sidebar-accent-foreground mb-3 uppercase tracking-wider">
            Azioni Rapide
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                className="h-8 justify-start text-xs"
                asChild
              >
                <Link to={action.href}>
                  <action.icon className={cn("h-3 w-3 mr-2", action.color)} />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = isItemActive(item);
          const hasActiveChildren = hasActiveChild(item);
          const isExpanded = expandedItems.includes(item.id);

          return (
            <div key={item.id}>
              {/* Main Item */}
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10",
                  collapsed && "justify-center px-2",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
                  hasActiveChildren && !isActive && "bg-sidebar-accent/50"
                )}
                onClick={() => handleItemClick(item)}
                asChild={!item.children}
              >
                {item.children ? (
                  <div className="flex items-center w-full">
                    {item.icon}
                    {!collapsed && (
                      <>
                        <span className="ml-3 flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight 
                          className={cn(
                            "h-4 w-4 ml-2 transition-transform",
                            isExpanded && "rotate-90"
                          )} 
                        />
                      </>
                    )}
                  </div>
                ) : (
                  <Link to={item.href} className="flex items-center w-full">
                    {item.icon}
                    {!collapsed && (
                      <>
                        <span className="ml-3 flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                        {item.external && (
                          <ExternalLink className="h-3 w-3 ml-2" />
                        )}
                      </>
                    )}
                  </Link>
                )}
              </Button>

              {/* Children */}
              {item.children && isExpanded && !collapsed && (
                <div className="ml-6 mt-2 space-y-1">
                  {item.children
                    .filter(child => !child.roles || (user && child.roles.includes(user.role)))
                    .map((child) => {
                      const isChildActive = isItemActive(child);
                      
                      return (
                        <Button
                          key={child.id}
                          variant={isChildActive ? "secondary" : "ghost"}
                          size="sm"
                          className={cn(
                            "w-full justify-start h-8 text-sm",
                            isChildActive && "bg-sidebar-primary/50 text-sidebar-primary-foreground"
                          )}
                          asChild
                        >
                          <Link to={child.href}>
                            {child.icon}
                            <span className="ml-2">{child.label}</span>
                            {child.badge && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {child.badge}
                              </Badge>
                            )}
                          </Link>
                        </Button>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="text-xs text-sidebar-accent-foreground text-center">
            <p>AgriAI v2.1.0</p>
            <p className="mt-1">© 2024 AgriAI</p>
          </div>
        )}
      </div>
    </aside>
  );
}; 