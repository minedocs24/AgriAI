/**
 * Footer Organism per AgriAI
 * Componente footer con links organizzati, social, newsletter e informazioni legali
 */

import * as React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sprout,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Send,
  ExternalLink,
  Shield,
  FileText,
  Info,
  HelpCircle,
  Building,
  Leaf,
  Heart,
  Globe,
  ArrowUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";

// === TYPES ===
export interface FooterLink {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  external?: boolean;
  badge?: string;
}

export interface FooterSection {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  id: string;
  platform: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}

export interface FooterProps {
  /** Variante del layout */
  variant?: "default" | "minimal" | "extended";
  /** Mostra newsletter signup */
  showNewsletter?: boolean;
  /** Mostra social links */
  showSocial?: boolean;
  /** Mostra contact info */
  showContact?: boolean;
  /** Mostra back to top */
  showBackToTop?: boolean;
  /** Sezioni di link personalizzate */
  sections?: FooterSection[];
  /** Social links personalizzati */
  socialLinks?: SocialLink[];
  /** CSS classes aggiuntive */
  className?: string;
  /** Callback per newsletter signup */
  onNewsletterSignup?: (email: string) => void;
  /** Callback per social click */
  onSocialClick?: (platform: string) => void;
}

// === DEFAULT SECTIONS ===
const defaultSections: FooterSection[] = [
  {
    id: "platform",
    title: "Piattaforma",
    links: [
      {
        id: "chat",
        label: "Chat AgriAI",
        href: "/chat",
        icon: Sprout
      },
      {
        id: "documents",
        label: "Biblioteca Documenti",
        href: "/backend",
        icon: FileText
      },
      {
        id: "backend",
        label: "Dashboard",
        href: "/backend",
        icon: Building
      },
      {
        id: "api",
        label: "API",
        href: "/api/docs",
        icon: Globe,
        external: true,
        badge: "Beta"
      }
    ]
  },
  {
    id: "resources",
    title: "Risorse",
    links: [
      {
        id: "documentation",
        label: "Documentazione",
        href: "/docs",
        icon: FileText
      },
      {
        id: "guides",
        label: "Guide",
        href: "/guides",
        icon: HelpCircle
      },
      {
        id: "faq",
        label: "FAQ",
        href: "/faq",
        icon: Info
      },
      {
        id: "blog",
        label: "Blog",
        href: "/blog",
        icon: Leaf
      }
    ]
  },
  {
    id: "company",
    title: "Azienda",
    links: [
      {
        id: "about",
        label: "Chi siamo",
        href: "/about",
        icon: Building
      },
      {
        id: "careers",
        label: "Lavora con noi",
        href: "/careers",
        icon: Heart
      },
      {
        id: "partners",
        label: "Partner",
        href: "/partners",
        icon: Leaf
      },
      {
        id: "contact",
        label: "Contatti",
        href: "/contact",
        icon: Mail
      }
    ]
  },
  {
    id: "legal",
    title: "Legale",
    links: [
      {
        id: "privacy",
        label: "Privacy Policy",
        href: "/privacy",
        icon: Shield
      },
      {
        id: "terms",
        label: "Termini di Servizio",
        href: "/terms",
        icon: FileText
      },
      {
        id: "cookies",
        label: "Cookie Policy",
        href: "/cookies",
        icon: Info
      },
      {
        id: "compliance",
        label: "Compliance",
        href: "/compliance",
        icon: Shield
      }
    ]
  }
];

// === DEFAULT SOCIAL LINKS ===
const defaultSocialLinks: SocialLink[] = [
  {
    id: "facebook",
    platform: "Facebook",
    href: "https://facebook.com/agriai",
    icon: Facebook,
    color: "#1877F2"
  },
  {
    id: "twitter",
    platform: "Twitter",
    href: "https://twitter.com/agriai",
    icon: Twitter,
    color: "#1DA1F2"
  },
  {
    id: "linkedin",
    platform: "LinkedIn",
    href: "https://linkedin.com/company/agriai",
    icon: Linkedin,
    color: "#0A66C2"
  },
  {
    id: "instagram",
    platform: "Instagram",
    href: "https://instagram.com/agriai",
    icon: Instagram,
    color: "#E4405F"
  },
  {
    id: "youtube",
    platform: "YouTube",
    href: "https://youtube.com/@agriai",
    icon: Youtube,
    color: "#FF0000"
  }
];

// === FOOTER ORGANISM ===
export const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({
    variant = "default",
    showNewsletter = true,
    showSocial = true,
    showContact = true,
    showBackToTop = true,
    sections = defaultSections,
    socialLinks = defaultSocialLinks,
    className,
    onNewsletterSignup,
    onSocialClick,
    ...props
  }, ref) => {
    // === HOOKS ===
    const navigate = useNavigate();
    const { resolvedTheme } = useTheme();
    const { toast } = useToast();

    // === STATE ===
    const [newsletterEmail, setNewsletterEmail] = useState("");
    const [newsletterLoading, setNewsletterLoading] = useState(false);

    // === COMPUTED VALUES ===
    const isMinimal = variant === "minimal";
    const isExtended = variant === "extended";
    const currentYear = new Date().getFullYear();

    // === HANDLERS ===
    const handleLinkClick = (link: FooterLink) => {
      if (link.external) {
        window.open(link.href, '_blank', 'noopener,noreferrer');
      } else {
        navigate(link.href);
      }
    };

    const handleSocialClick = (social: SocialLink) => {
      if (onSocialClick) {
        onSocialClick(social.platform);
      }
      window.open(social.href, '_blank', 'noopener,noreferrer');
    };

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!newsletterEmail.trim()) {
        toast({
          title: "Email richiesta",
          description: "Inserisci il tuo indirizzo email",
          variant: "destructive"
        });
        return;
      }

      setNewsletterLoading(true);

      try {
        if (onNewsletterSignup) {
          await onNewsletterSignup(newsletterEmail);
        } else {
          // Default newsletter signup
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        }

        toast({
          title: "Iscrizione completata!",
          description: "Ti terremo aggiornato sulle novità di AgriAI",
          variant: "default"
        });

        setNewsletterEmail("");
      } catch (error) {
        toast({
          title: "Errore nell'iscrizione",
          description: "Riprova più tardi",
          variant: "destructive"
        });
      } finally {
        setNewsletterLoading(false);
      }
    };

    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // === RENDER HELPERS ===
    const renderLogo = () => (
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-growth to-harvest rounded-xl">
          <Sprout className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold">AgriAI</h3>
          <p className="text-sm text-muted-foreground">
            Il futuro dell'agricoltura intelligente
          </p>
        </div>
      </div>
    );

    const renderContactInfo = () => {
      if (!showContact || isMinimal) return null;

      return (
        <div className="space-y-4">
          <h4 className="font-semibold">Contatti</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Via dell'Innovazione 123, Milano, IT</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>+39 02 1234 5678</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>info@agriai.com</span>
            </div>
          </div>
        </div>
      );
    };

    const renderNewsletter = () => {
      if (!showNewsletter || isMinimal) return null;

      return (
        <Card className="bg-gradient-to-r from-agricultural/5 to-earth/5 border-agricultural/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-agricultural" />
              Newsletter AgriAI
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ricevi aggiornamenti su normative, tecnologie e opportunità del settore agricolo
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="La tua email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                variant="agricultural"
                disabled={newsletterLoading}
              />
              <Button
                type="submit"
                variant="agricultural"
                className="w-full gap-2"
                loading={newsletterLoading}
                loadingText="Iscrivendo..."
              >
                <Send className="h-4 w-4" />
                Iscriviti
              </Button>
            </form>
          </CardContent>
        </Card>
      );
    };

    const renderSocialLinks = () => {
      if (!showSocial) return null;

      return (
        <div className="space-y-4">
          <h4 className="font-semibold">Seguici</h4>
          <div className="flex flex-wrap gap-3">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <Button
                  key={social.id}
                  variant="outline"
                  size="icon"
                  onClick={() => handleSocialClick(social)}
                  className="hover:scale-105 transition-transform"
                  title={social.platform}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
        </div>
      );
    };

    const renderFooterSections = () => {
      if (isMinimal) return null;

      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {sections.map((section) => (
            <div key={section.id} className="space-y-4">
              <h4 className="font-semibold">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.id}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-normal text-muted-foreground hover:text-foreground justify-start gap-2"
                        onClick={() => handleLinkClick(link)}
                      >
                        {Icon && <Icon className="h-3 w-3" />}
                        <span>{link.label}</span>
                        {link.external && <ExternalLink className="h-3 w-3" />}
                        {link.badge && (
                          <Badge variant="outline" size="xs">
                            {link.badge}
                          </Badge>
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      );
    };

    const renderCopyright = () => (
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>© {currentYear} AgriAI. Tutti i diritti riservati.</span>
          <Badge variant="earth" size="xs">
            Made in Italy
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <span>Versione 1.2.0</span>
          {resolvedTheme && (
            <Badge variant="outline" size="xs">
              Tema: {resolvedTheme}
            </Badge>
          )}
        </div>
      </div>
    );

    const renderBackToTop = () => {
      if (!showBackToTop) return null;

      return (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 shadow-lg"
          title="Torna su"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      );
    };

    // === RENDER ===
    if (isMinimal) {
      return (
        <footer
          ref={ref}
          className={cn(
            "border-t bg-background py-6",
            className
          )}
          {...props}
        >
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {renderLogo()}
              {renderSocialLinks()}
            </div>
            <Separator className="my-4" />
            {renderCopyright()}
          </div>
          {renderBackToTop()}
        </footer>
      );
    }

    return (
      <footer
        ref={ref}
        className={cn(
          "border-t bg-background",
          className
        )}
        {...props}
      >
        <div className="container mx-auto px-4">
          {/* Main footer content */}
          <div className="py-12 space-y-12">
            {/* Top section with logo and newsletter */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {renderLogo()}
                <p className="text-muted-foreground max-w-md">
                  AgriAI è la piattaforma di intelligenza artificiale che trasforma 
                  l'agricoltura italiana, fornendo supporto normativo, tecnologico e 
                  gestionale alle aziende agricole.
                </p>
                {renderContactInfo()}
                {renderSocialLinks()}
              </div>
              
              <div className="flex justify-end">
                {renderNewsletter()}
              </div>
            </div>

            {/* Links sections */}
            {renderFooterSections()}

            {/* Extended features */}
            {isExtended && (
              <div className="space-y-6">
                <Separator />
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h5 className="font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-success" />
                      Sicurezza & Privacy
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      I tuoi dati sono protetti con crittografia end-to-end 
                      e conformi al GDPR europeo.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-medium flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-growth" />
                      Sostenibilità
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      Committed to sustainable agriculture and carbon neutrality 
                      through innovative AI solutions.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-medium flex items-center gap-2">
                      <Building className="h-4 w-4 text-earth" />
                      Supporto Enterprise
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      Soluzioni personalizzate per grandi aziende agricole 
                      e organizzazioni del settore.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom section */}
          <div className="border-t py-6">
            {renderCopyright()}
          </div>
        </div>

        {renderBackToTop()}
      </footer>
    );
  }
);

Footer.displayName = "Footer";

// === FOOTER VARIANTS ===
export const MinimalFooter = React.forwardRef<HTMLElement, Omit<FooterProps, 'variant'>>(
  (props, ref) => {
    return <Footer {...props} ref={ref} variant="minimal" />;
  }
);

MinimalFooter.displayName = "MinimalFooter";

export const ExtendedFooter = React.forwardRef<HTMLElement, Omit<FooterProps, 'variant'>>(
  (props, ref) => {
    return <Footer {...props} ref={ref} variant="extended" />;
  }
);

ExtendedFooter.displayName = "ExtendedFooter";

// === EXPORTS ===
export default Footer;
export type { FooterSection, FooterLink, SocialLink };