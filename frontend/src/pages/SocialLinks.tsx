import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Youtube, 
  MessageCircle,
  Share2,
  Globe2,
  ArrowRight
} from "lucide-react";
import { openWhatsApp } from "@/lib/utils";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useState } from "react";

const socialNetworks = [
  {
    name: "Instagram",
    handle: "@bridgeai.tec",
    description: "Conteúdos diários sobre IA, automação, bastidores e cases reais.",
    url: "https://www.instagram.com/bridgeai.tec?igsh=aWIxOG5icTFpdW1h",
    icon: Instagram,
    colorClass: "text-pink-500",
    bgClass: "bg-pink-500/10",
    tag: "Conteúdo diário",
  },
  {
    name: "Facebook",
    handle: "BridgeAI Hub",
    description: "Comunidade, eventos e novidades para quem quer implementar IA no negócio.",
    url: "https://facebook.com/bridgeaihub",
    icon: Facebook,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-600/10",
    tag: "Comunidade",
  },
  {
    name: "LinkedIn",
    handle: "BridgeAI Hub",
    description: "Conteúdo estratégico, insights para negócios e oportunidades B2B.",
    url: "https://linkedin.com/company/bridgeaihub",
    icon: Linkedin,
    colorClass: "text-blue-700",
    bgClass: "bg-blue-700/10",
    tag: "B2B & Estratégia",
  },
  {
    name: "YouTube",
    handle: "BridgeAI Hub",
    description: "Aulas, tutoriais e demonstrações práticas de IA aplicada ao dia a dia.",
    url: "https://youtube.com/@bridgeaihub",
    icon: Youtube,
    colorClass: "text-red-500",
    bgClass: "bg-red-500/10",
    tag: "Vídeos & Aulas",
  },
];

const SocialLinks = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader
          title="Redes da BridgeAI"
          subtitle="Encontre todos os canais oficiais da BridgeAI Hub em um só lugar"
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-6 overflow-auto">
      {/* Hero */}
      <section className="pt-4 pb-12 relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-24 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 leading-tight">
              Conheça as{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                redes oficiais da BridgeAI Hub
              </span>
            </h1>

            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Acompanhe os canais oficiais da BridgeAI Hub com conteúdos, bastidores, novidades
              e materiais exclusivos sobre Inteligência Artificial e automação para empresas.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Lista de Redes */}
      <section className="pt-2 pb-4 relative">
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Escolha o melhor canal para você
            </h2>
            <p className="text-muted-foreground">
              Cada rede tem um estilo de conteúdo pensado para um tipo de momento:
              aprendizado, inspiração, estratégia ou bastidores.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {socialNetworks.map((network, index) => {
              const Icon = network.icon;
              return (
                <motion.div
                  key={network.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card className="group h-full bg-card/60 backdrop-blur-sm border-border/60 hover:border-primary/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer">
                    <CardContent
                      className="p-6 flex flex-col gap-4"
                      onClick={() => window.open(network.url, "_blank")}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center ${network.bgClass}`}
                        >
                          <Icon className={`w-6 h-6 ${network.colorClass}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                              {network.name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {network.tag}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {network.description}
                          </p>
                          <p className="text-xs text-primary font-medium">
                            {network.handle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Globe2 className="w-3 h-3" />
                          Abrir perfil oficial
                        </span>
                        <span className="inline-flex items-center gap-1 group-hover:text-primary transition-colors">
                          Ver conteúdo
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
        </main>
      </div>
    </div>
  );
};

export default SocialLinks;


