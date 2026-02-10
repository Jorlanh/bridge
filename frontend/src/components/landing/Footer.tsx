import { Brain, MapPin, Instagram, Linkedin, Mail, MessageCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { openWhatsApp } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="relative border-t border-border/50 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-6 py-12">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 mb-10">
          {/* Brand */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
              <Brain className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-display font-bold text-2xl">
                Bridge<span className="text-primary">AI</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              A ponte entre sua empresa e a inteligência artificial.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
              Preços
            </a>
            <Link to="/afiliados" className="text-muted-foreground hover:text-primary transition-colors">
              Afiliados
            </Link>
            <Link to="/quem-somos" className="text-muted-foreground hover:text-primary transition-colors">
              Quem Somos
            </Link>
          </div>

          {/* Contact & Social */}
          <div className="flex flex-col items-center lg:items-end gap-4">
            <div className="flex items-center gap-3">
              <a 
                href="mailto:suporte@bridgeai.com.br" 
                className="p-2 rounded-full bg-muted/80 hover:bg-primary/20 hover:text-primary transition-all"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); openWhatsApp("+5519995555280", "Olá! Preciso de suporte da BridgeAI Hub."); }}
                className="p-2 rounded-full bg-muted/80 hover:bg-primary/20 hover:text-primary transition-all"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <div className="w-px h-4 bg-border" />
              <a href="#" className="p-2 rounded-full bg-muted/80 hover:bg-primary/20 hover:text-primary transition-all" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-muted/80 hover:bg-primary/20 hover:text-primary transition-all" aria-label="TikTok">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a href="#" className="p-2 rounded-full bg-muted/80 hover:bg-primary/20 hover:text-primary transition-all" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" />
                <span>Florianópolis</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" />
                <span>Goiânia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span>© 2026 BridgeAI Hub</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1 text-primary/70">
              <Sparkles className="w-3 h-3" />
              Desenvolvido com IA
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacidade" className="hover:text-primary transition-colors">Privacidade</Link>
            <Link to="/termos" className="hover:text-primary transition-colors">Termos</Link>
            <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
