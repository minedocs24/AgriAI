/**
 * SearchInput Molecule per AgriAI
 * Componente di ricerca avanzato con suggerimenti, loading e clear
 */

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// === TYPES ===
export interface SearchSuggestion {
  id: string;
  text: string;
  category?: string;
  metadata?: Record<string, any>;
}

export interface SearchInputProps {
  /** Valore corrente della ricerca */
  value: string;
  /** Callback per cambio valore */
  onChange: (value: string) => void;
  /** Callback per submit ricerca */
  onSubmit?: (value: string) => void;
  /** Callback per selezione suggerimento */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Lista suggerimenti */
  suggestions?: SearchSuggestion[];
  /** Stato loading */
  loading?: boolean;
  /** Disabilita il componente */
  disabled?: boolean;
  /** Mostra pulsante clear */
  clearable?: boolean;
  /** Variante del tema */
  variant?: "default" | "agricultural" | "earth" | "harvest";
  /** Dimensione */
  size?: "sm" | "default" | "lg";
  /** CSS classes aggiuntive */
  className?: string;
  /** Callback per clear */
  onClear?: () => void;
  /** Numero massimo di suggerimenti da mostrare */
  maxSuggestions?: number;
  /** Mostra categorie nei suggerimenti */
  showCategories?: boolean;
  /** Delay per la ricerca in ms */
  searchDelay?: number;
}

// === SEARCH INPUT MOLECULE ===
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({
    value,
    onChange,
    onSubmit,
    onSuggestionSelect,
    placeholder = "Cerca...",
    suggestions = [],
    loading = false,
    disabled = false,
    clearable = true,
    variant = "default",
    size = "default",
    className,
    onClear,
    maxSuggestions = 8,
    showCategories = true,
    searchDelay = 300,
    ...props
  }, ref) => {
    // === STATE ===
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [internalLoading, setInternalLoading] = useState(false);
    
    // === REFS ===
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout>();
    
    // Combina ref interno con ref esterno
    React.useImperativeHandle(ref, () => inputRef.current!);

    // === FILTERED SUGGESTIONS ===
    const filteredSuggestions = React.useMemo(() => {
      if (!value.trim() || !suggestions.length) return [];
      
      const filtered = suggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(value.toLowerCase())
      ).slice(0, maxSuggestions);
      
      return filtered;
    }, [suggestions, value, maxSuggestions]);

    // === HANDLERS ===
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      
      // Reset selected index when typing
      setSelectedIndex(-1);
      
      // Open dropdown if there's a value
      setIsOpen(!!newValue.trim());
      
      // Debounced loading state
      if (searchDelay > 0) {
        setInternalLoading(true);
        
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
          setInternalLoading(false);
        }, searchDelay);
      }
    }, [onChange, searchDelay]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      if (onSubmit && value.trim()) {
        onSubmit(value.trim());
        setIsOpen(false);
      }
    }, [onSubmit, value]);

    const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
      onChange(suggestion.text);
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      }
      setIsOpen(false);
      setSelectedIndex(-1);
    }, [onChange, onSuggestionSelect]);

    const handleClear = useCallback(() => {
      onChange("");
      setIsOpen(false);
      setSelectedIndex(-1);
      if (onClear) {
        onClear();
      }
      inputRef.current?.focus();
    }, [onChange, onClear]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (!isOpen || !filteredSuggestions.length) {
        if (e.key === "Enter") {
          handleSubmit(e);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
          break;

        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
            handleSuggestionClick(filteredSuggestions[selectedIndex]);
          } else {
            handleSubmit(e);
          }
          break;

        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          break;

        case "Tab":
          setIsOpen(false);
          break;
      }
    }, [isOpen, filteredSuggestions, selectedIndex, handleSuggestionClick, handleSubmit]);

    // === EFFECTS ===
    
    // Close dropdown on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSelectedIndex(-1);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, []);

    // === RENDER ===
    const showClear = clearable && value && !loading;
    const showLoading = loading || internalLoading;
    const showDropdown = isOpen && filteredSuggestions.length > 0;

    return (
      <div ref={containerRef} className={cn("relative", className)}>
        <form onSubmit={handleSubmit} className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(!!value.trim())}
            placeholder={placeholder}
            disabled={disabled}
            variant={variant}
            size={size}
            startIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            endIcon={
              <div className="flex items-center gap-1">
                {showLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {showClear && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleClear}
                    className="h-6 w-6 hover:bg-accent rounded-full"
                    aria-label="Cancella ricerca"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {filteredSuggestions.length > 0 && (
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )} 
                  />
                )}
              </div>
            }
            className={cn(
              "pr-12", // Space for icons
              showLoading && "pr-16",
              className
            )}
            {...props}
          />
        </form>

        {/* Suggestions Dropdown */}
        {showDropdown && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-hidden shadow-lg">
            <CardContent className="p-0">
              <div className="max-h-80 overflow-auto">
                {filteredSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 cursor-pointer border-b last:border-b-0 transition-colors",
                      index === selectedIndex 
                        ? "bg-accent text-accent-foreground" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {suggestion.text}
                      </div>
                      {suggestion.metadata?.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {suggestion.metadata.description}
                        </div>
                      )}
                    </div>
                    
                    {showCategories && suggestion.category && (
                      <Badge 
                        variant="outline" 
                        size="sm"
                        className="ml-2 flex-shrink-0"
                      >
                        {suggestion.category}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Footer with count */}
              {filteredSuggestions.length > 0 && (
                <div className="border-t bg-muted/50 px-4 py-2">
                  <div className="text-xs text-muted-foreground">
                    {filteredSuggestions.length} di {suggestions.length} risultati
                    {filteredSuggestions.length === maxSuggestions && " (limitati)"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

// === SEARCH INPUT GROUP ===
interface SearchInputGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const SearchInputGroup = React.forwardRef<HTMLDivElement, SearchInputGroupProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SearchInputGroup.displayName = "SearchInputGroup";

// === EXPORTS ===
export default SearchInput;