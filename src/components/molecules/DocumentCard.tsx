/**
 * DocumentCard Molecule per AgriAI
 * Componente per visualizzazione documenti con metadata, azioni e progress
 */

import * as React from "react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import {
  FileText,
  File,
  Image,
  Video,
  Music,
  Archive,
  Link as LinkIcon,
  Download,
  Eye,
  Edit,
  Trash2,
  Share2,
  Copy,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Upload,
  Tag,
  Calendar,
  User,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge, AgriculturalBadge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// === TYPES ===
export type DocumentType = "pdf" | "doc" | "docx" | "txt" | "image" | "video" | "audio" | "zip" | "link" | "unknown";
export type DocumentStatus = "draft" | "processing" | "published" | "archived" | "error";

export interface DocumentMetadata {
  size?: number;
  pages?: number;
  duration?: number;
  resolution?: string;
  author?: string;
  uploadDate: Date;
  lastModified?: Date;
  tags?: string[];
  category?: string;
  confidence?: number;
  language?: string;
}

export interface DocumentAIAnalysis {
  summary?: string;
  extractedKeywords?: string[];
  scope?: string;
  confidence?: number;
  correlations?: string[];
  topics?: string[];
}

export interface DocumentProgress {
  stage: string;
  progress: number;
  eta?: Date;
  error?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  type: DocumentType;
  status: DocumentStatus;
  url?: string;
  thumbnailUrl?: string;
  metadata: DocumentMetadata;
  aiAnalysis?: DocumentAIAnalysis;
  progress?: DocumentProgress;
}

export interface DocumentCardProps {
  /** Documento da visualizzare */
  document: DocumentItem;
  /** Variante del layout */
  variant?: "default" | "compact" | "detailed" | "grid";
  /** Variante del tema */
  themeVariant?: "default" | "agricultural" | "earth" | "harvest";
  /** Mostra thumbnail */
  showThumbnail?: boolean;
  /** Mostra metadata */
  showMetadata?: boolean;
  /** Mostra AI analysis */
  showAIAnalysis?: boolean;
  /** Mostra azioni */
  showActions?: boolean;
  /** Mostra progress bar */
  showProgress?: boolean;
  /** CSS classes aggiuntive */
  className?: string;
  /** Callback per visualizzazione */
  onView?: (document: DocumentItem) => void;
  /** Callback per download */
  onDownload?: (document: DocumentItem) => void;
  /** Callback per modifica */
  onEdit?: (document: DocumentItem) => void;
  /** Callback per eliminazione */
  onDelete?: (document: DocumentItem) => void;
  /** Callback per condivisione */
  onShare?: (document: DocumentItem) => void;
  /** Callback per azioni personalizzate */
  onAction?: (action: string, document: DocumentItem) => void;
}

// === UTILITIES ===
const getFileIcon = (type: DocumentType, size: "sm" | "md" | "lg" = "md") => {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }[size];

  const iconMap = {
    pdf: <FileText className={cn(sizeClass, "text-red-500")} />,
    doc: <FileText className={cn(sizeClass, "text-blue-500")} />,
    docx: <FileText className={cn(sizeClass, "text-blue-500")} />,
    txt: <File className={cn(sizeClass, "text-gray-500")} />,
    image: <Image className={cn(sizeClass, "text-green-500")} />,
    video: <Video className={cn(sizeClass, "text-purple-500")} />,
    audio: <Music className={cn(sizeClass, "text-orange-500")} />,
    zip: <Archive className={cn(sizeClass, "text-yellow-500")} />,
    link: <LinkIcon className={cn(sizeClass, "text-sky-500")} />,
    unknown: <File className={cn(sizeClass, "text-gray-400")} />,
  };

  return iconMap[type] || iconMap.unknown;
};

const getStatusBadge = (status: DocumentStatus) => {
  const statusMap = {
    draft: { variant: "outline" as const, label: "Bozza", icon: Edit },
    processing: { variant: "monitoring" as const, label: "Elaborazione", icon: RefreshCw },
    published: { variant: "optimal" as const, label: "Pubblicato", icon: CheckCircle },
    archived: { variant: "attention" as const, label: "Archiviato", icon: Archive },
    error: { variant: "critical" as const, label: "Errore", icon: AlertCircle },
  };

  const config = statusMap[status];
  const IconComponent = config.icon;

  return (
    <StatusBadge status={status === "published" ? "optimal" : status === "error" ? "critical" : "warning"}>
      <IconComponent className="h-3 w-3 mr-1" />
      {config.label}
    </StatusBadge>
  );
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "";
  
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// === DOCUMENT CARD MOLECULE ===
export const DocumentCard = React.forwardRef<HTMLDivElement, DocumentCardProps>(
  ({
    document,
    variant = "default",
    themeVariant = "default",
    showThumbnail = true,
    showMetadata = true,
    showAIAnalysis = true,
    showActions = true,
    showProgress = true,
    className,
    onView,
    onDownload,
    onEdit,
    onDelete,
    onShare,
    onAction,
    ...props
  }, ref) => {
    // === STATE ===
    const [imageError, setImageError] = useState(false);

    // === COMPUTED VALUES ===
    const isProcessing = document.status === "processing";
    const hasProgress = isProcessing && document.progress;
    const isCompact = variant === "compact";
    const isGrid = variant === "grid";
    const isDetailed = variant === "detailed";

    // === HANDLERS ===
    const handleAction = (action: string) => {
      const actionMap = {
        view: onView,
        download: onDownload,
        edit: onEdit,
        delete: onDelete,
        share: onShare,
      };

      const handler = actionMap[action as keyof typeof actionMap];
      if (handler) {
        handler(document);
      } else if (onAction) {
        onAction(action, document);
      }
    };

    // === RENDER HELPERS ===
    const renderThumbnail = () => {
      if (!showThumbnail) return null;

      return (
        <div className={cn(
          "flex-shrink-0 flex items-center justify-center rounded-lg",
          isCompact ? "w-10 h-10" : isGrid ? "w-full h-32" : "w-16 h-16",
          !document.thumbnailUrl && "bg-muted"
        )}>
          {document.thumbnailUrl && !imageError ? (
            <img
              src={document.thumbnailUrl}
              alt={document.title}
              className={cn(
                "object-cover rounded-lg",
                isCompact ? "w-10 h-10" : isGrid ? "w-full h-32" : "w-16 h-16"
              )}
              onError={() => setImageError(true)}
            />
          ) : (
            getFileIcon(document.type, isCompact ? "sm" : "lg")
          )}
        </div>
      );
    };

    const renderMetadata = () => {
      if (!showMetadata && !isDetailed) return null;

      const metadata = document.metadata;
      
      return (
        <div className={cn(
          "text-xs text-muted-foreground space-y-1",
          isGrid && "mt-2"
        )}>
          <div className="flex items-center gap-4">
            {metadata.size && (
              <span>{formatFileSize(metadata.size)}</span>
            )}
            {metadata.pages && (
              <span>{metadata.pages} pagine</span>
            )}
            {metadata.author && (
              <span>di {metadata.author}</span>
            )}
          </div>
          
          <div>
            {formatDistanceToNow(metadata.uploadDate, { 
              addSuffix: true, 
              locale: it 
            })}
          </div>

          {isDetailed && metadata.tags && metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {metadata.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" size="xs">
                  <Tag className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
              {metadata.tags.length > 3 && (
                <Badge variant="outline" size="xs">
                  +{metadata.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      );
    };

    const renderAIAnalysis = () => {
      if (!showAIAnalysis || !document.aiAnalysis || !isDetailed) return null;

      const ai = document.aiAnalysis;

      return (
        <div className="mt-3 p-3 bg-accent/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Analisi AI</span>
            {ai.confidence && (
              <Badge variant="outline" size="xs">
                {Math.round(ai.confidence * 100)}%
              </Badge>
            )}
          </div>
          
          {ai.summary && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {ai.summary}
            </p>
          )}
          
          {ai.extractedKeywords && ai.extractedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {ai.extractedKeywords.slice(0, 4).map((keyword) => (
                <Badge key={keyword} variant="agricultural" size="xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </div>
      );
    };

    const renderProgress = () => {
      if (!showProgress || !hasProgress || !document.progress) return null;

      const progress = document.progress;

      return (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{progress.stage}</span>
            <span className="font-medium">{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="h-2" />
          {progress.eta && (
            <div className="text-xs text-muted-foreground">
              ETA: {formatDistanceToNow(progress.eta, { locale: it })}
            </div>
          )}
          {progress.error && (
            <div className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {progress.error}
            </div>
          )}
        </div>
      );
    };

    const renderActions = () => {
      if (!showActions) return null;

      return (
        <div className="flex items-center gap-1">
          {onView && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleAction("view")}
              title="Visualizza"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          
          {onDownload && document.type !== "link" && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleAction("download")}
              title="Scarica"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => handleAction("edit")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica
                </DropdownMenuItem>
              )}
              {onShare && (
                <DropdownMenuItem onClick={() => handleAction("share")}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Condividi
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleAction("copy")}>
                <Copy className="h-4 w-4 mr-2" />
                Copia Link
              </DropdownMenuItem>
              {onAction && (
                <DropdownMenuItem onClick={() => handleAction("reprocess")}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Riprocessa
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => handleAction("delete")}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    };

    // === RENDER ===
    return (
      <Card
        ref={ref}
        variant={themeVariant}
        interactive={!!onView}
        onCardClick={onView}
        className={cn(
          "transition-all duration-200",
          isProcessing && "animate-pulse",
          className
        )}
        {...props}
      >
        {/* Header with thumbnail and title */}
        <CardHeader className={cn(
          isCompact && "p-3",
          isGrid && "pb-2"
        )}>
          <div className={cn(
            "flex gap-3",
            isGrid ? "flex-col" : "items-start"
          )}>
            {renderThumbnail()}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className={cn(
                    "font-semibold truncate",
                    isCompact ? "text-sm" : "text-base"
                  )}>
                    {document.title}
                  </h3>
                  
                  {document.description && !isCompact && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {document.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusBadge(document.status)}
                  {showActions && !isGrid && renderActions()}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Content with metadata and AI analysis */}
        {(showMetadata || showAIAnalysis) && (
          <CardContent className={cn(
            isCompact && "p-3 pt-0",
            isGrid && "pt-0"
          )}>
            {renderMetadata()}
            {renderAIAnalysis()}
            {renderProgress()}
          </CardContent>
        )}

        {/* Footer with category and actions */}
        {(document.metadata.category || (showActions && isGrid)) && (
          <CardFooter className={cn(
            "justify-between",
            isCompact && "p-3 pt-0"
          )}>
            <div className="flex items-center gap-2">
              {document.metadata.category && (
                <AgriculturalBadge 
                  type="crop" 
                  status="good"
                  size="xs"
                >
                  {document.metadata.category}
                </AgriculturalBadge>
              )}
            </div>
            
            {showActions && isGrid && renderActions()}
          </CardFooter>
        )}
      </Card>
    );
  }
);

DocumentCard.displayName = "DocumentCard";

// === DOCUMENT GRID ===
interface DocumentGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export const DocumentGrid = React.forwardRef<HTMLDivElement, DocumentGridProps>(
  ({ children, columns = 3, gap = "md", className, ...props }, ref) => {
    const gapClasses = {
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-6",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          `grid-cols-1 md:grid-cols-${Math.min(columns, 2)} lg:grid-cols-${columns}`,
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DocumentGrid.displayName = "DocumentGrid";

// === EXPORTS ===
export default DocumentCard;
export type { DocumentItem, DocumentMetadata, DocumentAIAnalysis, DocumentProgress };