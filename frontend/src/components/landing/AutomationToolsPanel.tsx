import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Share2, 
  Users, 
  Bot, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const tools = [
  {
    id: 1,
    title: "CRM + WhatsApp em Massa",
    description: "Gerencie seus clientes e envie mensagens em massa pelo WhatsApp de forma automatizada e personalizada.",
    icon: MessageSquare,
    color: "from-green-500 to-emerald-600",
    features: ["Gestão de contatos", "Envio em massa", "Templates personalizados", "Relatórios de entrega"]
  },
  {
    id: 2,
    title: "Gestão de Redes Sociais",
    description: "Publique em todas as redes sociais simultaneamente com agendamento inteligente.",
    icon: Share2,
    color: "from-purple-500 to-pink-600",
    features: ["Multi-plataforma", "Agendamento", "Calendário editorial", "Analytics unificado"]
  },
  {
    id: 3,
    title: "Automação de Redes Sociais",
    description: "Automatize ações de seguir e deixar de seguir para crescimento orgânico.",
    icon: Users,
    color: "from-rose-500 to-red-600",
    features: ["Follow automático", "Unfollow inteligente", "Filtros avançados", "Limites de segurança"]
  },
  {
    id: 4,
    title: "Chatbot Inteligente",
    description: "Atendimento automatizado 24/7 com inteligência artificial avançada.",
    icon: Bot,
    color: "from-indigo-500 to-violet-600",
    features: ["IA conversacional", "Atendimento 24/7", "Integração WhatsApp", "Escalação automática"]
  },
  {
    id: 5,
    title: "Assistente Virtual IA",
    description: "Crie seu próprio modelo virtual personalizado para atendimento e suporte.",
    icon: Sparkles,
    color: "from-fuchsia-500 to-purple-600",
    features: ["Avatar personalizado", "Voz sintetizada", "Personalidade única", "Treinamento customizado"]
  }
];

export function AutomationToolsPanel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % tools.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev - 1 + tools.length) % tools.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % tools.length);
  };

  const activeTool = tools[activeIndex];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Ferramentas de Automação
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Tudo que você precisa em <span className="text-gradient">uma plataforma</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            5 ferramentas poderosas para automatizar e escalar seu negócio
          </p>
        </motion.div>

        {/* Main Display */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
          {/* Active Tool Card */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTool.id}
                initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative"
              >
                {/* Glow Effect */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r rounded-3xl blur-2xl opacity-30",
                  activeTool.color
                )} />
                
                {/* Card */}
                <div className="relative glass-card p-8 rounded-3xl border border-white/10">
                  {/* Icon */}
                  <motion.div 
                    className={cn(
                      "w-20 h-20 rounded-2xl bg-gradient-to-r flex items-center justify-center mb-6",
                      activeTool.color
                    )}
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <activeTool.icon className="w-10 h-10 text-white" />
                  </motion.div>

                  {/* Content */}
                  <motion.h3 
                    className="font-display text-2xl md:text-3xl font-bold mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {activeTool.title}
                  </motion.h3>
                  
                  <motion.p 
                    className="text-muted-foreground text-lg mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {activeTool.description}
                  </motion.p>

                  {/* Features */}
                  <motion.div 
                    className="grid grid-cols-2 gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {activeTool.features.map((feature, idx) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full bg-gradient-to-r",
                          activeTool.color
                        )} />
                        <span className="text-muted-foreground">{feature}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Tools Grid */}
          <motion.div 
            className="grid grid-cols-4 gap-3"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {tools.map((tool, index) => (
              <motion.button
                key={tool.id}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setActiveIndex(index);
                }}
                className={cn(
                  "relative p-4 rounded-2xl transition-all duration-300 group",
                  index === activeIndex 
                    ? "glass-card border-primary/50 scale-105" 
                    : "bg-card/50 border border-border/50 hover:border-primary/30"
                )}
                whileHover={{ scale: index === activeIndex ? 1.05 : 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Active Indicator */}
                {index === activeIndex && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={cn(
                      "absolute inset-0 rounded-2xl bg-gradient-to-r opacity-20",
                      tool.color
                    )}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center mx-auto mb-2 transition-transform",
                  tool.color,
                  index === activeIndex ? "scale-110" : "group-hover:scale-105"
                )}>
                  <tool.icon className="w-6 h-6 text-white" />
                </div>
                
                <p className={cn(
                  "text-xs font-medium text-center line-clamp-2 transition-colors",
                  index === activeIndex ? "text-foreground" : "text-muted-foreground"
                )}>
                  {tool.title.split(' ').slice(0, 2).join(' ')}
                </p>

                {/* Progress indicator for active */}
                {index === activeIndex && isAutoPlaying && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-primary rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4, ease: "linear" }}
                    key={`progress-${activeIndex}`}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrev}
            className="p-3 rounded-full glass-card hover:bg-primary/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {tools.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setActiveIndex(index);
                }}
                className={cn(
                  "transition-all duration-300 rounded-full",
                  index === activeIndex 
                    ? "w-8 h-2 bg-primary" 
                    : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-3 rounded-full glass-card hover:bg-primary/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Tool Counter */}
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="text-5xl font-display font-bold text-gradient">
            {activeIndex + 1}
          </span>
          <span className="text-2xl text-muted-foreground font-display">
            /{tools.length}
          </span>
        </motion.div>
      </div>
    </section>
  );
}