import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "O que é a BridgeAI Hub?",
    answer: "A BridgeAI Hub é uma plataforma SaaS completa de automação inteligente para empresas, focada em marketing, vendas, atendimento, suporte, otimização de processos, redes sociais e treinamento em Inteligência Artificial."
  },
  {
    question: "Como funciona a automação de marketing?",
    answer: "Nossa automação de marketing utiliza IA para criar campanhas personalizadas, segmentar audiências, programar publicações em redes sociais e analisar métricas de performance em tempo real, aumentando o ROI das suas ações."
  },
  {
    question: "A BridgeAI integra com WhatsApp?",
    answer: "Sim! Oferecemos integração completa com WhatsApp para atendimento automatizado via chatbots inteligentes, além de suporte humano quando necessário, garantindo uma experiência fluida para seus clientes."
  },
  {
    question: "O que é a BridgeAI Academy?",
    answer: "É nossa plataforma de educação em IA integrada, oferecendo cursos, tutoriais e certificações para capacitar sua equipe nas melhores práticas de inteligência artificial aplicada aos negócios."
  },
  {
    question: "Posso testar a plataforma antes de contratar?",
    answer: "Sim, oferecemos uma demonstração personalizada gratuita onde você pode conhecer todas as funcionalidades da plataforma e entender como ela pode beneficiar sua empresa."
  },
  {
    question: "Quais tipos de empresas podem usar a BridgeAI?",
    answer: "A BridgeAI é ideal para empresas de todos os portes, desde startups até grandes corporações, em diversos segmentos como varejo, serviços, tecnologia, saúde, educação e mais."
  },
  {
    question: "Como funciona o suporte técnico?",
    answer: "Oferecemos suporte técnico via WhatsApp, email e chat na plataforma. Dependendo do seu plano, você tem acesso a suporte prioritário com tempo de resposta reduzido e gerente de conta dedicado."
  },
  {
    question: "A plataforma é segura?",
    answer: "Absolutamente! Utilizamos criptografia de ponta a ponta, servidores seguros e estamos em conformidade com a LGPD. Seus dados e os dados dos seus clientes estão sempre protegidos."
  },
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer: "Sim, você pode cancelar sua assinatura a qualquer momento sem multas ou taxas adicionais. Seus dados ficam disponíveis por 30 dias após o cancelamento para exportação."
  },
  {
    question: "O que está incluído na consultoria em grupo?",
    answer: "A consultoria em grupo inclui sessões semanais ao vivo com especialistas em IA e automação, onde você pode tirar dúvidas, aprender estratégias avançadas e trocar experiências com outros empresários."
  },
  {
    question: "Como a IA ajuda no atendimento ao cliente?",
    answer: "Nossa IA analisa conversas em tempo real, sugere respostas, identifica sentimentos do cliente, prioriza atendimentos urgentes e pode resolver automaticamente questões simples, liberando sua equipe para casos mais complexos."
  },
  {
    question: "Vocês oferecem treinamento para minha equipe?",
    answer: "Sim! Além da BridgeAI Academy, oferecemos treinamentos personalizados in-company, webinars exclusivos e materiais de apoio para garantir que sua equipe aproveite 100% da plataforma."
  },
  {
    question: "Quanto tempo leva para implementar a BridgeAI?",
    answer: "A implementação básica pode ser feita em poucos dias. Para integrações mais complexas e personalizações avançadas, nossa equipe técnica acompanha todo o processo, que geralmente leva de 2 a 4 semanas."
  },
  {
    question: "A BridgeAI integra com outras ferramentas?",
    answer: "Sim! Temos integrações nativas com CRMs populares, plataformas de e-commerce, ferramentas de email marketing, ERPs e muito mais. Também oferecemos API para integrações personalizadas."
  },
  {
    question: "Como posso acompanhar os resultados?",
    answer: "A plataforma oferece dashboards completos com métricas em tempo real, relatórios automatizados, análises de performance e insights gerados por IA para ajudar na tomada de decisões estratégicas."
  }
];

const FAQ = () => {
  return (
    <section id="faq" className="py-24 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Tire suas dúvidas</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Perguntas{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Frequentes
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Encontre respostas para as dúvidas mais comuns sobre a BridgeAI Hub
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl px-6 data-[state=open]:bg-card/80 transition-all duration-300 hover:border-primary/30"
                >
                  <AccordionTrigger className="text-left text-lg font-medium hover:no-underline hover:text-primary transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground">
            Ainda tem dúvidas?{" "}
            <a href="#contact" className="text-primary hover:underline font-medium">
              Entre em contato
            </a>{" "}
            com nossa equipe
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
