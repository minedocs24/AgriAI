/**
 * AgriAI WebSocket Hook
 * 
 * React hook per gestire la connessione WebSocket al chat system
 * Fornisce:
 * - Auto-connection management
 * - Real-time message handling
 * - Reconnection logic
 * - TypeScript integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { chatWebSocket, WebSocketMessage, WebSocketConfig } from '@/lib/chatApi';
import { useAuth } from '@/contexts/AuthContext';

// ================================
// Types & Interfaces
// ================================

export interface UseWebSocketOptions extends WebSocketConfig {
  autoConnect?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

export interface UseWebSocketReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: Omit<WebSocketMessage, 'timestamp'>) => void;
  
  // Message handling
  lastMessage: WebSocketMessage | null;
  
  // Typing indicators
  startTyping: (conversationId?: string) => void;
  stopTyping: (conversationId?: string) => void;
  
  // Connection stats
  reconnectAttempts: number;
}

// ================================
// WebSocket Hook Implementation
// ================================

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { isAuthenticated, user } = useAuth();
  
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  // Refs for stable callbacks
  const optionsRef = useRef(options);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // ================================
  // Connection Management
  // ================================

  const connect = useCallback(async () => {
    if (!isAuthenticated) {
      setConnectionError('User not authenticated');
      return;
    }

    if (isConnected || isConnecting) {
      return; // Already connected or connecting
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      await chatWebSocket.connect();
      setIsConnected(true);
      setReconnectAttempts(0);
      console.log('✅ WebSocket connected successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionError(errorMessage);
      setReconnectAttempts(prev => prev + 1);
      
      if (optionsRef.current.onError) {
        optionsRef.current.onError(error instanceof Error ? error : new Error(errorMessage));
      }
      
      console.error('❌ WebSocket connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [isAuthenticated, isConnected, isConnecting]);

  const disconnect = useCallback(() => {
    chatWebSocket.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    console.log('🔌 WebSocket disconnected');
  }, []);

  // ================================
  // Message Handling
  // ================================

  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (!isConnected) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: new Date().toISOString()
    };

    chatWebSocket.sendMessage(fullMessage);
  }, [isConnected]);

  // ================================
  // Typing Indicators
  // ================================

  const startTyping = useCallback((conversationId?: string) => {
    if (!isConnected) return;

    sendMessage({
      type: 'typing_start',
      conversationId,
      userId: user?.id
    });
  }, [isConnected, sendMessage, user?.id]);

  const stopTyping = useCallback((conversationId?: string) => {
    if (!isConnected) return;

    sendMessage({
      type: 'typing_stop',
      conversationId,
      userId: user?.id
    });
  }, [isConnected, sendMessage, user?.id]);

  // Auto-stop typing after 3 seconds
  const startTypingWithTimeout = useCallback((conversationId?: string) => {
    startTyping(conversationId);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 3000);
  }, [startTyping, stopTyping]);

  // ================================
  // Effect Hooks
  // ================================

  // Auto-connect on authentication change
  useEffect(() => {
    if (isAuthenticated && options.autoConnect !== false) {
      connect();
    } else if (!isAuthenticated) {
      disconnect();
    }
    
    return () => {
      if (!isAuthenticated) {
        disconnect();
      }
    };
  }, [isAuthenticated, connect, disconnect, options.autoConnect]);

  // Setup message and connection handlers
  useEffect(() => {
    const unsubscribeMessage = chatWebSocket.onMessage((message) => {
      setLastMessage(message);
      
      if (optionsRef.current.onMessage) {
        optionsRef.current.onMessage(message);
      }
    });

    const unsubscribeConnection = chatWebSocket.onConnectionChange((connected) => {
      setIsConnected(connected);
      
      if (!connected) {
        setIsConnecting(false);
      }
      
      if (optionsRef.current.onConnectionChange) {
        optionsRef.current.onConnectionChange(connected);
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Only disconnect if this was the component that initiated the connection
      if (options.autoConnect !== false) {
        disconnect();
      }
    };
  }, [disconnect, options.autoConnect]);

  // ================================
  // Return Hook Interface
  // ================================

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,

    // Actions
    connect,
    disconnect,
    sendMessage,
    
    // Message handling
    lastMessage,
    
    // Typing indicators
    startTyping: startTypingWithTimeout,
    stopTyping,
    
    // Connection stats
    reconnectAttempts
  };
}

// ================================
// Additional Utility Hooks
// ================================

/**
 * Hook per gestire solo i messaggi chat (filtra altri tipi di messaggi WebSocket)
 */
export function useChatMessages() {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  
  const { lastMessage } = useWebSocket({
    autoConnect: true,
    onMessage: (message) => {
      if (message.type === 'chat_message') {
        setMessages(prev => [...prev, message]);
      }
    }
  });

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    clearMessages,
    lastMessage
  };
}

/**
 * Hook per gestire typing indicators
 */
export function useTypingIndicators() {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  useWebSocket({
    autoConnect: true,
    onMessage: (message) => {
      if (message.type === 'typing_start' && message.userId) {
        setTypingUsers(prev => new Set([...prev, message.userId!]));
      } else if (message.type === 'typing_stop' && message.userId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(message.userId!);
          return newSet;
        });
      }
    }
  });

  return {
    typingUsers: Array.from(typingUsers),
    isUserTyping: (userId: string) => typingUsers.has(userId)
  };
}

export default useWebSocket;