import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";

const CookiesPolicy = () => {
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
              Política de <span className="text-primary">Cookies</span>
            </h1>
            
            <p className="text-muted-foreground mb-8">
              Última atualização: Janeiro de 2026
            </p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. O que são Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies são pequenos arquivos de texto que são armazenados no seu dispositivo (computador, tablet ou smartphone) quando você visita nosso site. Eles são amplamente utilizados para fazer os sites funcionarem de maneira mais eficiente, bem como para fornecer informações aos proprietários do site.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Como Utilizamos os Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  A BridgeAI Hub utiliza cookies para diversas finalidades, incluindo:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Manter você conectado à sua conta durante a navegação</li>
                  <li>Lembrar suas preferências e configurações</li>
                  <li>Entender como você utiliza nossa plataforma</li>
                  <li>Melhorar a experiência do usuário</li>
                  <li>Fornecer conteúdo e anúncios personalizados</li>
                  <li>Analisar o tráfego e o desempenho do site</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Tipos de Cookies que Utilizamos</h2>
                
                <div className="space-y-6">
                  <div className="bg-card p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold mb-2 text-primary">Cookies Essenciais</h3>
                    <p className="text-muted-foreground text-sm">
                      São necessários para o funcionamento básico do site. Sem eles, certas funcionalidades como login, navegação segura e acesso a áreas protegidas não funcionariam corretamente. Estes cookies não podem ser desativados.
                    </p>
                  </div>

                  <div className="bg-card p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold mb-2 text-primary">Cookies de Desempenho</h3>
                    <p className="text-muted-foreground text-sm">
                      Coletam informações sobre como os visitantes usam o site, como quais páginas são mais visitadas e se há mensagens de erro. Esses cookies nos ajudam a melhorar o funcionamento do site.
                    </p>
                  </div>

                  <div className="bg-card p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold mb-2 text-primary">Cookies de Funcionalidade</h3>
                    <p className="text-muted-foreground text-sm">
                      Permitem que o site lembre das escolhas que você faz (como idioma preferido, região ou nome de usuário) e forneça recursos aprimorados e mais personalizados.
                    </p>
                  </div>

                  <div className="bg-card p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold mb-2 text-primary">Cookies de Marketing</h3>
                    <p className="text-muted-foreground text-sm">
                      São usados para rastrear visitantes em diferentes sites. A intenção é exibir anúncios que sejam relevantes e envolventes para o usuário individual, tornando-os mais valiosos para editores e anunciantes.
                    </p>
                  </div>

                  <div className="bg-card p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold mb-2 text-primary">Cookies de Análise</h3>
                    <p className="text-muted-foreground text-sm">
                      Utilizamos ferramentas como Google Analytics para entender como os visitantes interagem com nosso site. Esses cookies coletam informações de forma anônima e nos ajudam a criar relatórios sobre o uso do site.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Cookies de Terceiros</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Alguns cookies são colocados por serviços de terceiros que aparecem em nossas páginas. Nossos parceiros incluem:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Google Analytics (análise de tráfego)</li>
                  <li>Hotjar (análise de comportamento do usuário)</li>
                  <li>Stripe (processamento de pagamentos)</li>
                  <li>Intercom (chat de suporte)</li>
                  <li>Facebook Pixel (marketing e remarketing)</li>
                  <li>LinkedIn Insight Tag (marketing B2B)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Duração dos Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Os cookies podem ter diferentes durações:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Cookies de Sessão:</strong> São temporários e expiram quando você fecha o navegador.</li>
                  <li><strong>Cookies Persistentes:</strong> Permanecem no seu dispositivo por um período definido ou até serem deletados manualmente. Podem durar de alguns dias a vários anos.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Como Gerenciar Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Você pode controlar e/ou excluir cookies como desejar. A maioria dos navegadores permite:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Ver quais cookies estão armazenados e excluí-los individualmente</li>
                  <li>Bloquear cookies de terceiros</li>
                  <li>Bloquear cookies de sites específicos</li>
                  <li>Bloquear todos os cookies</li>
                  <li>Excluir todos os cookies quando você fecha o navegador</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Para gerenciar cookies, acesse as configurações do seu navegador. Note que desabilitar certos cookies pode afetar a funcionalidade do site.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Configurações de Cookies por Navegador</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Veja como gerenciar cookies nos navegadores mais populares:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Google Chrome:</strong> Configurações → Privacidade e segurança → Cookies</li>
                  <li><strong>Mozilla Firefox:</strong> Opções → Privacidade e Segurança → Cookies</li>
                  <li><strong>Safari:</strong> Preferências → Privacidade → Cookies</li>
                  <li><strong>Microsoft Edge:</strong> Configurações → Cookies e permissões do site</li>
                  <li><strong>Opera:</strong> Configurações → Avançado → Privacidade → Cookies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Tecnologias Similares</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Além de cookies, também podemos usar tecnologias similares como web beacons (pixels de rastreamento), armazenamento local (localStorage e sessionStorage), e identificadores de dispositivo para fornecer e melhorar nossos serviços.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Consentimento</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ao continuar navegando em nosso site após ser informado sobre o uso de cookies (através do banner de cookies), você consente com o uso de cookies conforme descrito nesta política. Você pode retirar seu consentimento a qualquer momento através das configurações do seu navegador ou das nossas configurações de privacidade.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Atualizações desta Política</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos atualizar esta Política de Cookies periodicamente para refletir mudanças em nossas práticas ou por outros motivos operacionais, legais ou regulatórios. Recomendamos que você revise esta página regularmente para se manter informado sobre como utilizamos cookies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Contato</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Se você tiver dúvidas sobre nossa Política de Cookies, entre em contato:
                </p>
                <div className="bg-card p-6 rounded-lg border border-border mt-4">
                  <p className="text-muted-foreground">
                    <strong>BridgeAI Hub</strong><br />
                    E-mail: privacidade@bridgeai.com.br<br />
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

export default CookiesPolicy;
