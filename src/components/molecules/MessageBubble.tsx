/**
 * MessageBubble Molecule per AgriAI
 * Componente per messaggi chat con avatar, timestamp e status
 */

import * as React from "react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { 
  Check, 
  CheckCheck, 
  Clock, 
  AlertCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Copy,
  MoreHorizontal,
  User,
  Bot,
  Leaf,
  Building,
  Tractor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback, AgriculturalAvatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// === TYPES ===
export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "error";
export type MessageSender = "user" | "ai" | "system";
export type FeedbackType = "positive" | "negative";

export interface MessageSource {
  id: string;
  title: string;
  url?: string;
  excerpt?: string;
  confidence?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: MessageSender;
  timestamp: Date;
  status?: MessageStatus;
  confidence?: number;
  sources?: MessageSource[];
  metadata?: Record<string, any>;
  feedback?: FeedbackType;
}

export interface MessageUser {
  id: string;
  name: string;
  avatar?: string;
  role?: "farmer" | "agronomist" | "technician" | "admin" | "inspector";
  status?: "online" | "offline" | "busy" | "away";
}

export interface MessageBubbleProps {
  /** Messaggio da visualizzare */
  message: ChatMessage;
  /** Utente che ha inviato il messaggio */
  user?: MessageUser;
  /** Se è un messaggio dell'utente corrente */
  isCurrentUser?: boolean;
  /** Mostra avatar */
  showAvatar?: boolean;
  /** Mostra timestamp */
  showTimestamp?: boolean;
  /** Mostra status del messaggio */
  showStatus?: boolean;
  /** Mostra confidence per messaggi AI */
  showConfidence?: boolean;
  /** Mostra fonti per messaggi AI */
  showSources?: boolean;
  /** Mostra feedback buttons */
  showFeedback?: boolean;
  /** Variante del tema */
  variant?: "default" | "agricultural" | "earth" | "harvest";
  /** CSS classes aggiuntive */
  className?: string;
  /** Callback per feedback */
  onFeedback?: (messageId: string, feedback: FeedbackType) => void;
  /** Callback per copia messaggio */
  onCopy?: (content: string) => void;
  /** Callback per click su fonte */
  onSourceClick?: (source: MessageSource) => void;
  /** Callback per azioni aggiuntive */
  onAction?: (action: string, messageId: string) => void;
}

// === STATUS ICONS ===
const getStatusIcon = (status: MessageStatus) => {
  const iconMap = {
    sending: <Clock className="h-3 w-3 animate-pulse" />,
    sent: <Check className="h-3 w-3" />,
    delivered: <CheckCheck className="h-3 w-3" />,
    read: <CheckCheck className="h-3 w-3 text-growth" />,
    error: <AlertCircle className="h-3 w-3 text-destructive" />,
  };
  
  return iconMap[status];
};

// === MESSAGE BUBBLE MOLECULE ===
export const MessageBubble = React.forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({
    message,
    user,
    isCurrentUser = false,
    showAvatar = true,
    showTimestamp = true,
    showStatus = true,
    showConfidence = true,
    showSources = true,
    showFeedback = true,
    variant = "default",
    className,
    onFeedback,
    onCopy,
    onSourceClick,
    onAction,
    ...props
  }, ref) => {
    // === STATE ===
    const [copied, setCopied] = useState(false);

    // === HANDLERS ===
    const handleCopy = async () => {
      if (onCopy) {
        onCopy(message.content);
      } else {
        try {
          await navigator.clipboard.writeText(message.content);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (error) {
          console.error("Failed to copy message:", error);
        }
      }
    };

    const handleFeedback = (feedback: FeedbackType) => {
      if (onFeedback) {
        onFeedback(message.id, feedback);
      }
    };

    const handleSourceClick = (source: MessageSource) => {
      if (onSourceClick) {
        onSourceClick(source);
      }
    };

    // === COMPUTED VALUES ===
    const isAI = message.sender === "ai";
    const isSystem = message.sender === "system";
    const bubbleAlignment = isCurrentUser ? "flex-row-reverse" : "flex-row";
    const bubbleVariant = isCurrentUser 
      ? "default" 
      : isAI 
      ? variant 
      : "outlined";

    const formatTimestamp = (date: Date) => {
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: it 
      });
    };

    // === RENDER ===
    return (
      <div
        ref={ref}
        className={cn(
          "flex gap-3 max-w-4xl",
          bubbleAlignment,
          isSystem && "justify-center",
          className
        )}
        {...props}
      >
        {/* Avatar */}
        {showAvatar && !isSystem && (
          <div className="flex-shrink-0">
            {user?.role && !isCurrentUser ? (
              <AgriculturalAvatar
                role={user.role}
                name={user.name}
                src={user.avatar}
                status={user.status}
                size="sm"
              />
            ) : (
              <Avatar size="sm" variant={isCurrentUser ? "default" : "agricultural"}>
                {user?.avatar && (
                  <AvatarImage src={user.avatar} alt={user?.name || "User"} />
                )}
                <AvatarFallback type={isAI ? "farmer" : "user"}>
                  {isAI ? (
                    <Leaf className="h-4 w-4" />
                  ) : user?.name ? (
                    user.name.slice(0, 2).toUpperCase()
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}

        {/* Message Content */}
        <div className={cn(
          "flex-1 min-w-0",
          isCurrentUser && "flex justify-end"
        )}>
          <Card 
            variant={bubbleVariant}
            className={cn(
              "max-w-lg transition-all duration-200",
              isCurrentUser 
                ? "bg-primary text-primary-foreground" 
                : isSystem
                ? "bg-muted border-none text-center"
                : "",
              !isSystem && "hover:shadow-md"
            )}
          >
            <CardContent className={cn(
              "p-4",
              isSystem && "py-2 px-4"
            )}>
              {/* User name for group chats */}
              {!isCurrentUser && !isSystem && user?.name && (
                <div className="text-sm font-medium mb-2 text-muted-foreground">
                  {user.name}
                </div>
              )}

              {/* Message content */}
              <div className={cn(
                "text-sm leading-relaxed whitespace-pre-wrap",
                isSystem && "text-xs text-muted-foreground"
              )}>
                {message.content}
              </div>

              {/* AI Confidence */}
              {isAI && showConfidence && message.confidence && (
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge 
                    status={message.confidence > 0.8 ? "optimal" : "warning"}
                    size="xs"
                  >
                    Fiducia: {Math.round(message.confidence * 100)}%
                  </StatusBadge>
                </div>
              )}

              {/* Sources */}
              {isAI && showSources && message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="text-xs text-muted-foreground mb-2">
                    Fonti consultate:
                  </div>
                  <div className="space-y-1">
                    {message.sources.slice(0, 3).map((source) => (
                      <button
                        key={source.id}
                        onClick={() => handleSourceClick(source)}
                        className="block w-full text-left p-2 rounded bg-accent/50 hover:bg-accent transition-colors"
                      >
                        <div className="text-xs font-medium truncate">
                          {source.title}
                        </div>
                        {source.excerpt && (
                          <div className="text-xs text-muted-foreground truncate">
                            {source.excerpt}
                          </div>
                        )}
                        {source.confidence && (
                          <div className="text-xs text-muted-foreground">
                            Rilevanza: {Math.round(source.confidence * 100)}%
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback buttons */}
              {isAI && showFeedback && onFeedback && !message.feedback && (
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Questa risposta è stata utile?
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleFeedback("positive")}
                    className="h-6 w-6"
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleFeedback("negative")}
                    className="h-6 w-6"
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Feedback given */}
              {message.feedback && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge 
                    variant={message.feedback === "positive" ? "optimal" : "attention"}
                    size="xs"
                  >
                    {message.feedback === "positive" ? (
                      <>
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Utile
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="h-3 w-3 mr-1" />
                        Non utile
                      </>
                    )}
                  </Badge>
                </div>
              )}

              {/* Message footer */}
              {!isSystem && (showTimestamp || showStatus) && (
                <div className={cn(
                  "mt-3 flex items-center justify-between text-xs",
                  isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  <div className="flex items-center gap-2">
                    {showTimestamp && (
                      <span>{formatTimestamp(message.timestamp)}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Copy button */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleCopy}
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    
                    {/* Message status */}
                    {showStatus && message.status && isCurrentUser && (
                      <div className="flex items-center gap-1">
                        {getStatusIcon(message.status)}
                      </div>
                    )}

                    {/* More actions */}
                    {onAction && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onAction("copy", message.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copia
                          </DropdownMenuItem>
                          {isCurrentUser && (
                            <DropdownMenuItem onClick={() => onAction("delete", message.id)}>
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Elimina
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Copy confirmation */}
          {copied && (
            <div className="mt-1 text-xs text-success text-center">
              Copiato!
            </div>
          )}
        </div>
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

// === MESSAGE GROUP ===
interface MessageGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const MessageGroup = React.forwardRef<HTMLDivElement, MessageGroupProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-4 group", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MessageGroup.displayName = "MessageGroup";

// === EXPORTS ===
export default MessageBubble;
export type { ChatMessage, MessageUser, MessageSource };