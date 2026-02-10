import { motion } from "framer-motion";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Target, 
  Shield, 
  Zap, 
  HeartHandshake, 
  TrendingUp, 
  Brain,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { openWhatsApp } from "@/lib/utils";

const teamMembers = [
  {
    name: "Sacha Begara",
    role: "Fundador & Estrategista de IA",
    specialty: "Visão de Negócios & IA Generativa",
    description: "Especialista em alinhar estratégias de negócios com soluções de Inteligência Artificial para maximizar resultados.",
    image: "",
    initials: "SB"
  },
  {
    name: "Jota Heider",
    role: "Desenvolvedor Full Stack",
    specialty: "Arquitetura de Sistemas & APIs",
    description: "Especialista em criar soluções que transformam processos manuais em sistemas inteligentes e escaláveis.",
    image: "",
    initials: "JH"
  },
  {
    name: "Gabriela",
    role: "Especialista em Automação",
    specialty: "Workflows & Integrações",
    description: "Focada em automatizar fluxos de trabalho complexos e integrar ferramentas para máxima eficiência.",
    image: "",
    initials: "G"
  },
  {
    name: "Leia Nascimento",
    role: "Especialista em Marketing Digital",
    specialty: "Growth & Conversão",
    description: "Combina estratégias de marketing com IA para acelerar o crescimento e aumentar conversões.",
    image: "",
    initials: "LN"
  },
  {
    name: "Camila Santos",
    role: "Consultora de IA para Negócios",
    specialty: "Transformação Digital",
    description: "Ajuda empresas a identificar oportunidades de aplicação de IA que geram impacto real nos resultados.",
    image: "",
    initials: "CS"
  },
  {
    name: "Maria Eduarda",
    role: "Suporte Técnico & Sucesso do Cliente",
    specialty: "Onboarding & Relacionamento",
    description: "Garante que cada cliente tenha uma experiência excepcional e alcance seus objetivos com a plataforma.",
    image: "",
    initials: "ME"
  }
];

const trustReasons = [
  {
    icon: Zap,
    title: "Experiência prática em automação",
    description: "Anos de experiência implementando soluções reais para empresas de todos os tamanhos."
  },
  {
    icon: Target,
    title: "Foco em aplicação real para empresas",
    description: "Não vendemos teoria. Entregamos soluções que funcionam no dia a dia do seu negócio."
  },
  {
    icon: HeartHandshake,
    title: "Atendimento humano e próximo",
    description: "Por trás da tecnologia, pessoas reais que entendem suas necessidades."
  },
  {
    icon: TrendingUp,
    title: "Atualização constante em IA",
    description: "Sempre na vanguarda das últimas inovações em Inteligência Artificial."
  },
  {
    icon: Shield,
    title: "Visão estratégica de negócios",
    description: "Unimos tecnologia com entendimento profundo de como empresas crescem."
  }
];

const QuemSomos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Banner */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Conheça nossa equipe</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Pessoas que constroem a ponte entre{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                sua empresa
              </span>{" "}
              e a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">
                Inteligência Artificial
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Por trás da BridgeAI existe um time apaixonado por tecnologia, inovação 
              e resultados reais para empresas.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-display font-bold">Nossa Missão</h2>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Nossa missão é tornar a <span className="text-foreground font-medium">Inteligência Artificial acessível, 
              prática e estratégica</span> para qualquer empresa, independentemente do seu tamanho. 
              Acreditamos que toda empresa merece ter acesso às melhores ferramentas de automação e IA.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Cards */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Nosso Time
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Profissionais dedicados a transformar sua empresa com inteligência artificial
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 overflow-hidden">
                  {/* Avatar Container */}
                  <div className="pt-8 pb-4 flex flex-col items-center relative">
                    
                    {/* Avatar */}
                    <Avatar className="w-24 h-24 border-4 border-primary/20 group-hover:border-primary/50 transition-all duration-300 group-hover:scale-105">
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-foreground text-2xl font-semibold">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Specialty Badge */}
                    <span className="mt-4 px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      {member.specialty}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <CardContent className="p-6 pt-4">
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                      {member.name}
                    </h3>
                    <p className="text-sm text-primary font-medium mb-3">
                      {member.role}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {member.description}
                    </p>
                    
                    {/* Hover Effect Bar */}
                    <div className="mt-4 h-1 bg-gradient-to-r from-primary to-secondary rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Trust Us */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Por que confiar na{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                BridgeAI
              </span>
              ?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Mais do que tecnologia, oferecemos parceria e resultados comprovados
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {trustReasons.map((reason, index) => (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="group h-full bg-card/30 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:bg-card/50">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                      <reason.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {reason.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {reason.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology with People */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5" />
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl -translate-y-1/2" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-6">
              <Brain className="w-4 h-4 text-secondary" />
              <span className="text-sm text-secondary font-medium">Nosso diferencial</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Tecnologia com{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                pessoas
              </span>{" "}
              no centro
            </h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              A BridgeAI une o melhor da tecnologia com o melhor das pessoas. 
              Acreditamos que a IA só gera resultados quando é bem aplicada por 
              quem entende de negócios. Por isso, cada solução que criamos é 
              pensada para o seu contexto específico.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/#pricing">
                <Button size="lg" className="group bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Ver nossos planos
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-primary/30 hover:bg-primary/10"
                onClick={() => openWhatsApp("+5519995555280", "Olá! Gostaria de falar com a equipe da BridgeAI Hub.")}
              >
                Falar com a equipe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default QuemSomos;
