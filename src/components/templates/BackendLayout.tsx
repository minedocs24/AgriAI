/**
 * BackendLayout Template per AgriAI
 * Layout per pannello amministrativo con sidebar, navigation e content area
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  Shield,
  Database,
  Activity,
  Bell,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  User,
  Building,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SearchInput } from "@/components/molecules/SearchInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// === TYPES ===
export interface BackendLayoutProps {
  /** Contenuto principale */
  children: React.ReactNode;
  /** Titolo della pagina */
  title?: string;
  /** Descrizione della pagina */
  description?: string;
  /** Azioni nella header */
  actions?: React.ReactNode;
  /** Sidebar personalizzata */
  sidebar?: React.ReactNode;
  /** Breadcrumb personalizzati */
  breadcrumbs?: BreadcrumbItem[];
  /** Mostra sidebar */
  showSidebar?: boolean;
  /** Sidebar collassabile */
  collapsibleSidebar?: boolean;
  /** Permission level richiesto */
  requiredPermission?: "MEMBER" | "ADMIN";
  /** Loading state */
  loading?: boolean;
  /** CSS classes aggiuntive */
  className?: string;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  requiredRole?: "MEMBER" | "ADMIN";
  subItems?: NavigationItem[];
}

interface SystemMetric {
  id: string;
  label: string;
  value: string | number;
  status: "success" | "warning" | "error" | "info";
  trend?: "up" | "down" | "stable";
  icon: React.ComponentType<{ className?: string }>;
}

// === NAVIGATION ITEMS ===
const defaultNavigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/backend",
    icon: BarChart3,
    badge: "Live"
  },
  {
    id: "documents",
    label: "Documenti",
    href: "/backend?tab=documents",
    icon: FileText,
    subItems: [
      {
        id: "documents-list",
        label: "Biblioteca",
        href: "/backend?tab=documents",
        icon: Database
      },
      {
        id: "documents-upload",
        label: "Carica",
        href: "/backend?tab=documents&action=upload",
        icon: FileText
      }
    ]
  },
  {
    id: "chatbot",
    label: "Chatbot",
    href: "/backend?tab=chatbot",
    icon: MessageSquare,
    badge: 3
  },
  {
    id: "users",
    label: "Utenti",
    href: "/backend?tab=users",
    icon: Users,
    requiredRole: "ADMIN"
  },
  {
    id: "analytics",
    label: "Analytics",
    href: "/backend?tab=analytics",
    icon: Activity,
    subItems: [
      {
        id: "analytics-overview",
        label: "Panoramica",
        href: "/backend?tab=analytics&view=overview",
        icon: TrendingUp
      },
      {
        id: "analytics-reports",
        label: "Report",
        href: "/backend?tab=analytics&view=reports",
        icon: BarChart3
      }
    ]
  },
  {
    id: "config",
    label: "Configurazioni",
    href: "/backend?tab=config",
    icon: Settings,
    requiredRole: "ADMIN"
  }
];

// === SYSTEM METRICS ===
const systemMetrics: SystemMetric[] = [
  {
    id: "active-users",
    label: "Utenti Attivi",
    value: 1247,
    status: "success",
    trend: "up",
    icon: Users
  },
  {
    id: "documents",
    label: "Documenti",
    value: 3425,
    status: "info",
    trend: "up",
    icon: FileText
  },
  {
    id: "ai-queries",
    label: "Query AI",
    value: "12.5K",
    status: "success",
    trend: "up",
    icon: Zap
  },
  {
    id: "system-health",
    label: "Stato Sistema",
    value: "99.9%",
    status: "success",
    trend: "stable",
    icon: Activity
  }
];

// === BACKEND LAYOUT TEMPLATE ===
export const BackendLayout = React.forwardRef<HTMLDivElement, BackendLayoutProps>(
  ({
    children,
    title,
    description,
    actions,
    sidebar,
    breadcrumbs,
    showSidebar = true,
    collapsibleSidebar = true,
    requiredPermission = "MEMBER",
    loading = false,
    className,
    ...props
  }, ref) => {
    // === HOOKS ===
    const location = useLocation();
    const navigate = useNavigate();
    const { user, hasRole, logout } = useAuth();
    const { resolvedTheme } = useTheme();

    // === STATE ===
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // === COMPUTED VALUES ===
    const hasPermission = hasRole(requiredPermission);
    const filteredNavItems = defaultNavigationItems.filter(item => 
      !item.requiredRole || hasRole(item.requiredRole)
    );

    // === EFFECTS ===
    useEffect(() => {
      setMobileMenuOpen(false);
    }, [location.pathname]);

    // === HANDLERS ===
    const handleLogout = async () => {
      try {
        await logout();
        navigate('/');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    };

    const toggleSidebar = () => {
      setSidebarCollapsed(!sidebarCollapsed);
    };

    const toggleExpandedItem = (itemId: string) => {
      setExpandedItems(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    };

    const isActiveRoute = (href: string) => {
      return location.pathname + location.search === href ||
             (href !== '/backend' && location.search.includes(href.split('?')[1] || ''));
    };

    // === RENDER HELPERS ===
    const renderSidebarHeader = () => (
      <div className={cn(
        "p-4 border-b",
        sidebarCollapsed && "px-2"
      )}>
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-r from-growth to-harvest rounded-lg">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Backend AgriAI</h3>
                <p className="text-xs text-muted-foreground">Pannello Controllo</p>
              </div>
            </div>
          )}
          
          {collapsibleSidebar && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              className={cn(
                "h-7 w-7",
                sidebarCollapsed && "mx-auto"
              )}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    );

    const renderNavigationItem = (item: NavigationItem) => {
      const isActive = isActiveRoute(item.href);
      const isExpanded = expandedItems.includes(item.id);
      const hasSubItems = item.subItems && item.subItems.length > 0;
      const Icon = item.icon;

      return (
        <div key={item.id} className="space-y-1">
          <Button
            variant={isActive ? "agricultural" : "ghost"}
            size="sm"
            className={cn(
              "w-full justify-start gap-3 h-10",
              sidebarCollapsed && "px-2",
              hasSubItems && "pr-2"
            )}
            onClick={hasSubItems ? 
              () => toggleExpandedItem(item.id) : 
              () => navigate(item.href)
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge variant="outline" size="xs">
                    {item.badge}
                  </Badge>
                )}
                {hasSubItems && (
                  <ChevronRight className={cn(
                    "h-3 w-3 transition-transform",
                    isExpanded && "rotate-90"
                  )} />
                )}
              </>
            )}
          </Button>

          {/* Sub-items */}
          {hasSubItems && isExpanded && !sidebarCollapsed && (
            <div className="ml-6 space-y-1">
              {item.subItems!.map(subItem => {
                const SubIcon = subItem.icon;
                const isSubActive = isActiveRoute(subItem.href);
                
                return (
                  <Button
                    key={subItem.id}
                    variant={isSubActive ? "earth" : "ghost"}
                    size="sm"
                    className="w-full justify-start gap-2 h-8"
                    onClick={() => navigate(subItem.href)}
                  >
                    <SubIcon className="h-3 w-3" />
                    {subItem.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      );
    };

    const renderSidebarContent = () => (
      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-2">
          {filteredNavItems.map(renderNavigationItem)}
        </div>

        {/* System metrics in collapsed sidebar */}
        {sidebarCollapsed && (
          <div className="mt-6 space-y-3">
            <Separator />
            {systemMetrics.slice(0, 2).map(metric => {
              const Icon = metric.icon;
              return (
                <div key={metric.id} className="text-center">
                  <Icon className={cn(
                    "h-4 w-4 mx-auto mb-1",
                    metric.status === "success" && "text-success",
                    metric.status === "warning" && "text-warning",
                    metric.status === "error" && "text-destructive",
                    metric.status === "info" && "text-info"
                  )} />
                  <div className="text-xs font-medium">{metric.value}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );

    const renderSidebarFooter = () => (
      <div className={cn(
        "p-4 border-t",
        sidebarCollapsed && "px-2"
      )}>
        {!sidebarCollapsed ? (
          <div className="space-y-3">
            {/* User info */}
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback type="user">
                  {user?.name?.slice(0, 2).toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.userType === 'ADMIN' ? 'Amministratore' : 'Membro'}
                </p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="flex-1 gap-2"
              >
                <Home className="h-3 w-3" />
                App
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex-1 gap-2"
              >
                <LogOut className="h-3 w-3" />
                Esci
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigate('/')}
              className="w-full"
              title="Vai all'app"
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              className="w-full"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );

    const renderSidebar = () => {
      if (!showSidebar) return null;

      const sidebarContent = sidebar || (
        <div className="flex flex-col h-full">
          {renderSidebarHeader()}
          {renderSidebarContent()}
          {renderSidebarFooter()}
        </div>
      );

      return (
        <aside className={cn(
          "hidden lg:flex flex-col bg-background border-r transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}>
          {sidebarContent}
        </aside>
      );
    };

    const renderTopBar = () => (
      <header className="bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Title and breadcrumbs */}
            <div className="space-y-1">
              {title && (
                <h1 className="text-xl font-semibold">{title}</h1>
              )}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbs.map((item, index) => {
                      const isLast = index === breadcrumbs.length - 1;
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
              )}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:block w-64">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cerca nel backend..."
                variant="default"
                size="sm"
                clearable
              />
            </div>

            {/* Actions */}
            {actions}

            {/* Notifications */}
            <Button variant="ghost" size="icon-sm" className="relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                3
              </Badge>
            </Button>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar size="xs">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback type="user">
                      {user?.name?.slice(0, 2).toUpperCase() || <User className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  Profilo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Impostazioni
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/')}>
                  <Home className="h-4 w-4 mr-2" />
                  Vai all'App
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnetti
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    );

    const renderSystemMetrics = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {systemMetrics.map(metric => {
          const Icon = metric.icon;
          return (
            <Card key={metric.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Icon className={cn(
                      "h-6 w-6",
                      metric.status === "success" && "text-success",
                      metric.status === "warning" && "text-warning",
                      metric.status === "error" && "text-destructive",
                      metric.status === "info" && "text-info"
                    )} />
                    <StatusBadge status={metric.status} size="xs">
                      {metric.trend === "up" && "↗"}
                      {metric.trend === "down" && "↘"}
                      {metric.trend === "stable" && "→"}
                    </StatusBadge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );

    // === PERMISSION CHECK ===
    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md text-center">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Accesso Negato
              </CardTitle>
              <CardDescription>
                Non hai i permessi necessari per accedere al pannello backend.
                È richiesto il ruolo {requiredPermission}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                Torna all'App
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // === RENDER ===
    return (
      <div
        ref={ref}
        className={cn(
          "min-h-screen flex bg-muted/30",
          className
        )}
        {...props}
      >
        {/* Sidebar */}
        {renderSidebar()}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          {renderTopBar()}

          {/* Content */}
          <main className="flex-1 overflow-auto p-6">
            {/* System metrics for dashboard */}
            {location.pathname === '/backend' && !location.search && renderSystemMetrics()}
            
            {/* Page content */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Caricamento...</p>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>

        {/* Development info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-40">
            <div className="bg-background border rounded-lg p-2 text-xs space-y-1">
              <div>Layout: BackendLayout</div>
              <div>User: {user?.userType}</div>
              <div>Theme: {resolvedTheme}</div>
              <div>Sidebar: {sidebarCollapsed ? 'Collapsed' : 'Expanded'}</div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

BackendLayout.displayName = "BackendLayout";

// === EXPORTS ===
export default BackendLayout;