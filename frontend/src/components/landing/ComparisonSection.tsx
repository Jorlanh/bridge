import { motion } from "framer-motion";
import { 
  X, 
  Check, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  Users, 
  Brain, 
  Zap,
  AlertCircle,
  Sparkles,
  Target,
  BarChart3
} from "lucide-react";

const comparisonData = [
  {
    category: "Atendimento ao Cliente",
    withoutAI: "Limitado ao horário comercial, filas de espera longas",
    withAI: "24/7 automático, respostas instantâneas para milhares",
  },
  {
    category: "Gestão de Leads",
    withoutAI: "Follow-ups manuais, leads esquecidos e perdidos",
    withAI: "CRM inteligente com follow-ups automáticos e personalizados",
  },
  {
    category: "Produtividade",
    withoutAI: "Equipe sobrecarregada com tarefas repetitivas",
    withAI: "Automação de 80% das tarefas operacionais",
  },
  {
    category: "Análise de Dados",
    withoutAI: "Relatórios manuais, decisões baseadas em intuição",
    withAI: "Insights em tempo real com IA preditiva",
  },
  {
    category: "Escalabilidade",
    withoutAI: "Crescimento limitado pela capacidade da equipe",
    withAI: "Escale sem aumentar proporcionalmente os custos",
  },
  {
    category: "Vendas",
    withoutAI: "Scripts genéricos, baixa taxa de conversão",
    withAI: "Scripts otimizados por IA, conversão até 3x maior",
  },
];

const statsWithoutAI = [
  { icon: Clock, value: "8h", label: "Atendimento limitado" },
  { icon: TrendingDown, value: "-40%", label: "Produtividade perdida" },
  { icon: AlertCircle, value: "60%", label: "Leads não convertidos" },
];

const statsWithAI = [
  { icon: Zap, value: "24/7", label: "Atendimento contínuo" },
  { icon: TrendingUp, value: "+300%", label: "Aumento de eficiência" },
  { icon: Target, value: "85%", label: "Taxa de conversão" },
];

export function ComparisonSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center max-w-4xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Sua empresa <span className="text-gradient">com ou sem</span> automação?
          </h2>
          <p className="text-lg text-muted-foreground">
            Veja a diferença entre empresas que abraçam a inteligência artificial 
            e aquelas que ainda dependem de processos manuais.
          </p>
        </motion.div>

        {/* Main Comparison Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Without AI Column */}
          <motion.div
            className="glass-card p-8 border-destructive/30 relative overflow-hidden"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-destructive/50 to-destructive/20" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <X className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl">Sem Automação</h3>
                <p className="text-sm text-muted-foreground">Processos manuais</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {statsWithoutAI.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="w-5 h-5 mx-auto mb-2 text-destructive/70" />
                  <div className="font-display font-bold text-lg text-destructive">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Issues List */}
            <ul className="space-y-4">
              {comparisonData.map((item, index) => (
                <motion.li 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <X className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-sm block mb-1">{item.category}</span>
                    <span className="text-xs text-muted-foreground">{item.withoutAI}</span>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* BridgeAI Hub Column - Center */}
          <motion.div
            className="glass-card p-8 border-primary/50 relative overflow-hidden lg:-mt-4 lg:mb-4 shadow-xl shadow-primary/20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Brain className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-2xl">
                    Bridge<span className="text-primary">AI</span> Hub
                  </h3>
                  <p className="text-sm text-muted-foreground">A ponte para o futuro</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-8">
                Uma plataforma completa de automação empresarial com IA que transforma 
                a maneira como sua empresa opera, vende e atende.
              </p>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">CRM Inteligente com IA</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Chatbots Multicanal 24/7</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Automações N8N Ilimitadas</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Dashboards em Tempo Real</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Follow-ups Automáticos</span>
                </div>
              </div>

              {/* CTA */}
              <motion.div
                className="p-4 rounded-xl gradient-primary text-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <p className="text-primary-foreground font-display font-bold text-lg mb-1">
                  Transforme sua empresa
                </p>
                <p className="text-primary-foreground/80 text-sm">
                  Comece a automatizar em minutos
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* With AI Column */}
          <motion.div
            className="glass-card p-8 border-success/30 relative overflow-hidden"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success/50 to-success/20" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl">Com Automação</h3>
                <p className="text-sm text-muted-foreground">IA trabalhando 24/7</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {statsWithAI.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="w-5 h-5 mx-auto mb-2 text-success" />
                  <div className="font-display font-bold text-lg text-success">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Benefits List */}
            <ul className="space-y-4">
              {comparisonData.map((item, index) => (
                <motion.li 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/10"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-sm block mb-1">{item.category}</span>
                    <span className="text-xs text-muted-foreground">{item.withAI}</span>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Stats */}
        <motion.div 
          className="grid md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          {[
            { value: "80%", label: "Redução de tempo em tarefas repetitivas" },
            { value: "3x", label: "Aumento na taxa de conversão" },
            { value: "60%", label: "Menos custos operacionais" },
            { value: "10x", label: "Mais leads qualificados por mês" },
          ].map((stat, index) => (
            <div 
              key={index} 
              className="glass-card p-6 text-center"
            >
              <div className="font-display font-bold text-3xl text-gradient mb-2">
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
