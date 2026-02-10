import { 
  TrendingUp, 
  Clock, 
  Users, 
  Shield, 
  Headphones, 
  GraduationCap 
} from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Aumente suas vendas",
    description: "CRM inteligente com follow-ups automáticos e scripts de vendas gerados por IA que convertem mais.",
  },
  {
    icon: Clock,
    title: "Economize tempo",
    description: "Automatize tarefas repetitivas e libere sua equipe para o que realmente importa.",
  },
  {
    icon: Users,
    title: "Escale seu atendimento",
    description: "Chatbots inteligentes que atendem milhares de clientes simultaneamente, 24 horas por dia.",
  },
  {
    icon: Shield,
    title: "Segurança total",
    description: "Seus dados protegidos com criptografia de ponta e controle de acessos granular.",
  },
  {
    icon: Headphones,
    title: "Suporte humano",
    description: "Equipe especializada disponível via WhatsApp para ajudar quando você precisar.",
  },
  {
    icon: GraduationCap,
    title: "Treinamento em IA",
    description: "Academy completa para capacitar você e sua equipe nas melhores práticas de IA.",
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="py-24 relative">
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-up">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Benefícios que <span className="text-gradient">transformam</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Descubra como a BridgeAI Hub pode revolucionar cada aspecto do seu negócio 
            com automação inteligente e suporte especializado.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="glass-card-hover p-8 group animate-fade-up"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary/30">
                <benefit.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
