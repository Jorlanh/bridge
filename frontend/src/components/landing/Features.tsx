import { 
  BarChart3, 
  MessageSquare, 
  Mail, 
  Share2, 
  Settings, 
  BookOpen,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const features = [
  {
    icon: BarChart3,
    title: "Automação de Marketing",
    items: ["Campanhas automáticas", "Geração de conteúdo com IA", "Agendamento de posts", "Funil de leads inteligente"],
  },
  {
    icon: MessageSquare,
    title: "Automação de Vendas",
    items: ["CRM inteligente", "Pipeline automatizado", "Follow-ups programados", "Scripts de vendas com IA"],
  },
  {
    icon: Mail,
    title: "Atendimento & Suporte",
    items: ["Chatbot com IA", "WhatsApp automatizado", "Central de tickets", "Respostas inteligentes"],
  },
  {
    icon: Share2,
    title: "Gestão de Redes Sociais",
    items: ["Planejador de conteúdo", "Gerador de posts", "Calendário editorial", "Métricas de engajamento"],
  },
  {
    icon: Settings,
    title: "Otimização de Processos",
    items: ["Fluxos automatizados", "Checklists inteligentes", "Automação de tarefas", "Painel de produtividade"],
  },
  {
    icon: BookOpen,
    title: "Academy de IA",
    items: ["Biblioteca de cursos", "Certificações", "Trilhas de aprendizado", "Consultoria em grupo"],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

export function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Automação <span className="text-gradient">completa</span> para empresas
          </h2>
          <p className="text-lg text-muted-foreground">
            Tudo que sua empresa precisa para operar de forma inteligente, 
            integrada e escalável em uma única plataforma.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="glass-card p-6 card-shine"
              variants={cardVariants}
              whileHover={{ 
                scale: 1.02, 
                y: -8,
                transition: { duration: 0.3 }
              }}
            >
              <div className="flex items-center gap-4 mb-5">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <feature.icon className="w-6 h-6 text-primary" />
                </motion.div>
                <h3 className="font-display font-semibold text-lg">{feature.title}</h3>
              </div>
              <ul className="space-y-3">
                {feature.items.map((item, itemIndex) => (
                  <motion.li 
                    key={itemIndex} 
                    className="flex items-center gap-3 text-muted-foreground"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: itemIndex * 0.1 }}
                  >
                    <motion.div 
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      whileHover={{ scale: 1.5 }}
                    />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link to="/dashboard">
            <Button variant="hero" size="xl" className="group">
              Explorar todas as funcionalidades
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
