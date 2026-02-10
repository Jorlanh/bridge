import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Política de <span className="text-gradient">Privacidade</span>
            </h1>
            <p className="text-muted-foreground mb-8">
              Última atualização: Janeiro de 2026
            </p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section className="glass-card p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">1. Introdução</h2>
                <p className="text-muted-foreground leading-relaxed">
                  A BridgeAI Hub ("nós", "nosso" ou "Empresa") está comprometida em proteger sua privacidade. 
                  Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas 
                  informações pessoais quando você utiliza nossa plataforma de automação com inteligência artificial.
                </p>
              </section>

              <section className="glass-card p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">2. Informações que Coletamos</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Podemos coletar os seguintes tipos de informações:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span><strong className="text-foreground">Dados de identificação:</strong> nome, e-mail, telefone, CPF/CNPJ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span><strong className="text-foreground">Dados de conta:</strong> informações de login, preferências, histórico de uso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span><strong className="text-foreground">Dados de pagamento:</strong> informações de cartão de crédito processadas de forma segura por terceiros</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span><strong className="text-foreground">Dados de uso:</strong> interações com a plataforma, automações criadas, logs de atividade</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span><strong className="text-foreground">Dados técnicos:</strong> endereço IP, tipo de navegador, dispositivo, cookies</span>
                  </li>
                </ul>
              </section>

              <section className="glass-card p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">3. Como Usamos suas Informações</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Utilizamos suas informações para:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Fornecer, manter e melhorar nossos serviços de automação com IA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Processar pagamentos e gerenciar sua assinatura</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Enviar comunicações sobre atualizações, novos recursos e suporte</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Personalizar sua experiência na plataforma</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Cumprir obrigações legais e regulatórias</span>
                  </li>
                </ul>
              </section>

              <section className="glass-card p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">4. Compartilhamento de Dados</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Não vendemos suas informações pessoais. Podemos compartilhar dados apenas com:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span><strong className="text-foreground">Prestadores de serviço:</strong> empresas que nos ajudam a operar a plataforma (hospedagem, pagamentos, análises)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span><strong className="text-foreground">Parceiros de integração:</strong> quando você conecta serviços externos (WhatsApp, redes sociais)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span><strong className="text-foreground">Autoridades legais:</strong> quando exigido por lei ou para proteger nossos direitos</span>
                  </li>
                </ul>
              </section>

              <section className="glass-card p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">5. Segurança dos Dados</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações, incluindo:
                  criptografia de dados em trânsito e em repouso, controles de acesso rigorosos, monitoramento 
                  contínuo de segurança e backups regulares. Nossos servidores estão localizados em data centers 
                  certificados com as mais altas normas de segurança.
                </p>
              </section>

              <section className="glass-card p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">6. Seus Direitos (LGPD)</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Confirmar a existência de tratamento de seus dados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Acessar seus dados pessoais</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Corrigir dados incompletos, inexatos ou desatualizados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Solicitar a anonimização, bloqueio ou eliminação de dados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Revogar seu consentimento a qualquer momento</span>
                  </li>
                </ul>
              </section>

              <section className="glass-card p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">7. Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso 
                  da plataforma e personalizar conteúdo. Você pode gerenciar suas preferências de cookies 
                  através das configurações do seu navegador. Para mais informações, consulte nossa Política de Cookies.
                </p>
              </section>

              <section className="glass-card p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">8. Retenção de Dados</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Mantemos suas informações pelo tempo necessário para fornecer nossos serviços e cumprir 
                  obrigações legais. Após o encerramento da sua conta, seus dados serão excluídos ou 
                  anonimizados em até 90 dias, exceto quando a retenção for exigida por lei.
                </p>
              </section>

              <section className="glass-card p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">9. Alterações nesta Política</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre 
                  mudanças significativas por e-mail ou através de um aviso em nossa plataforma. Recomendamos 
                  revisar esta página regularmente.
                </p>
              </section>

              <section className="glass-card p-6">
                <h2 className="font-display text-2xl font-semibold mb-4">10. Contato</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados, 
                  entre em contato conosco:
                </p>
                <div className="text-muted-foreground space-y-1">
                  <p><strong className="text-foreground">E-mail:</strong> privacidade@bridgeai.com.br</p>
                  <p><strong className="text-foreground">Encarregado de Dados (DPO):</strong> dpo@bridgeai.com.br</p>
                  <p><strong className="text-foreground">Endereço:</strong> Av. Paulista, 1000 - São Paulo, SP - Brasil</p>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
