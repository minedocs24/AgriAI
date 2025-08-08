
import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Send, Sprout, Wheat, Leaf, TrendingUp, Zap, Brain, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { chatApi, ChatMessage, createUserMessage, validateMessageContent, formatMessageTime } from "@/lib/chatApi";
import useWebSocket from "@/hooks/useWebSocket";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ChatInterfaceProps {
  onBack: () => void;
  conversationId?: string;
}

export const ChatInterface = ({ onBack, conversationId }: ChatInterfaceProps) => {
  // ================================
  // State Management
  // ================================
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Hooks
  const { user } = useAuth();
  const { toast } = useToast();
  
  // WebSocket integration
  const {
    isConnected: wsConnected,
    isConnecting: wsConnecting,
    sendMessage: sendWebSocketMessage,
    lastMessage: lastWebSocketMessage,
    startTyping,
    stopTyping
  } = useWebSocket({
    autoConnect: true,
    onMessage: handleWebSocketMessage,
    onConnectionChange: (connected) => {
      if (connected) {
        toast({
          title: "Connessione stabilita",
          description: "Chat in tempo reale attiva",
        });
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });

  // ================================
  // Configuration
  // ================================
  const quickSuggestions = [
    { icon: Wheat, text: "Supporto Normativo PAC" },
    { icon: Leaf, text: "Certificazioni BIO" },
    { icon: Zap, text: "Smart Farming e IoT" },
    { icon: TrendingUp, text: "Bandi PNRR" },
    { icon: Brain, text: "Previsioni Meteo" },
  ];

  // ================================
  // WebSocket Message Handling
  // ================================
  function handleWebSocketMessage(message: any) {
    if (message.type === 'chat_message' && message.data) {
      // Handle real-time AI response
      const aiMessage: ChatMessage = {
        id: message.data.id || `ai-${Date.now()}`,
        content: message.data.content,
        sender: 'ai',
        timestamp: new Date(message.data.timestamp || Date.now()),
        conversationId: message.data.conversationId,
        confidence: message.data.confidence,
        sources: message.data.sources
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }
  }

  // ================================
  // Effects
  // ================================
  
  useEffect(() => {
    console.log('Messages changed:', messages.length, 'messages');
    messages.forEach((msg, index) => {
      console.log(`Message ${index}:`, msg.id, msg.sender, msg.content.substring(0, 50));
    });
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Only load conversation history if we have a conversationId and no messages yet
    if (currentConversationId && messages.length === 0) {
      loadConversationHistory();
    } else if (!currentConversationId && messages.length === 0) {
      // Show welcome message for new conversations only if no messages exist
      setMessages([{
        id: "welcome",
        content: "Ciao! Sono AgriAI, il tuo assistente agricolo con un pizzico di ironia ma tanta competenza. 🌾 Come posso aiutarti oggi? Che si tratti di normative complicate o di tecnologie innovative, sono qui per te!",
        sender: "ai",
        timestamp: new Date(),
      }]);
    }
  }, [currentConversationId, messages.length]);

  // Handle WebSocket real-time messages
  useEffect(() => {
    if (lastWebSocketMessage) {
      handleWebSocketMessage(lastWebSocketMessage);
    }
  }, [lastWebSocketMessage]);

  // ================================
  // Helper Functions
  // ================================
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversationHistory = async () => {
    if (!currentConversationId) return;

    try {
      setIsLoading(true);
      // Here we would load conversation history from API
      // For now, we start fresh
      setMessages([]);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setError('Impossibile caricare la conversazione');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // ================================
  // Message Handling
  // ================================
  
  const handleSendMessage = useCallback(async (content: string) => {
    // Validate message content
    const validation = validateMessageContent(content);
    if (!validation.isValid) {
      toast({
        title: "Messaggio non valido",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    const userMessage = createUserMessage(content, currentConversationId);
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      // Try WebSocket first (real-time)
      if (wsConnected) {
        sendWebSocketMessage({
          type: 'chat_message',
          content: content,
          conversationId: currentConversationId,
          userId: user?.id
        });
        
        // Start typing indicator
        startTyping(currentConversationId);
        
      } else {
        // Fallback to REST API
        const response = await chatApi.sendMessage({
          content: content,
          conversationId: currentConversationId,
          context: {
            userType: user?.userType === 'PUBLIC' ? 'public' : 'member'
          }
        });

        // Update conversation ID if this was a new conversation
        if (!currentConversationId) {
          setCurrentConversationId(response.conversation.id);
        }

        // Replace the temporary user message with the real one from server and add AI response
        if (response && response.userMessage && response.aiMessage) {
          console.log('Before updating messages:', messages.length, 'messages');
          console.log('Response userMessage:', response.userMessage);
          console.log('Response aiMessage:', response.aiMessage);
          
          setMessages(prev => {
            console.log('Previous messages:', prev.length, 'messages');
            // Remove the last message (temporary user message) and add both real messages
            const messagesWithoutTemp = prev.slice(0, -1);
            console.log('Messages without temp:', messagesWithoutTemp.length, 'messages');
            const newMessages = [...messagesWithoutTemp, response.userMessage, response.aiMessage];
            console.log('New messages:', newMessages.length, 'messages');
            return newMessages;
          });
        } else {
          console.error('Invalid response structure:', response);
          setError('Risposta del server non valida');
        }
        setIsLoading(false);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Impossibile inviare il messaggio. Riprova.');
      setIsLoading(false);
      
      toast({
        title: "Errore invio messaggio",
        description: "Impossibile inviare il messaggio. Controlla la connessione.",
        variant: "destructive"
      });
    }
  }, [currentConversationId, wsConnected, sendWebSocketMessage, startTyping, user, toast]);

  const handleSuggestionClick = (suggestion: any) => {
    handleSendMessage(suggestion.text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isLoading) {
        handleSendMessage(inputValue);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    // Send typing indicator via WebSocket
    if (wsConnected && e.target.value.length > 0) {
      startTyping(currentConversationId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-green-100 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-green-600 hover:bg-green-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla home
            </Button>
            
            <div className="flex items-center space-x-2">
              <Sprout className="h-6 w-6 text-green-600" />
              <span className="font-semibold text-green-800">AgriAI Chat</span>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {wsConnecting ? (
              <div className="flex items-center space-x-2 text-yellow-600">
                <Wifi className="h-4 w-4 animate-pulse" />
                <span className="text-xs">Connessione...</span>
              </div>
            ) : wsConnected ? (
              <div className="flex items-center space-x-2 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-xs">Online</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-xs">Offline</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="container mx-auto p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="ml-4"
              >
                Chiudi
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Quick Suggestions */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-green-100 p-4">
        <div className="container mx-auto">
          <p className="text-sm text-green-600 mb-3">Argomenti popolari:</p>
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
                className="border-green-200 text-green-700 hover:bg-green-50 flex items-center space-x-2 disabled:opacity-50"
              >
                <suggestion.icon className="h-4 w-4" />
                <span>{suggestion.text}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 container mx-auto p-4 overflow-y-auto">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card className={`max-w-md p-4 ${
                message.sender === "user"
                  ? "bg-green-600 text-white"
                  : "bg-white border-green-100"
              }`}>
                <div className="flex items-start space-x-2">
                  {message.sender === "ai" && (
                    <div className="p-1 bg-green-100 rounded-full">
                      <Sprout className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Message metadata */}
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs opacity-70">
                        {formatMessageTime(message.timestamp)}
                      </p>
                      
                      {/* Confidence indicator for AI messages */}
                      {message.sender === "ai" && message.confidence && (
                        <span className="text-xs opacity-60">
                          Confidence: {Math.round(message.confidence * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Sources for AI messages */}
                    {message.sender === "ai" && message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-green-100">
                        <p className="text-xs opacity-60 mb-1">Fonti:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.slice(0, 3).map((source, idx) => (
                            <span key={idx} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <Card className="max-w-md p-4 bg-white border-green-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-green-100 rounded-full">
                    <Sprout className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-green-600">
                    {wsConnected ? "AgriAI sta pensando..." : "Invio messaggio..."}
                  </span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-green-100 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Scrivi il tuo messaggio..."
              disabled={isLoading}
              className="flex-1 border-green-200 focus:border-green-400 disabled:opacity-50"
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Character count and status */}
          <div className="flex justify-between items-center mt-2 text-xs text-green-600">
            <span>
              {inputValue.length}/1000 caratteri
            </span>
            
            <div className="flex items-center space-x-4">
              {!wsConnected && (
                <span className="text-yellow-600">
                  Modalità offline - verrà inviato via API
                </span>
              )}
              
              {user && (
                <span>
                  Logged in as {user.firstName} {user.lastName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div ref={messagesEndRef} />
    </div>
  );
};
