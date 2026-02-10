import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Info,
  Code,
  Key,
  Link2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformGuide {
  name: string;
  icon: typeof Facebook;
  color: string;
  bgColor: string;
  steps: {
    title: string;
    description: string;
    details: string[];
    codeExample?: string;
    links?: { label: string; url: string }[];
  }[];
  commonIssues: {
    problem: string;
    solution: string;
  }[];
}

const platforms: PlatformGuide[] = [
  {
    name: "Facebook",
    icon: Facebook,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
    steps: [
      {
        title: "1. Criar App no Facebook Developers",
        description: "Acesse o Facebook Developers e crie um novo app",
        details: [
          "Acesse https://developers.facebook.com/",
          "Clique em 'Meus Apps' > 'Criar App'",
          "Escolha o tipo 'Negócios' ou 'Outro'",
          "Preencha o nome do app e email de contato",
          "Complete a verificação de segurança"
        ],
        links: [
          { label: "Facebook Developers", url: "https://developers.facebook.com/" },
          { label: "Documentação", url: "https://developers.facebook.com/docs/graph-api" }
        ]
      },
      {
        title: "2. Configurar Produtos do App",
        description: "Adicione os produtos necessários para publicação",
        details: [
          "No painel do app, vá em 'Adicionar Produto'",
          "Adicione 'Facebook Login'",
          "Adicione 'Instagram Graph API' (se usar Instagram)",
          "Configure as URLs de redirecionamento OAuth",
          "Adicione domínios autorizados"
        ]
      },
      {
        title: "3. Obter Credenciais",
        description: "Copie o App ID e App Secret",
        details: [
          "No painel do app, vá em 'Configurações' > 'Básico'",
          "Copie o 'ID do App' (App ID)",
          "Copie o 'Chave Secreta do App' (App Secret)",
          "Guarde essas informações em local seguro"
        ],
        codeExample: "App ID: 123456789012345\nApp Secret: abc123def456ghi789jkl012"
      },
      {
        title: "4. Obter Token de Acesso",
        description: "Gere um token de acesso de longa duração",
        details: [
          "Use o Graph API Explorer: https://developers.facebook.com/tools/explorer/",
          "Selecione seu app no dropdown",
          "Clique em 'Obter Token' > 'Obter Token de Acesso do Usuário'",
          "Selecione as permissões: pages_manage_posts, pages_read_engagement",
          "Copie o token gerado",
          "Para token de longa duração, use: GET /oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}&client_secret={app-secret}&fb_exchange_token={short-lived-token}"
        ],
        links: [
          { label: "Graph API Explorer", url: "https://developers.facebook.com/tools/explorer/" },
          { label: "Guia de Tokens", url: "https://developers.facebook.com/docs/facebook-login/guides/access-tokens" }
        ]
      },
      {
        title: "5. Obter ID da Página",
        description: "Encontre o ID da página que deseja conectar",
        details: [
          "Acesse sua página do Facebook",
          "Vá em 'Configurações' > 'Informações da Página'",
          "Role até o final e encontre o 'ID da Página'",
          "Ou use: GET /me/accounts?access_token={token}",
          "Copie o ID da página"
        ]
      },
      {
        title: "6. Conectar no BridgeAI Hub",
        description: "Insira as informações no formulário",
        details: [
          "Nome da Conta: Nome da sua página (ex: Minha Empresa)",
          "ID da Conta: ID da página copiado anteriormente",
          "Token de Acesso: Token de longa duração gerado",
          "Clique em 'Conectar'"
        ]
      }
    ],
    commonIssues: [
      {
        problem: "Token expirado",
        solution: "Gere um novo token de longa duração usando o método de troca de token"
      },
      {
        problem: "Erro de permissões",
        solution: "Verifique se o app tem as permissões pages_manage_posts e pages_read_engagement"
      },
      {
        problem: "Página não encontrada",
        solution: "Certifique-se de que você é administrador da página e que o ID está correto"
      }
    ]
  },
  {
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-600",
    bgColor: "bg-pink-600/10",
    steps: [
      {
        title: "1. Criar App no Facebook Developers",
        description: "Instagram usa a mesma plataforma do Facebook",
        details: [
          "Acesse https://developers.facebook.com/",
          "Crie um app ou use um existente",
          "Adicione o produto 'Instagram Graph API'",
          "Configure o app para Business ou Creator"
        ],
        links: [
          { label: "Facebook Developers", url: "https://developers.facebook.com/" },
          { label: "Instagram Graph API", url: "https://developers.facebook.com/docs/instagram-api" }
        ]
      },
      {
        title: "2. Conectar Conta Instagram",
        description: "Vincule sua conta Instagram ao app",
        details: [
          "No painel do app, vá em 'Instagram' > 'Configurações Básicas'",
          "Adicione sua conta Instagram Business ou Creator",
          "Autorize o app a gerenciar sua conta",
          "Complete a verificação de identidade se necessário"
        ]
      },
      {
        title: "3. Obter Token de Acesso",
        description: "Gere token para a conta Instagram",
        details: [
          "Use o Graph API Explorer",
          "Selecione seu app e a conta Instagram",
          "Obtenha token com permissões: instagram_basic, instagram_content_publish",
          "Para token de longa duração, faça a troca usando o mesmo método do Facebook"
        ],
        links: [
          { label: "Graph API Explorer", url: "https://developers.facebook.com/tools/explorer/" }
        ]
      },
      {
        title: "4. Obter ID da Conta Instagram",
        description: "Encontre o ID da sua conta",
        details: [
          "Use: GET /me/accounts?access_token={token}",
          "Ou: GET /{page-id}?fields=instagram_business_account",
          "Copie o ID da conta Instagram Business"
        ]
      },
      {
        title: "5. Conectar no BridgeAI Hub",
        description: "Insira as informações",
        details: [
          "Nome da Conta: Nome do seu perfil Instagram",
          "ID da Conta: ID da conta Instagram Business",
          "Token de Acesso: Token de longa duração",
          "Clique em 'Conectar'"
        ]
      }
    ],
    commonIssues: [
      {
        problem: "Conta não é Business ou Creator",
        solution: "Converta sua conta para Instagram Business ou Creator nas configurações"
      },
      {
        problem: "Token não funciona",
        solution: "Certifique-se de usar token de longa duração e que tem permissões corretas"
      }
    ]
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-700",
    bgColor: "bg-blue-700/10",
    steps: [
      {
        title: "1. Criar App no LinkedIn Developers",
        description: "Registre seu app na plataforma LinkedIn",
        details: [
          "Acesse https://www.linkedin.com/developers/",
          "Clique em 'Criar App'",
          "Preencha: Nome do App, URL da empresa, Email de contato",
          "Aceite os termos de uso",
          "Complete a verificação da empresa (se necessário)"
        ],
        links: [
          { label: "LinkedIn Developers", url: "https://www.linkedin.com/developers/" },
          { label: "Documentação", url: "https://docs.microsoft.com/en-us/linkedin/" }
        ]
      },
      {
        title: "2. Configurar Produtos e Permissões",
        description: "Adicione produtos e solicite permissões",
        details: [
          "No painel do app, vá em 'Produtos'",
          "Adicione 'Share on LinkedIn'",
          "Adicione 'Sign In with LinkedIn' (opcional)",
          "Vá em 'Auth' e configure URLs de redirecionamento",
          "Solicite permissões: w_member_social, w_organization_social"
        ]
      },
      {
        title: "3. Obter Credenciais",
        description: "Copie Client ID e Client Secret",
        details: [
          "No painel do app, vá em 'Auth'",
          "Copie o 'Client ID'",
          "Copie o 'Client Secret'",
          "Guarde essas informações"
        ],
        codeExample: "Client ID: 86abc123xyz\nClient Secret: XYZ789abc123"
      },
      {
        title: "4. Obter Token de Acesso via OAuth",
        description: "Implemente o fluxo OAuth ou use ferramentas",
        details: [
          "URL de autorização: https://www.linkedin.com/oauth/v2/authorization",
          "Parâmetros: response_type=code, client_id={id}, redirect_uri={uri}, scope=w_member_social",
          "Após autorização, receba o código",
          "Troque código por token: POST /oauth/v2/accessToken",
          "Use grant_type=authorization_code, code={code}, redirect_uri={uri}",
          "Copie o access_token retornado"
        ],
        links: [
          { label: "OAuth Guide", url: "https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication" }
        ]
      },
      {
        title: "5. Obter ID do Perfil ou Página",
        description: "Encontre seu ID no LinkedIn",
        details: [
          "Para perfil pessoal: GET /v2/me?oauth2_access_token={token}",
          "Para página: GET /v2/organizationalEntityAcls?q=owners",
          "O ID estará no campo 'id' ou 'organizationalTarget'",
          "Copie o ID"
        ]
      },
      {
        title: "6. Conectar no BridgeAI Hub",
        description: "Insira as informações",
        details: [
          "Nome da Conta: Nome do seu perfil ou página",
          "ID da Conta: ID obtido na etapa anterior",
          "Token de Acesso: Token OAuth gerado",
          "Clique em 'Conectar'"
        ]
      }
    ],
    commonIssues: [
      {
        problem: "App não aprovado",
        solution: "Algumas permissões requerem aprovação do LinkedIn. Aguarde a revisão"
      },
      {
        problem: "Token expira rápido",
        solution: "LinkedIn tokens expiram em 60 dias. Implemente refresh token automático"
      }
    ]
  }
];

export function SocialConnectionGuide({ onClose }: { onClose?: () => void }) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("facebook");

  const platform = platforms.find(p => p.name.toLowerCase() === selectedPlatform) || platforms[0];
  const Icon = platform.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl mb-2">Guia de Conexão com Redes Sociais</h2>
          <p className="text-muted-foreground">Siga os passos abaixo para conectar suas contas</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>

      {/* Seleção de Plataforma */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map((p) => {
          const PIcon = p.icon;
          const isSelected = p.name.toLowerCase() === selectedPlatform;
          return (
            <Card
              key={p.name}
              className={cn(
                "p-4 cursor-pointer transition-all glass-card-hover",
                isSelected && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedPlatform(p.name.toLowerCase())}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", p.bgColor)}>
                  <PIcon className={cn("w-6 h-6", p.color)} />
                </div>
                <span className="text-sm font-medium">{p.name}</span>
                {isSelected && (
                  <Badge variant="outline" className="text-xs">
                    Selecionado
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Guia da Plataforma Selecionada */}
      <Card className="p-6 glass-card">
        <div className="flex items-center gap-3 mb-6">
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", platform.bgColor)}>
            <Icon className={cn("w-6 h-6", platform.color)} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{platform.name}</h3>
            <p className="text-sm text-muted-foreground">Guia passo a passo</p>
          </div>
        </div>

        <div className="space-y-6">
          {platform.steps.map((step, index) => (
            <div key={index} className="border-l-2 border-primary/30 pl-6 pb-6 last:pb-0">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                  
                  <ul className="space-y-2 mb-3">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>

                  {step.codeExample && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Exemplo:</span>
                      </div>
                      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                        {step.codeExample}
                      </pre>
                    </div>
                  )}

                  {step.links && step.links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {step.links.map((link, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => window.open(link.url, "_blank")}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          {link.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Problemas Comuns */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-warning" />
            <h4 className="font-semibold">Problemas Comuns</h4>
          </div>
          <div className="space-y-3">
            {platform.commonIssues.map((issue, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm mb-1">
                  <span className="text-warning">⚠️</span> {issue.problem}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="text-success">✓</span> {issue.solution}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dica Final */}
        <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm mb-1">Dica Importante</p>
              <p className="text-xs text-muted-foreground">
                Tokens de acesso podem expirar. Para produção, recomendamos implementar refresh tokens automáticos 
                ou usar webhooks para renovar tokens quando necessário. Mantenha suas credenciais seguras e nunca 
                as compartilhe publicamente.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

