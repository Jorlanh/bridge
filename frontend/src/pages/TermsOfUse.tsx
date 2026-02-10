import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-8">
              Termos de <span className="text-primary">Uso</span>
            </h1>
            
            <p className="text-muted-foreground mb-8">
              Última atualização: Janeiro de 2026
            </p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ao acessar e utilizar a plataforma BridgeAI Hub ("Plataforma"), você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá usar nossa Plataforma. O uso continuado da Plataforma após quaisquer alterações constitui aceitação dos novos termos.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  A BridgeAI Hub é uma central de automação inteligente para empresas, oferecendo soluções em:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Automação de marketing e vendas</li>
                  <li>Atendimento e suporte ao cliente com IA</li>
                  <li>Otimização de processos empresariais</li>
                  <li>Gerenciamento de redes sociais</li>
                  <li>Treinamentos em Inteligência Artificial (Academy)</li>
                  <li>Integração com plataformas de terceiros</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Cadastro e Conta</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Para utilizar determinados serviços da Plataforma, você precisará criar uma conta. Ao criar uma conta, você concorda em:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Fornecer informações verdadeiras, precisas e completas</li>
                  <li>Manter suas informações de conta atualizadas</li>
                  <li>Manter a confidencialidade de sua senha</li>
                  <li>Ser responsável por todas as atividades realizadas em sua conta</li>
                  <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos ou apresentem atividades suspeitas.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Uso Aceitável</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Você concorda em usar a Plataforma apenas para fins legais e de acordo com estes Termos. É proibido:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Violar leis ou regulamentos aplicáveis</li>
                  <li>Infringir direitos de propriedade intelectual de terceiros</li>
                  <li>Transmitir vírus, malware ou código malicioso</li>
                  <li>Tentar acessar áreas restritas da Plataforma</li>
                  <li>Usar a Plataforma para spam ou mensagens não solicitadas</li>
                  <li>Interferir no funcionamento normal da Plataforma</li>
                  <li>Revender ou sublicenciar os serviços sem autorização</li>
                  <li>Usar automações para fins ilícitos ou antiéticos</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Propriedade Intelectual</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Todos os direitos de propriedade intelectual da Plataforma pertencem à BridgeAI Hub, incluindo:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Software, código-fonte e tecnologias subjacentes</li>
                  <li>Marca, logotipos e elementos visuais</li>
                  <li>Conteúdo dos cursos e materiais da Academy</li>
                  <li>Documentação e tutoriais</li>
                  <li>Designs, layouts e interfaces</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Você não pode copiar, modificar, distribuir, vender ou alugar qualquer parte da Plataforma sem autorização expressa por escrito.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Conteúdo do Usuário</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Você mantém a propriedade de qualquer conteúdo que criar ou carregar na Plataforma. Ao fazer isso, você nos concede uma licença mundial, não exclusiva e isenta de royalties para usar, armazenar e processar esse conteúdo conforme necessário para fornecer os serviços. Você é responsável por garantir que seu conteúdo não viole direitos de terceiros ou leis aplicáveis.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Planos e Pagamentos</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  A BridgeAI Hub oferece diferentes planos de assinatura:
                </p>
                <div className="space-y-4">
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h3 className="font-semibold text-primary mb-2">Faturamento</h3>
                    <p className="text-muted-foreground text-sm">
                      Os valores são cobrados de acordo com o ciclo de faturamento escolhido (mensal ou anual). O pagamento é processado automaticamente na data de renovação.
                    </p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h3 className="font-semibold text-primary mb-2">Alterações de Plano</h3>
                    <p className="text-muted-foreground text-sm">
                      Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Alterações serão refletidas no próximo ciclo de faturamento.
                    </p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h3 className="font-semibold text-primary mb-2">Cancelamento</h3>
                    <p className="text-muted-foreground text-sm">
                      Você pode cancelar sua assinatura a qualquer momento. O acesso continuará até o final do período já pago. Não oferecemos reembolsos proporcionais.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Limitação de Responsabilidade</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  A Plataforma é fornecida "como está" e "conforme disponível". Na máxima extensão permitida por lei:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Não garantimos que a Plataforma será ininterrupta ou livre de erros</li>
                  <li>Não nos responsabilizamos por danos indiretos, incidentais ou consequenciais</li>
                  <li>Nossa responsabilidade total é limitada ao valor pago nos últimos 12 meses</li>
                  <li>Não garantimos resultados específicos com o uso da Plataforma</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Integrações de Terceiros</h2>
                <p className="text-muted-foreground leading-relaxed">
                  A Plataforma pode integrar-se com serviços de terceiros (como WhatsApp, Instagram, CRMs, etc.). O uso dessas integrações está sujeito aos termos de uso desses serviços. Não nos responsabilizamos pela disponibilidade, funcionalidade ou políticas de serviços de terceiros.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Privacidade e Proteção de Dados</h2>
                <p className="text-muted-foreground leading-relaxed">
                  O tratamento de dados pessoais é regido pela nossa Política de Privacidade, que faz parte integrante destes Termos. Estamos comprometidos com a proteção dos seus dados e conformidade com a Lei Geral de Proteção de Dados (LGPD) e outras legislações aplicáveis.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Disponibilidade e Suporte</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Nos esforçamos para manter a Plataforma disponível 24/7, mas podemos realizar manutenções programadas ou de emergência. O suporte é oferecido através de:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Central de ajuda e documentação</li>
                  <li>Chat via WhatsApp</li>
                  <li>E-mail de suporte</li>
                  <li>Suporte prioritário para planos superiores</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Modificações dos Termos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos modificar estes Termos a qualquer momento. Notificaremos sobre mudanças significativas por e-mail ou através da Plataforma. O uso continuado após as modificações constitui aceitação dos novos termos. Recomendamos revisar periodicamente esta página.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">13. Rescisão</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos suspender ou encerrar seu acesso à Plataforma imediatamente, sem aviso prévio, se você violar estes Termos. Após a rescisão, seu direito de usar a Plataforma cessará imediatamente. As disposições que por sua natureza devem sobreviver à rescisão permanecerão em vigor.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">14. Lei Aplicável e Foro</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa relacionada a estes Termos será submetida ao foro da Comarca de Florianópolis, Estado de Santa Catarina, com exclusão de qualquer outro, por mais privilegiado que seja.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">15. Disposições Gerais</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Acordo Integral:</strong> Estes Termos constituem o acordo integral entre você e a BridgeAI Hub.</li>
                  <li><strong>Renúncia:</strong> A falha em exercer qualquer direito não constitui renúncia a esse direito.</li>
                  <li><strong>Divisibilidade:</strong> Se qualquer disposição for considerada inválida, as demais permanecerão em vigor.</li>
                  <li><strong>Cessão:</strong> Você não pode ceder seus direitos sob estes Termos sem nosso consentimento.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">16. Contato</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Para dúvidas sobre estes Termos de Uso, entre em contato:
                </p>
                <div className="bg-card p-6 rounded-lg border border-border mt-4">
                  <p className="text-muted-foreground">
                    <strong>BridgeAI Hub</strong><br />
                    E-mail: contato@bridgeai.com.br<br />
                    Jurídico: juridico@bridgeai.com.br<br />
                    Florianópolis - SC | Goiânia - GO
                  </p>
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

export default TermsOfUse;
