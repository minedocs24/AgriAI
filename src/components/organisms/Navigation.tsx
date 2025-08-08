/**
 * Navigation Organism per AgriAI
 * Componente di navigazione principale con role-based access control
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  MessageSquare,
  FileText,
  Settings,
  Users,
  BarChart3,
  Shield,
  Sprout,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  Building,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// === TYPES ===
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
  requiredRole?: 'PUBLIC' | 'MEMBER' | 'ADMIN';
  children?: NavigationItem[];
  external?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface NavigationProps {
  /** Items di navigazione */
  items?: NavigationItem[];
  /** Variante del layout */
  variant?: "horizontal" | "vertical" | "sidebar";
  /** Mostra breadcrumb */
  showBreadcrumb?: boolean;
  /** Breadcrumb items personalizzati */
  breadcrumbItems?: BreadcrumbItem[];
  /** Collassabile su mobile */
  collapsible?: boolean;
  /** CSS classes aggiuntive */
  className?: string;
  /** Callback per cambio route */
  onNavigate?: (href: string) => void;
  /** Mostra user menu */
  showUserMenu?: boolean;
  /** Posizione user menu */
  userMenuPosition?: "start" | "end";
}

// === DEFAULT NAVIGATION ITEMS ===
const defaultNavigationItems: NavigationItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: Home,
    description: "Pagina principale"
  },
  {
    id: "chat",
    label: "Chat AgriAI",
    href: "/chat",
    icon: MessageSquare,
    description: "Assistente agricolo intelligente",
    requiredRole: "PUBLIC"
  },
  {
    id: "documents",
    label: "Documenti",
    href: "/backend",
    icon: FileText,
    description: "Gestione documenti agricoli",
    requiredRole: "MEMBER",
    children: [
      {
        id: "documents-library",
        label: "Biblioteca",
        href: "/backend?tab=documents",
        description: "Sfoglia documenti"
      },
      {
        id: "documents-upload",
        label: "Carica",
        href: "/backend?tab=documents&action=upload",
        description: "Aggiungi nuovi documenti"
      }
    ]
  },
  {
    id: "management",
    label: "Gestione",
    href: "/backend",
    icon: Settings,
    description: "Pannello di controllo",
    requiredRole: "MEMBER",
    children: [
      {
        id: "management-users",
        label: "Utenti",
        href: "/backend?tab=users",
        icon: Users,
        description: "Gestione utenti",
        requiredRole: "ADMIN"
      },
      {
        id: "management-dashboard",
        label: "Dashboard",
        href: "/backend?tab=dashboard",
        icon: BarChart3,
        description: "Statistiche e metriche"
      },
      {
        id: "management-config",
        label: "Configurazioni",
        href: "/backend?tab=config",
        icon: Shield,
        description: "Impostazioni sistema",
        requiredRole: "ADMIN"
      }
    ]
  },
  {
    id: "help",
    label: "Aiuto",
    href: "https://agriai.help",
    icon: HelpCircle,
    description: "Documentazione e supporto",
    external: true
  }
];

// === NAVIGATION ORGANISM ===
export const Navigation = React.forwardRef<HTMLElement, NavigationProps>(
  ({
    items = defaultNavigationItems,
    variant = "horizontal",
    showBreadcrumb = true,
    breadcrumbItems,
    collapsible = true,
    className,
    onNavigate,
    showUserMenu = true,
    userMenuPosition = "end",
    ...props
  }, ref) => {
    // === HOOKS ===
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, hasRole, logout } = useAuth();
    
    // === STATE ===
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

    // === COMPUTED VALUES ===
    const filteredItems = React.useMemo(() => {
      return items.filter(item => {
        if (!item.requiredRole) return true;
        return isAuthenticated && hasRole(item.requiredRole);
      });
    }, [items, isAuthenticated, hasRole]);

    const currentBreadcrumbs = React.useMemo(() => {
      if (breadcrumbItems) return breadcrumbItems;
      
      // Generate breadcrumbs from current location
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const breadcrumbs: BreadcrumbItem[] = [
        { label: "Home", href: "/", icon: Home }
      ];

      let currentPath = "";
      for (const segment of pathSegments) {
        currentPath += `/${segment}`;
        
        // Find matching navigation item
        const findItemByPath = (items: NavigationItem[]): NavigationItem | null => {
          for (const item of items) {
            if (item.href === currentPath) return item;
            if (item.children) {
              const found = findItemByPath(item.children);
              if (found) return found;
            }
          }
          return null;
        };

        const matchedItem = findItemByPath(filteredItems);
        if (matchedItem) {
          breadcrumbs.push({
            label: matchedItem.label,
            href: currentPath,
            icon: matchedItem.icon
          });
        } else {
          // Fallback for unknown paths
          breadcrumbs.push({
            label: segment.charAt(0).toUpperCase() + segment.slice(1),
            href: currentPath
          });
        }
      }

      return breadcrumbs;
    }, [location.pathname, breadcrumbItems, filteredItems]);

    // === HANDLERS ===
    const handleNavigate = (href: string, external?: boolean) => {
      if (external) {
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }

      if (onNavigate) {
        onNavigate(href);
      } else {
        navigate(href);
      }
      setMobileMenuOpen(false);
    };

    const handleLogout = async () => {
      try {
        await logout();
        navigate('/');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    };

    const toggleExpandedMenu = (itemId: string) => {
      setExpandedMenus(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    };

    const isActiveRoute = (href: string) => {
      return location.pathname === href || 
             (href !== '/' && location.pathname.startsWith(href));
    };

    // === RENDER HELPERS ===
    const renderNavigationItem = (item: NavigationItem, mobile: boolean = false) => {
      const hasChildren = item.children && item.children.length > 0;
      const isActive = isActiveRoute(item.href);
      const isExpanded = expandedMenus.includes(item.id);
      const Icon = item.icon;

      if (mobile) {
        return (
          <div key={item.id} className="space-y-1">
            <Button
              variant={isActive ? "agricultural" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-12",
                hasChildren && "pr-2"
              )}
              onClick={hasChildren ? 
                () => toggleExpandedMenu(item.id) : 
                () => handleNavigate(item.href, item.external)
              }
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge variant="outline" size="sm">
                  {item.badge}
                </Badge>
              )}
              {hasChildren && (
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-90"
                )} />
              )}
              {item.external && <ExternalLink className="h-3 w-3" />}
            </Button>

            {/* Children for mobile */}
            {hasChildren && isExpanded && (
              <div className="ml-6 space-y-1">
                {item.children!.filter(child => 
                  !child.requiredRole || hasRole(child.requiredRole)
                ).map(child => (
                  <Button
                    key={child.id}
                    variant={isActiveRoute(child.href) ? "earth" : "ghost"}
                    size="sm"
                    className="w-full justify-start gap-2 h-10"
                    onClick={() => handleNavigate(child.href, child.external)}
                  >
                    {child.icon && <child.icon className="h-4 w-4" />}
                    {child.label}
                    {child.external && <ExternalLink className="h-3 w-3 ml-auto" />}
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      }

      // Desktop navigation item
      if (hasChildren) {
        return (
          <NavigationMenuItem key={item.id}>
            <NavigationMenuTrigger 
              className={cn(
                "gap-2",
                isActive && "bg-agricultural text-agricultural-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.label}
              {item.badge && (
                <Badge variant="outline" size="xs">
                  {item.badge}
                </Badge>
              )}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid gap-3 p-4 w-80">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium leading-none">{item.label}</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <div className="grid gap-2">
                  {item.children!.filter(child => 
                    !child.requiredRole || hasRole(child.requiredRole)
                  ).map(child => (
                    <NavigationMenuLink key={child.id} asChild>
                      <Button
                        variant="ghost"
                        className="justify-start gap-2 h-auto p-3"
                        onClick={() => handleNavigate(child.href, child.external)}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-2">
                            {child.icon && <child.icon className="h-4 w-4" />}
                            <span className="font-medium">{child.label}</span>
                            {child.external && <ExternalLink className="h-3 w-3" />}
                          </div>
                          {child.description && (
                            <span className="text-xs text-muted-foreground">
                              {child.description}
                            </span>
                          )}
                        </div>
                      </Button>
                    </NavigationMenuLink>
                  ))}
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        );
      }

      return (
        <NavigationMenuItem key={item.id}>
          <NavigationMenuLink asChild>
            <Button
              variant={isActive ? "agricultural" : "ghost"}
              className="gap-2"
              onClick={() => handleNavigate(item.href, item.external)}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.label}
              {item.badge && (
                <Badge variant="outline" size="xs">
                  {item.badge}
                </Badge>
              )}
              {item.external && <ExternalLink className="h-3 w-3" />}
            </Button>
          </NavigationMenuLink>
        </NavigationMenuItem>
      );
    };

    const renderUserMenu = () => {
      if (!showUserMenu) return null;

      if (!isAuthenticated) {
        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/login')}
            >
              Accedi
            </Button>
            <Button 
              variant="agricultural" 
              size="sm"
              onClick={() => navigate('/register')}
            >
              Registrati
            </Button>
          </div>
        );
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 h-auto px-2">
              <Avatar size="sm">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback type="user">
                  {user?.name?.slice(0, 2).toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground">
                  {user?.userType === 'ADMIN' ? 'Amministratore' :
                   user?.userType === 'MEMBER' ? 'Membro' : 'Pubblico'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="h-4 w-4 mr-2" />
              Profilo
            </DropdownMenuItem>
            
            {hasRole('MEMBER') && (
              <DropdownMenuItem onClick={() => navigate('/backend')}>
                <Building className="h-4 w-4 mr-2" />
                Backend
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Impostazioni
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Disconnetti
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    };

    const renderBreadcrumb = () => {
      if (!showBreadcrumb || currentBreadcrumbs.length <= 1) return null;

      return (
        <div className="border-b bg-muted/30 px-4 py-2">
          <div className="container mx-auto">
            <Breadcrumb>
              <BreadcrumbList>
                {currentBreadcrumbs.map((item, index) => {
                  const isLast = index === currentBreadcrumbs.length - 1;
                  const Icon = item.icon;

                  return (
                    <React.Fragment key={index}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage className="flex items-center gap-1">
                            {Icon && <Icon className="h-3 w-3" />}
                            {item.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink 
                            href={item.href}
                            className="flex items-center gap-1"
                            onClick={item.href ? 
                              (e) => {
                                e.preventDefault();
                                handleNavigate(item.href!);
                              } : undefined
                            }
                          >
                            {Icon && <Icon className="h-3 w-3" />}
                            {item.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      );
    };

    // === RENDER ===
    if (variant === "vertical" || variant === "sidebar") {
      return (
        <nav
          ref={ref}
          className={cn(
            "flex flex-col space-y-2 p-4",
            variant === "sidebar" && "bg-sidebar text-sidebar-foreground border-r",
            className
          )}
          {...props}
        >
          {filteredItems.map(item => renderNavigationItem(item, true))}
          
          {showUserMenu && (
            <div className="mt-auto pt-4 border-t">
              {renderUserMenu()}
            </div>
          )}
        </nav>
      );
    }

    return (
      <div className={cn("w-full", className)}>
        <nav
          ref={ref}
          className="flex items-center justify-between px-4 py-2"
          {...props}
        >
          {/* Logo/Brand */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="gap-2 hover:bg-transparent"
              onClick={() => handleNavigate('/')}
            >
              <Sprout className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">AgriAI</span>
            </Button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <NavigationMenu>
              <NavigationMenuList>
                {filteredItems.map(item => renderNavigationItem(item))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex">
            {userMenuPosition === "end" && renderUserMenu()}
          </div>

          {/* Mobile Menu */}
          {collapsible && (
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Sprout className="h-5 w-5 text-primary" />
                      Menu Navigazione
                    </SheetTitle>
                    <SheetDescription>
                      Esplora tutte le funzionalità di AgriAI
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="mt-6 space-y-4">
                    {/* User info */}
                    {isAuthenticated && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            <AvatarImage src={user?.avatar} alt={user?.name} />
                            <AvatarFallback type="user">
                              {user?.name?.slice(0, 2).toUpperCase() || <User className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user?.name}</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation items */}
                    <div className="space-y-2">
                      {filteredItems.map(item => renderNavigationItem(item, true))}
                    </div>

                    {/* User menu items for mobile */}
                    {isAuthenticated && (
                      <div className="space-y-2 pt-4 border-t">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3"
                          onClick={() => {
                            navigate('/profile');
                            setMobileMenuOpen(false);
                          }}
                        >
                          <User className="h-4 w-4" />
                          Profilo
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3"
                          onClick={() => {
                            navigate('/settings');
                            setMobileMenuOpen(false);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                          Impostazioni
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 text-destructive"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4" />
                          Disconnetti
                        </Button>
                      </div>
                    )}

                    {/* Login buttons for non-authenticated users */}
                    {!isAuthenticated && (
                      <div className="space-y-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            navigate('/login');
                            setMobileMenuOpen(false);
                          }}
                        >
                          Accedi
                        </Button>
                        <Button
                          variant="agricultural"
                          className="w-full"
                          onClick={() => {
                            navigate('/register');
                            setMobileMenuOpen(false);
                          }}
                        >
                          Registrati
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </nav>

        {/* Breadcrumb */}
        {renderBreadcrumb()}
      </div>
    );
  }
);

Navigation.displayName = "Navigation";

// === EXPORTS ===
export default Navigation;
export type { NavigationItem, BreadcrumbItem };