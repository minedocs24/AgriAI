/**
 * Modern Layout Component per AgriAI
 * Layout principale moderno con header, sidebar e content area responsive
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ModernHeader } from './ModernHeader';
import { ModernSidebar } from './ModernSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';

interface ModernLayoutProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dashboard' | 'chat' | 'fullscreen';
  showHeader?: boolean;
  showSidebar?: boolean;
  headerProps?: any;
  sidebarProps?: any;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onUserMenuClick?: () => void;
}

export const ModernLayout: React.FC<ModernLayoutProps> = ({
  children,
  className,
  variant = 'default',
  showHeader = true,
  showSidebar = true,
  headerProps = {},
  sidebarProps = {},
  onSearch,
  onNotificationClick,
  onUserMenuClick,
}) => {
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Gestione responsive
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  // Gestione loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Gestione mobile menu
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Gestione sidebar collapse
  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  // Gestione click outside per chiudere mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (mobileMenuOpen && !target.closest('.mobile-menu-overlay')) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Varianti layout
  const layoutVariants = {
    default: {
      header: 'default',
      sidebar: 'default',
      content: 'p-6',
    },
    dashboard: {
      header: 'glass',
      sidebar: 'default',
      content: 'p-4',
    },
    chat: {
      header: 'transparent',
      sidebar: 'compact',
      content: 'p-0',
    },
    fullscreen: {
      header: 'transparent',
      sidebar: 'floating',
      content: 'p-0',
    },
  };

  const currentVariant = layoutVariants[variant];

  // Classi dinamiche
  const layoutClasses = cn(
    'min-h-screen bg-background',
    className
  );

  const contentClasses = cn(
    'flex-1 transition-all duration-300',
    currentVariant.content,
    showSidebar && !sidebarCollapsed && !isMobile && 'ml-64',
    showSidebar && sidebarCollapsed && !isMobile && 'ml-16',
    isLoading && 'opacity-50'
  );

  return (
    <div className={layoutClasses}>
      {/* Header */}
      {showHeader && (
        <ModernHeader
          variant={currentVariant.header as any}
          onMenuClick={isMobile ? handleMobileMenuToggle : undefined}
          onSearch={onSearch}
          onNotificationClick={onNotificationClick}
          onUserMenuClick={onUserMenuClick}
          {...headerProps}
        />
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar - Desktop */}
        {showSidebar && !isMobile && (
          <ModernSidebar
            variant={currentVariant.sidebar as any}
            collapsed={sidebarCollapsed}
            onCollapseChange={handleSidebarCollapse}
            showUserSection={isAuthenticated}
            showQuickActions={variant === 'dashboard'}
            {...sidebarProps}
          />
        )}

        {/* Sidebar - Mobile Overlay */}
        {showSidebar && isMobile && mobileMenuOpen && (
          <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/50 z-sidebar mobile-menu-overlay" />
            
            {/* Mobile Sidebar */}
            <div className="fixed left-0 top-0 h-full z-modal mobile-menu-overlay">
              <ModernSidebar
                variant="floating"
                collapsed={false}
                showUserSection={isAuthenticated}
                showQuickActions={false}
                onItemClick={() => setMobileMenuOpen(false)}
                {...sidebarProps}
              />
            </div>
          </>
        )}

        {/* Content Area */}
        <main className={contentClasses}>
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Caricamento...</span>
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className="relative">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Action Button per mobile */}
      {isMobile && showSidebar && (
        <button
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center"
          onClick={handleMobileMenuToggle}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

// Layout specializzati
export const DashboardLayout: React.FC<Omit<ModernLayoutProps, 'variant'>> = (props) => (
  <ModernLayout variant="dashboard" {...props} />
);

export const ChatLayout: React.FC<Omit<ModernLayoutProps, 'variant'>> = (props) => (
  <ModernLayout variant="chat" {...props} />
);

export const FullscreenLayout: React.FC<Omit<ModernLayoutProps, 'variant'>> = (props) => (
  <ModernLayout variant="fullscreen" {...props} />
);

// Layout senza sidebar
export const HeaderOnlyLayout: React.FC<Omit<ModernLayoutProps, 'showSidebar'>> = (props) => (
  <ModernLayout showSidebar={false} {...props} />
);

// Layout senza header
export const SidebarOnlyLayout: React.FC<Omit<ModernLayoutProps, 'showHeader'>> = (props) => (
  <ModernLayout showHeader={false} {...props} />
);

// Layout minimal
export const MinimalLayout: React.FC<Omit<ModernLayoutProps, 'showHeader' | 'showSidebar'>> = (props) => (
  <ModernLayout showHeader={false} showSidebar={false} {...props} />
); 