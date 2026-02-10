import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { openWhatsApp } from "@/lib/utils";

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="glass-card p-12 md:p-16 text-center max-w-4xl mx-auto animate-fade-up">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Pronto para ter um <span className="text-gradient">cérebro digital</span> na sua empresa?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já automatizaram seus processos 
            e multiplicaram seus resultados com a BridgeAI Hub.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button variant="hero" size="xl" className="group">
                Começar agora
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button 
              variant="heroOutline" 
              size="xl" 
              className="group"
              onClick={() => openWhatsApp("+5519995555280", "Olá! Gostaria de falar com um especialista da BridgeAI Hub.")}
            >
              <MessageCircle className="w-5 h-5" />
              Falar com especialista
            </Button>
          </div>

          <p className="mt-8 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            IA ATIVA 24 HORAS &nbsp; ✓ Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  );
}
