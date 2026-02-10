import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Users, TrendingUp, Gift, CheckCircle, Star, Zap, Award, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { openWhatsApp } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { useState } from "react";

const benefits = [
  {
    icon: DollarSign,
    title: "Comissões de até 30%",
    description: "Ganhe comissões recorrentes em cada venda que você indicar. Quanto mais vende, mais ganha."
  },
  {
    icon: TrendingUp,
    title: "Renda Passiva",
    description: "Receba comissões mensais enquanto seus indicados permanecerem ativos na plataforma."
  },
  {
    icon: Gift,
    title: "Bônus Exclusivos",
    description: "Alcance metas e desbloqueie bônus especiais, prêmios e viagens exclusivas para top afiliados."
  },
  {
    icon: Users,
    title: "Suporte Dedicado",
    description: "Conte com nossa equipe de suporte exclusiva para afiliados e materiais de marketing prontos."
  }
];

const steps = [
  {
    number: "01",
    title: "Cadastre-se",
    description: "Preencha o formulário e aguarde a aprovação da nossa equipe."
  },
  {
    number: "02",
    title: "Receba seu Link",
    description: "Após aprovado, você receberá seu link exclusivo de afiliado."
  },
  {
    number: "03",
    title: "Divulgue",
    description: "Compartilhe seu link nas redes sociais, grupos e com sua audiência."
  },
  {
    number: "04",
    title: "Lucre",
    description: "Receba comissões por cada cliente que assinar através do seu link."
  }
];

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Afiliado Premium",
    earnings: "R$ 12.500/mês",
    quote: "Em 6 meses como afiliado, substituí minha renda do emprego. A BridgeAI Hub mudou minha vida!",
    avatar: "CS"
  },
  {
    name: "Amanda Oliveira",
    role: "Top Afiliada",
    earnings: "R$ 8.200/mês",
    quote: "O suporte é incrível e o produto praticamente se vende sozinho. Recomendo demais!",
    avatar: "AO"
  },
  {
    name: "Roberto Santos",
    role: "Afiliado Bronze",
    earnings: "R$ 3.800/mês",
    quote: "Comecei há 3 meses e já tenho uma renda extra consistente. Muito satisfeito!",
    avatar: "RS"
  }
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

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

export default function Afiliados() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = auth.isAuthenticated();

  // Se autenticado, usar layout do dashboard
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar
          mobileOpen={mobileMenuOpen}
          onMobileOpenChange={setMobileMenuOpen}
        />

        <div className="flex-1 flex flex-col w-full md:w-auto">
          <DashboardHeader
            title="Programa de Afiliados"
            subtitle="Ganhe dinheiro indicando a BridgeAI Hub"
            onMenuClick={() => setMobileMenuOpen(true)}
          />

          <main className="flex-1 p-6 overflow-auto">
            <AfiliadosContent />
          </main>
        </div>
      </div>
    );
  }

  // Se não autenticado, usar layout da landing page
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AfiliadosContent />
      <Footer />
    </div>
  );
}

function AfiliadosContent() {
  const isAuthenticated = auth.isAuthenticated();
  
  return (
    <>
      
      {/* Hero Section */}
      <section className={`relative ${isAuthenticated ? 'min-h-[60vh] py-12' : 'min-h-screen'} flex items-center justify-center overflow-hidden ${isAuthenticated ? '' : 'pt-16'}`}>
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.2, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Award className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                PROGRAMA DE AFILIADOS
              </span>
            </motion.div>

            <motion.h1 
              className="font-display text-5xl md:text-7xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Ganhe <span className="text-gradient">dinheiro</span> indicando a melhor plataforma de IA
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Torne-se afiliado BridgeAI Hub e construa uma renda passiva recorrente. 
              Comissões de até 30% em cada venda!
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <Button 
                variant="hero" 
                size="xl" 
                className="group"
                onClick={() => openWhatsApp("+5519995555280", "Olá! Quero me tornar um afiliado BridgeAI Hub!")}
              >
                Quero ser afiliado
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              {[
                { value: "30%", label: "Comissão" },
                { value: "500+", label: "Afiliados ativos" },
                { value: "R$ 2M+", label: "Pago em comissões" },
                { value: "24h", label: "Suporte" },
              ].map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="glass-card p-4"
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <div className="font-display text-3xl md:text-4xl font-bold text-gradient mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Benefits Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Por que ser afiliado?</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Benefícios <span className="text-gradient">exclusivos</span> para você
            </h2>
            <p className="text-xl text-muted-foreground">
              Oferecemos as melhores condições do mercado para nossos afiliados crescerem junto conosco.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  className="glass-card p-8 text-center group"
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                >
                  <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 relative bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Como funciona?</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Comece em <span className="text-gradient">4 passos simples</span>
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative text-center"
                variants={itemVariants}
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                <div className="relative z-10 inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/50 mb-6">
                  <span className="font-display text-3xl font-bold text-primary-foreground">{step.number}</span>
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Depoimentos</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              O que nossos <span className="text-gradient">afiliados</span> dizem
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="glass-card p-8"
                variants={itemVariants}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium mb-4">
                  <DollarSign className="w-4 h-4" />
                  {testimonial.earnings}
                </div>
                <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="glass-card p-12 md:p-16 text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Pronto para começar a <span className="text-gradient">ganhar dinheiro</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Junte-se a centenas de afiliados que já estão lucrando com a BridgeAI Hub.
              Vagas limitadas!
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                variant="hero" 
                size="xl" 
                className="group"
                onClick={() => openWhatsApp("+5519995555280", "Olá! Quero me tornar um afiliado BridgeAI Hub!")}
              >
                Quero ser afiliado agora
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button 
                variant="heroOutline" 
                size="xl" 
                className="group"
                onClick={() => openWhatsApp("+5519995555280", "Olá! Tenho dúvidas sobre o programa de afiliados.")}
              >
                <MessageCircle className="w-5 h-5" />
                Tirar dúvidas
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Cadastro gratuito
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Sem mensalidade
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Pagamento semanal
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
