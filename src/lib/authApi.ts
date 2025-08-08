/**
 * AgriAI Frontend Authentication API
 * 
 * Modulo per gestire tutte le chiamate API di autenticazione
 * Integra con il backend JWT implementato in /src/controllers/AuthController.ts
 */

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    deviceType?: string;
    deviceName?: string;
    browserName?: string;
    osName?: string;
  };
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: 'PUBLIC' | 'MEMBER' | 'ADMIN';
  organizationId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface UserSession {
  id: string;
  expiresAt: string;
  deviceInfo?: {
    deviceType?: string;
    deviceName?: string;
    browserName?: string;
    osName?: string;
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'PUBLIC' | 'MEMBER' | 'ADMIN';
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  session: UserSession;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  details?: any;
}

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const AUTH_ENDPOINTS = {
  login: '/api/auth/login',
  register: '/api/auth/register',
  logout: '/api/auth/logout',
  refresh: '/api/auth/refresh',
  me: '/api/auth/me',
  changePassword: '/api/auth/change-password',
  forgotPassword: '/api/auth/forgot-password',
  resetPassword: '/api/auth/reset-password'
} as const;

// Error types
export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Token management
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(tokens: AuthTokens) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    
    // Store in localStorage for persistence
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
  }

  getAccessToken(): string | null {
    if (this.accessToken) return this.accessToken;
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    if (this.refreshToken) return this.refreshToken;
    return localStorage.getItem('refresh_token');
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      // Basic JWT validation (check if not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}

const tokenManager = new TokenManager();

// HTTP client with automatic token management
class ApiClient {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Default headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    // Add authorization header if token exists
    const accessToken = tokenManager.getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include' // Include cookies for refresh token
      });

      // Parse response
      const data: ApiResponse<T> = await response.json();

      // Handle different response statuses
      if (!response.ok) {
        // Handle 401 Unauthorized - try to refresh token
        if (response.status === 401 && endpoint !== AUTH_ENDPOINTS.refresh) {
          const refreshed = await this.tryRefreshToken();
          if (refreshed) {
            // Retry original request with new token
            return this.makeRequest(endpoint, options);
          }
        }

        // Throw appropriate error
        throw new AuthError(
          data.message || 'Request failed',
          data.error,
          response.status,
          data.details
        );
      }

      return data;

    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      // Network or other errors
      console.error('API Request failed:', error);
      throw new NetworkError(
        'Errore di connessione. Controlla la tua connessione internet.',
        error as Error
      );
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await this.makeRequest<AuthResponse>(
        AUTH_ENDPOINTS.refresh,
        { method: 'POST' }
      );

      if (response.success && response.data) {
        tokenManager.setTokens(response.data.tokens);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      tokenManager.clearTokens();
    }

    return false;
  }

  // Auth API methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>(
      AUTH_ENDPOINTS.login,
      {
        method: 'POST',
        body: JSON.stringify(credentials)
      }
    );

    if (response.success && response.data) {
      tokenManager.setTokens(response.data.tokens);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    }

    throw new AuthError('Login failed');
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>(
      AUTH_ENDPOINTS.register,
      {
        method: 'POST',
        body: JSON.stringify(userData)
      }
    );

    if (response.success && response.data) {
      tokenManager.setTokens(response.data.tokens);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    }

    throw new AuthError('Registration failed');
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest(AUTH_ENDPOINTS.logout, { method: 'POST' });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      tokenManager.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.makeRequest<User>(
      AUTH_ENDPOINTS.me,
      { method: 'GET' }
    );

    if (response.success && response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }

    throw new AuthError('Failed to get current user');
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    const response = await this.makeRequest(
      AUTH_ENDPOINTS.changePassword,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );

    if (!response.success) {
      throw new AuthError('Failed to change password');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await this.makeRequest(
      AUTH_ENDPOINTS.forgotPassword,
      {
        method: 'POST',
        body: JSON.stringify({ email })
      }
    );

    if (!response.success) {
      throw new AuthError('Failed to send password reset email');
    }
  }

  async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<void> {
    const response = await this.makeRequest(
      AUTH_ENDPOINTS.resetPassword,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );

    if (!response.success) {
      throw new AuthError('Failed to reset password');
    }
  }

  // Generic request method for other API clients
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    options: {
      body?: any;
      headers?: Record<string, string>;
      params?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_BASE_URL}${endpoint}`;

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include'
    };

    // Add authorization header
    const accessToken = tokenManager.getAccessToken();
    if (accessToken) {
      (requestOptions.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
    }

    // Add body for non-GET requests
    if (options.body && method !== 'GET') {
      requestOptions.body = JSON.stringify(options.body);
    }

    // Add query parameters for GET requests
    if (options.params && method === 'GET') {
      const urlObj = new URL(url);
      Object.entries(options.params).forEach(([key, value]) => {
        urlObj.searchParams.append(key, value);
      });
    }

    const response = await this.makeRequest<T>(endpoint, requestOptions);
    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return tokenManager.hasValidToken();
  }

  getAccessToken(): string | null {
    return tokenManager.getAccessToken();
  }

  getRefreshToken(): string | null {
    return tokenManager.getRefreshToken();
  }

  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const authApi = new ApiClient();

// Export token manager for advanced usage
export { tokenManager };