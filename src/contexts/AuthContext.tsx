/**
 * AgriAI Authentication Context
 * 
 * React Context per gestire lo stato di autenticazione globalmente
 * Provides authentication state, login/logout functions, and user data
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, User, LoginCredentials, RegisterData, AuthError, NetworkError } from '@/lib/authApi';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  // Auth actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Utility functions
  clearError: () => void;
  hasRole: (role: 'PUBLIC' | 'MEMBER' | 'ADMIN') => boolean;
  canAccess: (requiredRole?: 'PUBLIC' | 'MEMBER' | 'ADMIN') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if user has valid token
      if (authApi.isAuthenticated()) {
        // Try to get current user from API
        const user = await authApi.getCurrentUser();
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } else {
        // Check if user data exists in localStorage (offline fallback)
        const storedUser = authApi.getStoredUser();
        if (storedUser) {
          setAuthState({
            user: storedUser,
            isAuthenticated: false, // Token expired but we have user data
            isLoading: false,
            error: null
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      
      // Fallback to stored user data
      const storedUser = authApi.getStoredUser();
      setAuthState({
        user: storedUser,
        isAuthenticated: false,
        isLoading: false,
        error: storedUser ? null : 'Errore di connessione. Alcune funzionalità potrebbero non essere disponibili.'
      });
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const authResponse = await authApi.login(credentials);
      
      setAuthState({
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      console.log('Login successful:', authResponse.user.email);
      
    } catch (error) {
      console.error('Login failed:', error);
      
      let errorMessage = 'Errore durante il login';
      
      if (error instanceof AuthError) {
        switch (error.code) {
          case 'authentication_failed':
            errorMessage = 'Email o password non corretti';
            break;
          case 'account_locked':
            errorMessage = 'Account temporaneamente bloccato per troppi tentativi falliti';
            break;
          case 'validation_error':
            errorMessage = 'Dati non validi. Controlla email e password.';
            break;
          case 'rate_limit':
            errorMessage = 'Troppi tentativi di login. Riprova tra qualche minuto.';
            break;
          default:
            errorMessage = error.message;
        }
      } else if (error instanceof NetworkError) {
        errorMessage = 'Errore di connessione. Controlla la tua connessione internet.';
      }

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      throw error; // Re-throw for component handling
    }
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const authResponse = await authApi.register(userData);
      
      setAuthState({
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      console.log('Registration successful:', authResponse.user.email);
      
    } catch (error) {
      console.error('Registration failed:', error);
      
      let errorMessage = 'Errore durante la registrazione';
      
      if (error instanceof AuthError) {
        switch (error.code) {
          case 'email_exists':
            errorMessage = 'Questa email è già registrata. Prova ad accedere invece.';
            break;
          case 'validation_error':
            errorMessage = 'Dati non validi. Controlla tutti i campi.';
            break;
          case 'weak_password':
            errorMessage = 'Password troppo debole. Usa almeno 8 caratteri con maiuscole, minuscole e numeri.';
            break;
          default:
            errorMessage = error.message;
        }
      } else if (error instanceof NetworkError) {
        errorMessage = 'Errore di connessione. Controlla la tua connessione internet.';
      }

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      throw error; // Re-throw for component handling
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await authApi.logout();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });

      console.log('Logout successful');
      
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Even if logout API call fails, clear local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!authApi.isAuthenticated()) return;

    try {
      const user = await authApi.getCurrentUser();
      setAuthState(prev => ({ ...prev, user }));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      
      // If refresh fails, user might need to re-login
      if (error instanceof AuthError && error.status === 401) {
        setAuthState(prev => ({ ...prev, isAuthenticated: false }));
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const hasRole = useCallback((role: 'PUBLIC' | 'MEMBER' | 'ADMIN') => {
    if (!authState.user) return false;
    
    const roleHierarchy = {
      'PUBLIC': 0,
      'MEMBER': 1,
      'ADMIN': 2
    };
    
    return roleHierarchy[authState.user.userType] >= roleHierarchy[role];
  }, [authState.user]);

  const canAccess = useCallback((requiredRole?: 'PUBLIC' | 'MEMBER' | 'ADMIN') => {
    if (!requiredRole) return authState.isAuthenticated;
    return authState.isAuthenticated && hasRole(requiredRole);
  }, [authState.isAuthenticated, hasRole]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
    clearError,
    hasRole,
    canAccess
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Higher-order component for protected routes
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'PUBLIC' | 'MEMBER' | 'ADMIN';
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback
}) => {
  const { canAccess, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!canAccess(requiredRole)) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-800 mb-4">Accesso Negato</h1>
          <p className="text-green-600 mb-6">
            {requiredRole 
              ? `Hai bisogno del ruolo ${requiredRole} per accedere a questa pagina.`
              : 'Devi effettuare il login per accedere a questa pagina.'
            }
          </p>
          <a 
            href="/login" 
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            Vai al Login
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Hook for authentication guards in components
export const useAuthGuard = (requiredRole?: 'PUBLIC' | 'MEMBER' | 'ADMIN') => {
  const { isAuthenticated, hasRole, isLoading } = useAuth();
  
  return {
    canAccess: requiredRole ? isAuthenticated && hasRole(requiredRole) : isAuthenticated,
    isLoading,
    isAuthenticated,
    hasRole: (role: 'PUBLIC' | 'MEMBER' | 'ADMIN') => hasRole(role)
  };
};