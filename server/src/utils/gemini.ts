import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";

if (!API_KEY) {
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface GeminiResponse {
  success: boolean;
  content?: string;
  courseData?: any;
  consultingData?: {
    title: string;
    description: string;
    duration: number;
    maxParticipants: number;
    instructor: string;
    platform: string;
    objectives: string[];
    topics?: string[];
    targetAudience?: string;
  };
  error?: string;
}

/**
 * Gera conteúdo usando Gemini AI
 */
export async function generateContent(prompt: string, context?: string): Promise<GeminiResponse> {
  if (!genAI || !API_KEY) {
    return {
      success: false,
      error: "API do Gemini não configurada. Configure GEMINI_API_KEY no arquivo .env",
    };
  }

  try {
    // Usar gemini-2.5-flash (modelo disponível na conta)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7, // Balance entre criatividade e consistência
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });
    
    const fullPrompt = context 
      ? `${context}\n\n${prompt}`
      : prompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Limpar e formatar a resposta
    const cleanedText = text
      .trim()
      .replace(/^\*\*/g, '') // Remove markdown bold no início
      .replace(/\*\*$/g, '') // Remove markdown bold no final
      .replace(/\n{3,}/g, '\n\n') // Remove múltiplas quebras de linha
      .trim();

    return {
      success: true,
      content: cleanedText,
    };
  } catch (error: any) {
    console.error("Erro ao gerar conteúdo com Gemini:", error);
    
    // Tratar erros de quota/rate limit
    if (error.status === 429 || 
        error.message?.includes("quota") || 
        error.message?.includes("Quota exceeded") ||
        error.message?.includes("rate limit") ||
        error.message?.includes("429")) {
      return {
        success: false,
        error: "Limite de requisições atingido. A API do Gemini tem um limite de requisições por minuto. Por favor, aguarde alguns instantes e tente novamente.",
      };
    }
    
    // Tratar outros erros da API
    if (error.message?.includes("API key") || error.message?.includes("authentication")) {
      return {
        success: false,
        error: "Erro de autenticação com a API do Gemini. Verifique a configuração da chave de API.",
      };
    }
    
    return {
      success: false,
      error: error.message || "Erro ao gerar conteúdo. Tente novamente em alguns instantes.",
    };
  }
}

/**
 * Gera post para rede social
 */
export async function generateSocialPost(
  theme: string,
  platform: string,
  tone: string = "Profissional"
): Promise<GeminiResponse> {
  const platformGuidelines: Record<string, string> = {
    Instagram: "O post deve ter entre 125-150 palavras, ser visualmente descritivo, usar hashtags relevantes (3-5), e incluir uma pergunta para engajamento. Pode usar emojis moderadamente (2-3).",
    LinkedIn: "O post deve ter entre 200-300 palavras, ser profissional e informativo, incluir insights ou dados quando relevante, e terminar com uma pergunta para discussão. Evite emojis excessivos.",
    Facebook: "O post deve ter entre 150-250 palavras, ser conversacional e acessível, incluir call-to-action claro, e pode usar emojis (3-5) para tornar mais amigável.",
  };

  const toneGuidelines: Record<string, string> = {
    Profissional: "Use linguagem formal, técnica quando apropriado, evite gírias, mantenha tom respeitoso e corporativo.",
    Descontraído: "Use linguagem mais casual, pode incluir expressões comuns, seja amigável e acessível, mas ainda mantenha respeito.",
    Inspirador: "Use linguagem motivacional, inclua elementos emocionais, seja positivo e encorajador, use metáforas quando apropriado.",
  };

  const prompt = `Você é um especialista em marketing digital e criação de conteúdo para redes sociais. Sua tarefa é criar um post de alta qualidade para ${platform}.

TEMA DO POST: "${theme}"

DIRETRIZES ESPECÍFICAS DA PLATAFORMA (${platform}):
${platformGuidelines[platform] || platformGuidelines.LinkedIn}

TOM E ESTILO (${tone}):
${toneGuidelines[tone] || toneGuidelines.Profissional}

REQUISITOS OBRIGATÓRIOS:
1. O post deve ser original, criativo e envolvente
2. Deve capturar a atenção nos primeiros segundos
3. Deve fornecer valor ao leitor (informação, entretenimento ou inspiração)
4. Deve incluir um call-to-action claro e específico
5. Deve ser otimizado para a plataforma ${platform}
6. Não deve ser genérico - deve ser específico ao tema "${theme}"
7. Deve usar linguagem natural e fluida
8. Deve evitar clichês e frases genéricas

ESTRUTURA RECOMENDADA:
- Abertura impactante (primeira frase deve prender atenção)
- Desenvolvimento do tema (2-3 parágrafos ou frases principais)
- Valor ou insight principal
- Call-to-action específico
- Elementos de engajamento (pergunta, reflexão, etc.)

INSTRUÇÕES FINAIS:
- Retorne APENAS o texto do post, sem formatação markdown
- Não inclua títulos, subtítulos ou formatação adicional
- Não inclua instruções ou comentários
- O texto deve estar pronto para publicação
- Se for para Instagram, inclua sugestões de hashtags no final (separadas por espaço)
- Se for para outras plataformas, não inclua hashtags

Agora, crie o post seguindo TODAS essas diretrizes:`;

  return generateContent(prompt);
}

/**
 * Gera script de vendas
 */
export async function generateSalesScript(
  type: "prospecção" | "apresentação" | "objeções" | "fechamento",
  context?: string
): Promise<GeminiResponse> {
  const baseContext = context ? `\n\nCONTEXTO ESPECÍFICO:\n${context}\n\nUse este contexto para personalizar o script e torná-lo mais relevante.` : "";

  const prompts = {
    prospecção: `Você é um especialista em vendas e prospecção. Crie um script completo e detalhado para primeira abordagem com um potencial cliente.

OBJETIVO: Gerar interesse genuíno e agendar uma conversa ou reunião de qualificação.

ESTRUTURA DO SCRIPT:
1. ABERTURA (15-30 segundos)
   - Apresentação pessoal breve e profissional
   - Referência ou conexão (como chegou até ele, indicação, pesquisa, etc.)
   - Permissão para continuar a conversa

2. DESCOBERTA E VALOR (1-2 minutos)
   - Perguntas abertas para entender necessidades
   - Identificar dores ou desafios
   - Apresentar valor de forma sutil e consultiva
   - Não fazer pitch direto ainda

3. GERAÇÃO DE INTERESSE (30-60 segundos)
   - Compartilhar um insight ou caso de sucesso breve
   - Conectar a solução às necessidades identificadas
   - Criar curiosidade sem pressionar

4. CALL-TO-ACTION (30 segundos)
   - Propor próxima etapa natural (reunião, demo, conversa)
   - Oferecer valor imediato (conteúdo, análise, consultoria)
   - Criar urgência sutil se apropriado

5. ENCERRAMENTO
   - Confirmar interesse
   - Agendar próxima interação
   - Agradecer o tempo

DIRETRIZES ESSENCIAIS:
- Seja consultivo, não vendedor
- Faça mais perguntas do que afirmações
- Escute ativamente (inclua pausas para resposta)
- Personalize baseado no perfil do cliente
- Evite jargões de vendas ou pressão
- Seja autêntico e genuíno
- Mostre empatia e compreensão
- Foque em resolver problemas, não em vender

PERGUNTAS PODEROSAS PARA INCLUIR:
- "Qual é o maior desafio que você enfrenta atualmente em [área relevante]?"
- "Como você está lidando com [problema comum] hoje?"
- "O que seria um resultado ideal para você?"
- "O que te impediria de implementar uma solução?"

FORMATO DE SAÍDA:
Forneça o script completo, estruturado por seções, com diálogos diretos que podem ser usados, incluindo variações e notas sobre quando usar cada abordagem.${baseContext}

Agora, crie o script de prospecção completo:`,
    
    apresentação: `Você é um especialista em vendas consultivas. Crie um script completo e detalhado para apresentação de produto ou serviço.

OBJETIVO: Apresentar a solução de forma convincente, destacando benefícios e valor, sem ser agressivo.

ESTRUTURA DO SCRIPT:
1. RECAP E CONEXÃO (30 segundos)
   - Relembrar conversa anterior ou necessidades identificadas
   - Conectar às dores do cliente
   - Criar contexto para a apresentação

2. APRESENTAÇÃO DA SOLUÇÃO (2-3 minutos)
   - Começar com o problema que resolve
   - Apresentar características principais (máximo 3-4)
   - Focar em benefícios, não apenas features
   - Usar linguagem de resultados e transformação

3. PROVA SOCIAL E CREDIBILIDADE (1-2 minutos)
   - Casos de sucesso relevantes
   - Dados ou estatísticas quando apropriado
   - Testemunhos ou resultados de clientes similares
   - Credenciais ou reconhecimentos

4. DEMONSTRAÇÃO DE VALOR (1-2 minutos)
   - ROI ou economia potencial
   - Ganhos de tempo, eficiência ou qualidade
   - Comparação com situação atual
   - Valor emocional além do financeiro

5. ENGAJAMENTO E VALIDAÇÃO (1 minuto)
   - Verificar compreensão
   - Identificar objeções ou preocupações
   - Perguntar sobre interesse e próximos passos

6. PRÓXIMOS PASSOS
   - Propor demo, trial ou proposta
   - Criar senso de urgência quando apropriado
   - Agendar follow-up

TÉCNICAS A UTILIZAR:
- Storytelling: conte histórias de transformação
- Analogias: use comparações familiares
- Visualização: ajude o cliente a se ver usando a solução
- Perguntas estratégicas: mantenha o cliente engajado
- Pausas: dê tempo para processar informações

EVITE:
- Jargões técnicos excessivos
- Listas longas de features
- Pressão ou agressividade
- Promessas exageradas
- Comparações negativas com concorrentes

FORMATO DE SAÍDA:
Forneça o script completo com diálogos diretos, incluindo variações para diferentes perfis de cliente e notas sobre ênfases para diferentes situações.${baseContext}

Agora, crie o script de apresentação completo:`,
    
    objeções: `Você é um especialista em vendas e negociação. Crie um guia completo e detalhado para lidar com objeções comuns em vendas.

OBJETIVO: Fornecer respostas inteligentes, empáticas e eficazes para as principais objeções de clientes.

METODOLOGIA PARA LIDAR COM OBJEÇÕES:
1. ESCUTAR COMPLETAMENTE - Não interromper
2. VALIDAR A PREOCUPAÇÃO - Mostrar que entende
3. EXPLORAR A OBJEÇÃO - Fazer perguntas para entender melhor
4. RESPONDER COM VALOR - Focar em benefícios e soluções
5. TESTAR O FECHAMENTO - Verificar se a objeção foi resolvida

OBJEÇÕES PRINCIPAIS E RESPOSTAS DETALHADAS:

1. "É MUITO CARO" / "ESTÁ FORA DO MEU ORÇAMENTO"
   - Validar: "Entendo que o investimento é uma consideração importante."
   - Explorar: "O que seria um valor que funcionaria para você?" / "Qual seria o ROI necessário para justificar?"
   - Responder: Focar em valor total, economia a longo prazo, custo de não fazer nada
   - Alternativas: Planos de pagamento, começar menor, demonstrar ROI

2. "PRECISO PENSAR" / "VOU CONVERSAR COM MINHA EQUIPE"
   - Validar: "É uma decisão importante, faz sentido pensar bem."
   - Explorar: "O que especificamente você precisa considerar?" / "Quais são as principais preocupações?"
   - Respondar: Oferecer informações adicionais, agendar follow-up específico
   - Criar urgência sutil: "O que mudaria se você decidisse em [prazo]?"

3. "JÁ TENHO UM FORNECEDOR" / "ESTOU SATISFEITO COM O ATUAL"
   - Validar: "Ótimo que você tem uma solução funcionando."
   - Explorar: "Há algo que você gostaria que fosse diferente?" / "Como você mede o sucesso da solução atual?"
   - Respondar: Diferenciais, melhorias, casos de migração bem-sucedida
   - Proposta: "Não estou pedindo para trocar agora, mas gostaria de mostrar o que fazemos diferente."

4. "NÃO TENHO TEMPO" / "NÃO É PRIORIDADE AGORA"
   - Validar: "Entendo que você tem muitas prioridades."
   - Explorar: "O que aconteceria se isso continuasse como está?" / "Qual seria o custo de adiar?"
   - Respondar: Mostrar como a solução economiza tempo, automatiza processos
   - Urgência: "Quanto mais tempo passa, maior o problema pode ficar."

5. "NÃO ESTOU CONVENCIDO" / "NÃO VEJO O VALOR"
   - Validar: "Obrigado pela honestidade. O que especificamente não está claro?"
   - Explorar: "O que seria necessário para você ver o valor?" / "Qual resultado você precisa ver?"
   - Respondar: Reapresentar benefícios de forma diferente, usar casos de sucesso específicos
   - Proposta: Trial, demonstração prática, prova de conceito

6. "JÁ TENTEI ISSO ANTES E NÃO FUNCIONOU"
   - Validar: "Entendo a frustração. O que aconteceu naquela vez?"
   - Explorar: "O que foi diferente? O que faltou?"
   - Respondar: Explicar diferenças, melhorias, novo contexto
   - Proposta: "Vamos fazer diferente desta vez. Aqui está como..."

PRINCÍPIOS GERAIS:
- Nunca discuta ou contradiga diretamente
- Sempre transforme objeções em oportunidades de diálogo
- Use perguntas para entender a raiz da objeção
- Foque em valor e benefícios, não em features
- Seja empático e genuíno
- Mantenha tom positivo e construtivo

FORMATO DE SAÍDA:
Forneça respostas detalhadas para cada objeção, incluindo múltiplas variações, perguntas de exploração, e técnicas de fechamento após resolver cada objeção.${baseContext}

Agora, crie o guia completo de objeções:`,
    
    fechamento: `Você é um especialista em técnicas de fechamento de vendas. Crie um guia completo e detalhado com técnicas de fechamento eficazes.

OBJETIVO: Fornecer múltiplas técnicas de fechamento que podem ser usadas em diferentes situações para concluir a venda de forma natural e sem pressão.

PRINCÍPIOS DO FECHAMENTO EFICAZ:
1. O fechamento deve ser natural, não forçado
2. Deve acontecer quando o cliente demonstrou interesse
3. Deve resolver preocupações antes de fechar
4. Deve criar senso de urgência quando apropriado
5. Deve oferecer opções, não apenas sim/não

TÉCNICAS DE FECHAMENTO DETALHADAS:

1. FECHAMENTO POR ASSUMIR O SIM
   - Estrutura: "Perfeito! Vamos começar então. Qual forma de pagamento funciona melhor para você?"
   - Quando usar: Cliente demonstrou interesse claro e resolveu objeções
   - Variações: "Ótimo! Vou preparar a proposta. Prefere receber por email ou WhatsApp?"

2. FECHAMENTO POR ALTERNATIVA
   - Estrutura: "Prefere começar com o plano básico ou avançado?"
   - Quando usar: Cliente está interessado mas indeciso sobre detalhes
   - Variações: "Quer começar em janeiro ou fevereiro?" / "Prefere pagamento mensal ou anual?"

3. FECHAMENTO POR PERGUNTA DE FECHAMENTO
   - Estrutura: "O que te impediria de começar hoje?"
   - Quando usar: Cliente parece interessado mas hesita
   - Variações: "O que você precisa para tomar uma decisão?" / "Há algo que ainda não ficou claro?"

4. FECHAMENTO POR URGÊNCIA
   - Estrutura: "Temos uma promoção que termina [prazo]. Quer aproveitar?"
   - Quando usar: Há benefício real em agir rápido (desconto, vaga limitada, etc.)
   - Cuidado: Seja honesto, não invente urgência falsa

5. FECHAMENTO POR RESUMO DE BENEFÍCIOS
   - Estrutura: "Então, resumindo: você terá [benefício 1], [benefício 2], [benefício 3]. Faz sentido para você?"
   - Quando usar: Após apresentação completa
   - Variações: Relembrar dores que serão resolvidas

6. FECHAMENTO POR TESTE
   - Estrutura: "Que tal começarmos com um trial de 30 dias? Se funcionar, continuamos."
   - Quando usar: Cliente tem receio de compromisso
   - Variações: "Podemos começar pequeno e expandir depois."

7. FECHAMENTO POR PERDA (SCARCITY)
   - Estrutura: "Entendo. Mas considere: o que você perde enquanto não implementa isso?"
   - Quando usar: Cliente está adiando decisão
   - Cuidado: Use com empatia, não como ameaça

8. FECHAMENTO POR CONCESSÃO
   - Estrutura: "Se eu conseguir [concessão específica], você fecha hoje?"
   - Quando usar: Cliente tem uma objeção específica que pode ser resolvida
   - Exemplo: "Se eu conseguir um desconto de 10%, você fecha?"

9. FECHAMENTO POR COMPROMISSO PARCIAL
   - Estrutura: "Não precisa decidir tudo agora. Que tal começarmos com [parte menor]?"
   - Quando usar: Cliente está interessado mas não quer compromisso total
   - Variações: "Podemos começar com um piloto de 3 meses."

10. FECHAMENTO POR SILÊNCIO
    - Estrutura: Após fazer pergunta de fechamento, fique em silêncio
    - Quando usar: Após qualquer pergunta que requer decisão
    - Importante: O primeiro a falar perde - deixe o cliente responder

SINAIS DE QUE ESTÁ NA HORA DE FECHAR:
- Cliente faz perguntas sobre implementação
- Cliente pergunta sobre preço ou condições
- Cliente menciona quando precisa da solução
- Cliente resolve todas as objeções
- Cliente demonstra entusiasmo ou interesse claro

COMO LIDAR COM HESITAÇÃO:
1. Identifique a causa específica da hesitação
2. Faça perguntas para entender melhor
3. Ofereça garantias ou reduza risco
4. Proponha compromisso menor
5. Agende follow-up específico se necessário

ERROS A EVITAR:
- Fechar muito cedo (antes de resolver objeções)
- Fechar muito tarde (perder momentum)
- Ser agressivo ou pressionar
- Não escutar sinais do cliente
- Não oferecer alternativas

FORMATO DE SAÍDA:
Forneça cada técnica detalhada, com exemplos de diálogos completos, quando usar cada uma, variações, e como combinar técnicas.${baseContext}

Agora, crie o guia completo de fechamento:`,
  };

  return generateContent(prompts[type]);
}

/**
 * Gera resposta rápida para atendimento
 */
export async function generateQuickReply(
  situation: string,
  context?: string
): Promise<GeminiResponse> {
  const prompt = `Você é um especialista em atendimento ao cliente e suporte técnico. Sua tarefa é criar uma resposta profissional, empática e eficaz para uma situação de atendimento.

SITUAÇÃO DO CLIENTE:
${situation}
${context ? `\n\nCONTEXTO ADICIONAL:\n${context}` : ""}

DIRETRIZES PARA A RESPOSTA:

1. TOM E LINGUAGEM:
   - Seja cordial, empático e profissional
   - Use linguagem clara e acessível
   - Evite jargões técnicos desnecessários
   - Demonstre compreensão da situação do cliente
   - Mantenha tom positivo e solucionador

2. ESTRUTURA DA RESPOSTA:
   - ABERTURA: Reconheça a situação e valide a preocupação do cliente
   - CORPO: Forneça informação clara, ação ou solução
   - ENCERRAMENTO: Ofereça ajuda adicional e próximo passo

3. ELEMENTOS ESSENCIAIS:
   - Empatia: Mostre que entende a frustração/preocupação
   - Clareza: Seja direto e específico
   - Ação: Forneça solução ou próximo passo claro
   - Proatividade: Antecipe possíveis dúvidas seguintes
   - Personalização: Adapte ao contexto específico

4. TIPOS DE SITUAÇÕES E ABORDAGENS:

   PROBLEMA TÉCNICO:
   - Reconheça o problema
   - Explique a causa (se conhecida) de forma simples
   - Forneça solução passo a passo
   - Ofereça alternativas se necessário
   - Garanta follow-up se o problema persistir

   RECLAMAÇÃO:
   - Peça desculpas genuinamente
   - Reconheça o impacto no cliente
   - Explique o que aconteceu (se apropriado)
   - Apresente solução ou compensação
   - Comprometa-se a melhorar

   DÚVIDA/PERGUNTA:
   - Agradeça a pergunta
   - Responda de forma completa e clara
   - Forneça exemplos se necessário
   - Ofereça recursos adicionais
   - Convide para mais perguntas

   SOLICITAÇÃO:
   - Confirme o entendimento da solicitação
   - Informe prazo ou processo
   - Explique próximos passos
   - Forneça informações de acompanhamento
   - Garanta que será resolvido

5. PRINCÍPIOS DE EXCELÊNCIA:
   - Resolva na primeira interação quando possível
   - Seja proativo, não reativo
   - Personalize a resposta ao contexto
   - Mantenha consistência com valores da empresa
   - Crie experiência positiva mesmo em situações difíceis

6. ELEMENTOS A INCLUIR:
   - Saudação apropriada
   - Validação da situação
   - Informação ou solução clara
   - Próximos passos específicos
   - Oferta de ajuda adicional
   - Encerramento cordial

7. ELEMENTOS A EVITAR:
   - Respostas genéricas ou copiadas
   - Linguagem defensiva ou justificativa excessiva
   - Transferir responsabilidade sem resolver
   - Promessas que não podem ser cumpridas
   - Linguagem muito técnica sem explicação

FORMATO DE SAÍDA:
Forneça uma resposta completa, pronta para uso, que seja:
- Profissional mas humanizada
- Específica à situação apresentada
- Útil e acionável para o cliente
- Em linha com excelência em atendimento

A resposta deve estar formatada como um texto direto, sem marcações ou formatação adicional, pronta para ser enviada ao cliente.

Agora, crie a resposta completa para esta situação:`;

  return generateContent(prompt);
}

/**
 * Gera resposta do Assistente BridgeAI com contexto de conversação
 */
export async function generateAssistantReply(
  message: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<GeminiResponse> {
  const systemPrompt = `Você é o Assistente BridgeAI, um assistente virtual inteligente e amigável da plataforma BridgeAI Hub.

SUA IDENTIDADE:
- Você é um assistente especializado em ajudar usuários a navegar e aproveitar melhor a plataforma BridgeAI Hub
- Você conhece todas as funcionalidades da plataforma: marketing, vendas, suporte, redes sociais, processos, academy, etc.
- Você tem um tom amigável, profissional e prestativo
- Você sempre busca ser útil, claro e objetivo
- Você fala em português brasileiro

SUAS CAPACIDADES:
- Explicar funcionalidades da plataforma
- Sugerir otimizações de processos e automações
- Guiar usuários sobre como usar diferentes módulos
- Responder dúvidas sobre a Academy e cursos
- Ajudar com configurações e ajustes
- Oferecer sugestões inteligentes baseadas no contexto
- Orientar sobre melhores práticas

PRINCÍPIOS DE COMUNICAÇÃO:
- Seja conciso mas completo
- Use linguagem clara e acessível
- Evite jargões técnicos desnecessários
- Seja empático e atencioso
- Mantenha tom positivo e motivador
- Quando apropriado, ofereça links ou próximos passos
- Se não souber algo, seja honesto e ofereça alternativas

CONTEXTO DA PLATAFORMA:
A BridgeAI Hub oferece:
- Automações de Marketing (campanhas, conteúdo com IA)
- Gestão de Vendas (oportunidades, scripts, follow-ups)
- Atendimento e Suporte (tickets, respostas rápidas com IA)
- Gestão de Redes Sociais (posts, agendamento, IA)
- Otimização de Processos (fluxos, tarefas, checklists)
- BridgeAI Academy (cursos, certificados, consultoria)
- Segurança e Controle de Acesso (roles, permissões, logs)

DIRETRIZES:
- Se o usuário perguntar sobre algo específico, forneça informações precisas
- Se perguntar "como fazer X", forneça passos claros
- Se pedir sugestões, seja criativo e prático
- Se o usuário estiver perdido, ofereça orientação clara
- Sempre que relevante, sugira funcionalidades relacionadas que possam ajudar

RESPOSTAS:
- Mantenha respostas focadas e úteis
- Use formatação quando ajudar (mas evite markdown complexo)
- Se for uma pergunta complexa, quebre em partes
- Termine com perguntas ou próximos passos quando apropriado`;

  // Construir histórico de conversa
  let fullPrompt = systemPrompt;
  
  if (conversationHistory && conversationHistory.length > 0) {
    // Manter apenas as últimas 10 mensagens para não exceder tokens
    const recentHistory = conversationHistory.slice(-10);
    fullPrompt += "\n\nHISTÓRICO DA CONVERSA:\n";
    recentHistory.forEach((msg) => {
      const roleLabel = msg.role === "user" ? "USUÁRIO" : "ASSISTENTE";
      fullPrompt += `${roleLabel}: ${msg.content}\n\n`;
    });
  }
  
  fullPrompt += `\n\nMENSAGEM ATUAL DO USUÁRIO:\n${message}\n\nASSISTENTE:`;

  return generateContent(fullPrompt);
}

/**
 * Gera sessão de consultoria com IA
 * Retorna título + descrição em TEXTO, sem JSON bruto, sem cortar o conteúdo.
 */
export async function generateConsultingSessionWithAI(
  topic: string,
  description?: string
): Promise<GeminiResponse> {
  const prompt = `Você é um especialista em criar sessões de consultoria de alta qualidade sobre Inteligência Artificial e automação para empresas.

TÓPICO DA CONSULTORIA: "${topic}"
${description ? `\nDESCRIÇÃO ADICIONAL: "${description}"` : ""}

OBJETIVO:
- Criar uma sessão de consultoria prática, clara e de alto valor para empresas.

FORMATO EXATO DA RESPOSTA (SEM JSON, SEM LISTAS):
1) Na PRIMEIRA LINHA, escreva apenas o TÍTULO da consultoria, em no máximo 80 caracteres.
2) Deixe uma linha em branco.
3) Depois, escreva apenas a DESCRIÇÃO COMPLETA da consultoria, em 2 a 5 parágrafos,
   explicando:
   - O que será abordado
   - Benefícios para o participante
   - Resultados práticos que a empresa pode esperar

REGRAS IMPORTANTES:
- NÃO use JSON.
- NÃO use bullet points, números ou listas na saída final.
- NÃO use cabeçalhos como "Título:", "Descrição:".
- A resposta deve ser apenas texto corrido, pronto para ser usado na plataforma.

Agora, gere o título e a descrição seguindo exatamente esse formato.`;

  try {
    const result = await generateContent(prompt);

    if (!result.success || !result.content) {
      return {
        success: false,
        error: result.error || "Erro ao gerar consultoria",
      };
    }

    // Separar primeira linha (título) e o restante (descrição)
    const raw = result.content.trim();
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);

    const title = (lines[0] || topic).trim();
    const descriptionText = lines.slice(1).join("\n\n").trim() || raw;

    return {
      success: true,
      content: result.content,
      consultingData: {
        title,
        description: descriptionText,
        duration: 60,
        maxParticipants: 20,
        instructor: "Especialista BridgeAI",
        platform: "zoom",
        objectives: [],
        topics: [],
        targetAudience: "Profissionais interessados em IA e automação",
      },
    };
  } catch (error: any) {
    console.error("Erro ao gerar consultoria com IA:", error);
    return {
      success: false,
      error: error.message || "Erro ao gerar consultoria",
    };
  }
}

/**
 * Gera conteúdo completo de curso com IA
 */
export async function generateCourseContent(
  topic: string,
  category: string,
  numberOfLessons: number = 5
): Promise<GeminiResponse> {
  const prompt = `Você é um especialista em criação de cursos online de alta qualidade. Crie um curso completo e envolvente sobre "${topic}" na categoria "${category}".

⚠️ IMPORTANTE: O curso DEVE ter EXATAMENTE ${numberOfLessons} aulas. NEM MAIS, NEM MENOS. Crie exatamente ${numberOfLessons} aulas.

⚠️ CRÍTICO: CADA AULA DEVE TER TÍTULO E DESCRIÇÃO COMPLETAMENTE DIFERENTES E ÚNICOS. Não repita títulos ou descrições similares entre as aulas.

🎯 DIRETRIZES PARA TÍTULOS DAS AULAS:
- Sejam ATRAENTES, CLAROS e EXPLICATIVOS
- Expliquem o que o aluno vai aprender naquela aula específica
- Usem verbos de ação (Aprenda, Domine, Crie, Implemente, Desenvolva, Construa, Explore, Descubra, etc.)
- Sejam específicos e não genéricos
- Exemplos BONS: "Aprenda a Criar Seu Primeiro Projeto do Zero" | "Domine as Técnicas Avançadas de Otimização" | "Implemente Soluções Práticas em Casos Reais" | "Construa Aplicações Completas Passo a Passo"
- Exemplos RUINS: "Aula 1" | "Introdução" | "Conceitos Básicos" | "Continuação" | "Mais sobre o tema"
- Máximo 80 caracteres, mas sejam descritivos e explicativos

📝 DIRETRIZES PARA DESCRIÇÕES DAS AULAS:
- Sejam MOTIVADORAS e INCENTIVADORAS
- Expliquem claramente o que será abordado na aula
- Destaquem os benefícios e o que o aluno vai conseguir fazer após a aula
- Usem linguagem envolvente e positiva
- Incluam uma prévia do conteúdo (o que será visto)
- Sejam específicas e não genéricas
- Exemplos BONS: 
  * "Nesta aula, você vai aprender os fundamentos essenciais e criar seu primeiro projeto prático. Ao final, você terá as bases sólidas para avançar nos próximos módulos."
  * "Descubra técnicas avançadas que profissionais experientes usam no dia a dia. Você vai implementar soluções reais e ver resultados imediatos."
  * "Transforme teoria em prática criando projetos completos. Esta aula é o ponto de virada onde você aplica tudo que aprendeu."
- Exemplos RUINS: "Aula sobre conceitos básicos" | "Continuação do conteúdo anterior" | "Mais informações sobre o tema" | "Aprenda mais sobre..."
- Máximo 250 caracteres, mas sejam completas e explicativas

REGRAS CRÍTICAS PARA O JSON:
1. Todas as strings devem estar entre aspas duplas
2. Quebras de linha dentro de strings devem ser escapadas como \\n
3. Aspas dentro de strings devem ser escapadas como \\"
4. Descrições devem ser explicativas e motivadoras (máximo 250 caracteres)
5. Conteúdo das aulas deve ser detalhado (máximo 600 caracteres)
6. O array "lessons" DEVE ter EXATAMENTE ${numberOfLessons} itens
7. CADA aula deve ter um título ÚNICO, ATRAENTE e EXPLICATIVO
8. CADA aula deve ter uma descrição ÚNICA, MOTIVADORA e que EXPLIQUE o conteúdo

Para cada aula, forneça:
1. Título da aula (ATRAENTE, EXPLICATIVO, com verbo de ação, máximo 80 caracteres)
2. Descrição da aula (MOTIVADORA, que EXPLIQUE o que será aprendido e os benefícios, máximo 250 caracteres)
3. Duração estimada em minutos (entre 15-30 minutos por aula, pode variar)
4. Conteúdo resumido da aula (detalhado, explicando os tópicos principais, máximo 600 caracteres)
5. URL de vídeo exemplo (formato: https://youtube.com/watch?v=exemplo)

Estrutura progressiva do curso:
- Aula 1: Fundamentos e Primeiros Passos (título atrativo + descrição motivadora explicando o início)
- Aula 2: Conceitos Essenciais (título diferente + descrição que explique o que será aprendido)
- Aula 3: Aplicação Prática (título diferente + descrição que mostre os resultados)
- E assim por diante... cada aula com progressão clara, títulos únicos e descrições explicativas

Além disso, forneça:
- Objetivos de aprendizagem (3-5 objetivos claros e específicos, cada um máximo 120 caracteres)
- Pré-requisitos (máximo 3, cada um máximo 100 caracteres)

IMPORTANTE: Retorne APENAS um JSON válido, sem quebras de linha desnecessárias. Use \\n para quebras de linha dentro de strings.

Formato exato:
{"title":"Título do Curso","description":"Descrição do curso em uma linha. Use \\n para quebras.","objectives":["Objetivo 1","Objetivo 2"],"prerequisites":["Pré-requisito 1"],"lessons":[{"title":"Aprenda a Criar Seu Primeiro Projeto do Zero","description":"Nesta aula, você vai aprender os fundamentos essenciais e criar seu primeiro projeto prático. Ao final, você terá as bases sólidas para avançar.","duration":20,"order":1,"content":"Conteúdo detalhado explicando os tópicos principais da aula","videoUrl":"https://youtube.com/watch?v=exemplo"},{"title":"Domine as Técnicas Avançadas de Implementação","description":"Descubra técnicas avançadas que profissionais usam. Você vai implementar soluções reais e ver resultados imediatos nesta aula prática.","duration":25,"order":2,"content":"Conteúdo detalhado diferente explicando os tópicos desta aula","videoUrl":"https://youtube.com/watch?v=exemplo2"}]}

Lembre-se: 
- Títulos devem ser ATRAENTES, EXPLICATIVOS e com verbos de ação
- Descrições devem ser MOTIVADORAS, EXPLICATIVAS e mostrar benefícios
- Cada aula deve ser única e progressiva
- Não use títulos genéricos como "Aula 1", "Introdução", "Conceitos Básicos"

NÃO inclua texto adicional. Apenas o JSON puro e válido.`;

  try {
    const result = await generateContent(prompt);
    
    if (!result.success || !result.content) {
      return {
        success: false,
        error: result.error || "Erro ao gerar conteúdo do curso",
      };
    }

    // Tentar extrair JSON da resposta
    let jsonContent = result.content.trim();
    
    // Remover markdown code blocks se houver
    jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Tentar encontrar JSON no texto (procurar do primeiro { até o último })
    const firstBrace = jsonContent.indexOf('{');
    const lastBrace = jsonContent.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
    }
    
    // Função para corrigir JSON malformado
    const fixJSON = (text: string): string => {
      let result = '';
      let inString = false;
      let escapeNext = false;
      let depth = 0;
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (escapeNext) {
          result += char;
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          result += char;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          result += char;
          continue;
        }
        
        if (inString) {
          // Dentro de string: escapar quebras de linha
          if (char === '\n' || char === '\r') {
            result += '\\n';
          } else {
            result += char;
          }
        } else {
          // Fora de string
          if (char === '{' || char === '[') {
            depth++;
            result += char;
          } else if (char === '}' || char === ']') {
            depth--;
            result += char;
          } else if (char === '\n' || char === '\r') {
            // Substituir quebras de linha por espaço
            if (result[result.length - 1] !== ' ' && result[result.length - 1] !== ',') {
              result += ' ';
            }
          } else {
            result += char;
          }
        }
      }
      
      // Fechar strings não terminadas
      if (inString) {
        result += '"';
      }
      
      // Corrigir vírgulas
      result = result.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      result = result.replace(/,\s*,/g, ',');
      
      return result;
    };
    
    // Tentar corrigir strings não terminadas e outros problemas comuns
    try {
      // Primeiro, corrigir o JSON
      jsonContent = fixJSON(jsonContent);
      
      const parsed = JSON.parse(jsonContent);
      
      // Garantir que o número de aulas está correto
      if (parsed.lessons && Array.isArray(parsed.lessons)) {
        // Se tiver mais aulas do que solicitado, cortar
        if (parsed.lessons.length > numberOfLessons) {
          parsed.lessons = parsed.lessons.slice(0, numberOfLessons);
        }
        // Se tiver menos, criar aulas adicionais
        while (parsed.lessons.length < numberOfLessons) {
          const lastLesson = parsed.lessons[parsed.lessons.length - 1];
          parsed.lessons.push({
            title: `${topic} - Parte ${parsed.lessons.length + 1}`,
            description: `Continuação do conteúdo sobre ${topic}`,
            duration: 15,
            order: parsed.lessons.length + 1,
            content: "",
            videoUrl: "",
          });
        }
        // Reordenar e garantir ordem correta
        parsed.lessons.forEach((lesson: any, index: number) => {
          lesson.order = index + 1;
        });
      }
      
      // Validar estrutura básica
      if (!parsed.title || !parsed.lessons || !Array.isArray(parsed.lessons)) {
        throw new Error("Estrutura do JSON inválida: faltam campos obrigatórios");
      }
      
      return {
        success: true,
        courseData: parsed,
      };
    } catch (parseError: any) {
      console.error("Erro ao fazer parse do JSON:", parseError);
      console.error("Conteúdo recebido (primeiros 1000 chars):", jsonContent.substring(0, 1000));
      
      // Tentar uma abordagem mais permissiva: extrair apenas os campos essenciais usando regex
      try {
        const fallbackData: any = {
          title: topic,
          description: `Curso completo sobre ${topic} na categoria ${category}.`,
          objectives: [
            `Compreender os fundamentos de ${topic}`,
            `Aplicar conhecimentos práticos de ${topic}`,
            `Dominar conceitos avançados de ${topic}`
          ],
          prerequisites: [],
          lessons: [],
        };
        
        // Tentar extrair título do JSON
        const titleMatch = jsonContent.match(/"title"\s*:\s*"([^"]+)"/);
        if (titleMatch && titleMatch[1]) {
          fallbackData.title = titleMatch[1];
        }
        
        // Tentar extrair descrição (pode ter múltiplas linhas)
        const descMatch = jsonContent.match(/"description"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
        if (descMatch && descMatch[1]) {
          fallbackData.description = descMatch[1].replace(/\\n/g, ' ').replace(/\\"/g, '"');
        }
        
        // Tentar extrair objetivos
        const objectivesMatch = jsonContent.match(/"objectives"\s*:\s*\[(.*?)\]/s);
        if (objectivesMatch) {
          const objectivesText = objectivesMatch[1];
          const objectiveMatches = objectivesText.match(/"([^"]+)"/g);
          if (objectiveMatches) {
            fallbackData.objectives = objectiveMatches.map((m: string) => m.replace(/"/g, ''));
          }
        }
        
        // Tentar extrair aulas
        const lessonsMatch = jsonContent.match(/"lessons"\s*:\s*\[(.*?)\]/s);
        if (lessonsMatch) {
          const lessonsText = lessonsMatch[1];
          // Procurar por objetos de aula
          const lessonPattern = /\{\s*"title"\s*:\s*"([^"]+)"[^}]*"order"\s*:\s*(\d+)/g;
          let lessonMatch;
          const lessons: any[] = [];
          
          while ((lessonMatch = lessonPattern.exec(lessonsText)) !== null) {
            const order = parseInt(lessonMatch[2]);
            lessons.push({
              title: lessonMatch[1],
              description: `Aula sobre ${lessonMatch[1]}`,
              duration: 15,
              order: order,
              content: "",
              videoUrl: "",
            });
          }
          
          // Ordenar por order
          lessons.sort((a, b) => a.order - b.order);
          
          if (lessons.length > 0) {
            fallbackData.lessons = lessons;
          }
        }
        
        // Se não conseguiu extrair aulas, criar aulas genéricas
        if (fallbackData.lessons.length === 0) {
          for (let i = 1; i <= numberOfLessons; i++) {
            fallbackData.lessons.push({
              title: `Aula ${i}: ${topic} - Parte ${i}`,
              description: `Conteúdo da aula ${i} sobre ${topic}`,
              duration: 15,
              order: i,
              content: "",
              videoUrl: "",
            });
          }
        } else {
          // Garantir que tem exatamente o número solicitado de aulas
          if (fallbackData.lessons.length > numberOfLessons) {
            fallbackData.lessons = fallbackData.lessons.slice(0, numberOfLessons);
          } else if (fallbackData.lessons.length < numberOfLessons) {
            // Adicionar aulas faltantes
            const startIndex = fallbackData.lessons.length + 1;
            for (let i = startIndex; i <= numberOfLessons; i++) {
              fallbackData.lessons.push({
                title: `Aula ${i}: ${topic} - Parte ${i}`,
                description: `Conteúdo da aula ${i} sobre ${topic}`,
                duration: 15,
                order: i,
                content: "",
                videoUrl: "",
              });
            }
          }
        }
        
        // Garantir ordem correta
        fallbackData.lessons.forEach((lesson: any, index: number) => {
          lesson.order = index + 1;
        });
        
        return {
          success: true,
          courseData: fallbackData,
        };
      } catch (fallbackError) {
        console.error("Erro no fallback:", fallbackError);
        return {
          success: false,
          error: "Erro ao processar resposta da IA. Tente novamente ou crie o curso manualmente.",
        };
      }
    }
  } catch (error: any) {
    console.error("Erro ao gerar conteúdo do curso:", error);
    return {
      success: false,
      error: error.message || "Erro ao gerar conteúdo do curso",
    };
  }
}


