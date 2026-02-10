import { Brain, Cpu, Network, Zap } from "lucide-react";

export function About() {
  return (
    <section id="about" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="animate-fade-up">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              O que é a <span className="text-gradient">BridgeAI Hub</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              A BridgeAI Hub é uma plataforma completa que conecta sua empresa ao poder da 
              inteligência artificial. Automatize processos, potencialize vendas, revolucione 
              o atendimento e capacite sua equipe com nossa tecnologia de ponta.
            </p>
            <p className="text-lg text-muted-foreground">
              Desenvolvida para empresas que buscam eficiência, escalabilidade e resultados 
              concretos. Uma única plataforma, infinitas possibilidades.
            </p>
          </div>

          {/* Visual */}
          <div className="grid grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            {[
              { icon: Brain, title: "IA Avançada", desc: "Chatbots inteligentes, análise de sentimentos e respostas personalizadas 24/7" },
              { icon: Zap, title: "Automação", desc: "Disparo de mensagens, follow-ups automáticos e qualificação de leads sem intervenção" },
              { icon: Network, title: "Integração", desc: "Conecte WhatsApp, Instagram, CRM, e-mail e mais de 50 ferramentas" },
              { icon: Cpu, title: "Performance", desc: "Dashboards com métricas de conversão, tempo de resposta e ROI em tempo real" },
            ].map((item, index) => (
              <div
                key={index}
                className="glass-card-hover p-6 group"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
