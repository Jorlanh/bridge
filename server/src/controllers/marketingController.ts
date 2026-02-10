import express, { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";
import { Campaign } from "../models/Campaign.js";
import { SocialConnection } from "../models/SocialConnection.js";
import { createNotification } from "../utils/notifications.js";

// Schemas de validação
const createCampaignSchema = z.object({
  name: z
    .string()
    .min(2, "O nome da campanha deve ter no mínimo 2 caracteres")
    .max(200, "O nome da campanha deve ter no máximo 200 caracteres")
    .trim(),
  budget: z
    .number()
    .positive("O orçamento deve ser um valor positivo")
    .min(0.01, "O orçamento deve ser maior que zero"),
  startDate: z
    .string()
    .datetime("Data de início inválida")
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início inválida. Use o formato YYYY-MM-DD")),
  endDate: z
    .string()
    .datetime("Data de fim inválida")
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de fim inválida. Use o formato YYYY-MM-DD")),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "A data de fim deve ser posterior à data de início",
  path: ["endDate"],
});

const updateCampaignSchema = z.object({
  name: z
    .string()
    .min(2, "O nome da campanha deve ter no mínimo 2 caracteres")
    .max(200, "O nome da campanha deve ter no máximo 200 caracteres")
    .trim()
    .optional(),
  status: z
    .enum(["active", "paused", "completed"], {
      errorMap: () => ({ message: "Status inválido. Use: active, paused ou completed" }),
    })
    .optional(),
  budget: z
    .number()
    .positive("O orçamento deve ser um valor positivo")
    .optional(),
  spent: z
    .number()
    .min(0, "O valor gasto não pode ser negativo")
    .optional(),
  leads: z
    .number()
    .int("O número de leads deve ser um inteiro")
    .min(0, "O número de leads não pode ser negativo")
    .optional(),
  conversion: z
    .number()
    .min(0, "A conversão não pode ser negativa")
    .max(100, "A conversão não pode ser maior que 100%")
    .optional(),
  startDate: z
    .string()
    .datetime("Data de início inválida")
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início inválida"))
    .optional(),
  endDate: z
    .string()
    .datetime("Data de fim inválida")
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de fim inválida"))
    .optional(),
});

const generateContentSchema = z.object({
  theme: z
    .string()
    .min(3, "O tema deve ter no mínimo 3 caracteres")
    .max(500, "O tema deve ter no máximo 500 caracteres")
    .trim(),
  platform: z
    .string()
    .min(2, "A plataforma deve ter no mínimo 2 caracteres")
    .trim(),
  tone: z
    .string()
    .trim()
    .optional(),
});

const connectSocialSchema = z.object({
  platform: z.enum(["facebook", "instagram", "linkedin"]),
  accountName: z.string().min(1, "Nome da conta é obrigatório").trim(),
  accountId: z.string().min(1, "ID da conta é obrigatório").trim(),
  accessToken: z.string().min(1, "Token de acesso é obrigatório"),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

// Buscar todas as campanhas do usuário
export const getCampaigns = async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await Campaign.find({ userId: req.userId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      campaigns: campaigns.map(campaign => ({
        id: campaign._id.toString(),
        name: campaign.name,
        status: campaign.status,
        budget: campaign.budget,
        spent: campaign.spent,
        leads: campaign.leads,
        conversion: campaign.conversion,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      })),
    });
  } catch (error) {
    console.error("Get campaigns error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar campanhas",
    });
  }
};

// Criar nova campanha
export const createCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const data = createCampaignSchema.parse(req.body);

    const campaign = new Campaign({
      name: data.name,
      budget: data.budget,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      userId: req.userId,
    });

    await campaign.save();

    res.status(201).json({
      success: true,
      campaign: {
        id: campaign._id.toString(),
        name: campaign.name,
        status: campaign.status,
        budget: campaign.budget,
        spent: campaign.spent,
        leads: campaign.leads,
        conversion: campaign.conversion,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Create campaign error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar campanha",
    });
  }
};

// Atualizar campanha
export const updateCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateCampaignSchema.parse(req.body);

    const campaign = await Campaign.findOne({ _id: id, userId: req.userId });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campanha não encontrada",
      });
    }

    if (data.name !== undefined) campaign.name = data.name;
    if (data.status !== undefined) campaign.status = data.status;
    if (data.budget !== undefined) campaign.budget = data.budget;
    if (data.spent !== undefined) campaign.spent = data.spent;
    if (data.leads !== undefined) campaign.leads = data.leads;
    if (data.conversion !== undefined) campaign.conversion = data.conversion;
    if (data.startDate) campaign.startDate = new Date(data.startDate);
    if (data.endDate) campaign.endDate = new Date(data.endDate);

    await campaign.save();

    // Criar notificação de atualização
    await createNotification({
      userId: req.userId!,
      title: "Campanha atualizada",
      message: `A campanha "${campaign.name}" foi atualizada com sucesso!`,
      type: "success",
      link: "/dashboard/marketing",
    });

    res.json({
      success: true,
      campaign: {
        id: campaign._id.toString(),
        name: campaign.name,
        status: campaign.status,
        budget: campaign.budget,
        spent: campaign.spent,
        leads: campaign.leads,
        conversion: campaign.conversion,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Update campaign error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar campanha",
    });
  }
};

// Deletar campanha
export const deleteCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findOneAndDelete({ _id: id, userId: req.userId });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campanha não encontrada",
      });
    }

    res.json({
      success: true,
      message: "Campanha deletada com sucesso",
    });
  } catch (error) {
    console.error("Delete campaign error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao deletar campanha",
    });
  }
};

// Gerar conteúdo com IA
export const generateContent = async (req: AuthRequest, res: Response) => {
  try {
    const data = generateContentSchema.parse(req.body);

    const { generateSocialPost } = await import("../utils/gemini.js");
    const result = await generateSocialPost(data.theme, data.platform, data.tone || "Profissional");

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Erro ao gerar conteúdo",
      });
    }

    res.json({
      success: true,
      content: result.content,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Generate content error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar conteúdo",
    });
  }
};

// Estatísticas de marketing
export const getMarketingStats = async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await Campaign.find({ userId: req.userId });
    
    const activeCampaigns = campaigns.filter(c => c.status === "active").length;
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
    const avgConversion = campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + c.conversion, 0) / campaigns.length
      : 0;
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const roi = totalSpent > 0 ? ((totalBudget - totalSpent) / totalSpent) * 100 : 0;

    res.json({
      success: true,
      stats: {
        activeCampaigns,
        totalLeads,
        avgConversion: Math.round(avgConversion * 10) / 10,
        roi: Math.round(roi),
      },
    });
  } catch (error) {
    console.error("Get marketing stats error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar estatísticas",
    });
  }
};

// Buscar conexões de redes sociais
export const getSocialConnections = async (req: AuthRequest, res: Response) => {
  try {
    const connections = await SocialConnection.find({ userId: req.userId, isActive: true });
    
    res.json({
      success: true,
      connections: connections.map(conn => ({
        id: conn._id.toString(),
        platform: conn.platform,
        accountName: conn.accountName,
        accountId: conn.accountId,
        isActive: conn.isActive,
        expiresAt: conn.expiresAt,
        profilePicture: conn.profilePicture,
        followersCount: conn.followersCount,
        followingCount: conn.followingCount,
        postsCount: conn.postsCount,
        username: conn.username,
        verified: conn.verified,
        lastSyncAt: conn.lastSyncAt,
      })),
    });
  } catch (error) {
    console.error("Get social connections error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar conexões",
    });
  }
};

// Sincronizar informações do perfil
export const syncProfileInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { platform } = req.params;
    const platformStr = Array.isArray(platform) ? platform[0] : platform;

    const connection = await SocialConnection.findOne({ 
      userId: req.userId, 
      platform: platformStr as any,
      isActive: true 
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Conexão não encontrada",
      });
    }

    // Buscar informações atualizadas
    let accountInfo = null;
    try {
      accountInfo = await getAccountInfo(platformStr, connection.accessToken);
    } catch (error: any) {
      console.error("Error fetching account info:", error);
      // Se houver erro, retornar erro mas não quebrar
      return res.status(400).json({
        success: false,
        message: "Erro ao buscar informações do perfil. Verifique se o token ainda é válido.",
      });
    }
    
    // Se não conseguir buscar informações, atualizar apenas a data de última tentativa
    if (!accountInfo) {
      connection.lastSyncAt = new Date();
      await connection.save();
      
      return res.status(400).json({
        success: false,
        message: "Erro ao buscar informações do perfil. Verifique se o token ainda é válido.",
        connection: {
          id: connection._id.toString(),
          platform: connection.platform,
          accountName: connection.accountName,
          accountId: connection.accountId,
          isActive: connection.isActive,
          profilePicture: connection.profilePicture,
          followersCount: connection.followersCount,
          followingCount: connection.followingCount,
          postsCount: connection.postsCount,
          username: connection.username,
          verified: connection.verified,
          lastSyncAt: connection.lastSyncAt,
          createdAt: connection.createdAt,
        },
      });
    }

    // Atualizar informações apenas se houver novos dados
    if (accountInfo.profilePicture) connection.profilePicture = accountInfo.profilePicture;
    if (accountInfo.followersCount !== undefined && accountInfo.followersCount !== null) {
      connection.followersCount = accountInfo.followersCount;
    }
    if (accountInfo.followingCount !== undefined && accountInfo.followingCount !== null) {
      connection.followingCount = accountInfo.followingCount;
    }
    if (accountInfo.postsCount !== undefined && accountInfo.postsCount !== null) {
      connection.postsCount = accountInfo.postsCount;
    }
    if (accountInfo.username) connection.username = accountInfo.username;
    if (accountInfo.verified !== undefined) connection.verified = accountInfo.verified;
    if (accountInfo.name) connection.accountName = accountInfo.name;
    connection.lastSyncAt = new Date();

    await connection.save();

    res.json({
      success: true,
      connection: {
        id: connection._id.toString(),
        platform: connection.platform,
        accountName: connection.accountName,
        accountId: connection.accountId,
        isActive: connection.isActive,
        profilePicture: connection.profilePicture,
        followersCount: connection.followersCount,
        followingCount: connection.followingCount,
        postsCount: connection.postsCount,
        username: connection.username,
        verified: connection.verified,
        lastSyncAt: connection.lastSyncAt,
        createdAt: connection.createdAt,
      },
      message: "Informações do perfil atualizadas com sucesso",
    });
  } catch (error: any) {
    console.error("Sync profile info error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao sincronizar informações do perfil",
    });
  }
};

// Publicar post no Facebook
const publishPostSchema = z.object({
  content: z.string().min(1, "Conteúdo é obrigatório"),
  platform: z.enum(["facebook", "instagram", "linkedin"]),
  postId: z.string().optional(), // ID do post no banco para buscar imagem
  imageUrl: z.string().optional(), // URL da imagem
});

export const publishPost = async (req: AuthRequest, res: Response) => {
  try {
    const data = publishPostSchema.parse(req.body);

    // Buscar conexão ativa da plataforma
    const connection = await SocialConnection.findOne({
      userId: req.userId,
      platform: data.platform,
      isActive: true,
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: `Nenhuma conexão ativa encontrada para ${data.platform}. Conecte sua conta primeiro.`,
      });
    }

    if (!connection.accessToken) {
      return res.status(400).json({
        success: false,
        message: "Token de acesso não encontrado. Reconecte sua conta.",
      });
    }

    // Buscar post no banco se postId fornecido para obter imageUrl
    let imageUrl = data.imageUrl;
    if (data.postId && !imageUrl) {
      const { Post } = await import("../models/Post.js");
      const post = await Post.findOne({ _id: data.postId, userId: req.userId });
      if (post && post.imageUrl) {
        imageUrl = post.imageUrl;
      }
    }

    // Construir URL completa da imagem se for relativa
    let fullImageUrl: string | null = null;
    if (imageUrl) {
      if (imageUrl.startsWith("http")) {
        fullImageUrl = imageUrl;
      } else {
        const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";
        fullImageUrl = `${backendUrl}${imageUrl}`;
      }
    }

    // Publicar no Facebook
    if (data.platform === "facebook") {
      try {
        // Primeiro, tentar buscar páginas do usuário
        let pageId: string | null = null;
        let pageToken: string | null = null;
        let pageName: string | null = null;
        let isPage = false;

        try {
          const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${connection.accessToken}`;
          const pagesRes = await fetch(pagesUrl);
          const pagesData = await pagesRes.json();

          

          if (pagesData.error) {
            console.error("❌ Erro ao buscar páginas:", pagesData.error);
            // Se der erro de permissão, tentar usar o perfil pessoal
            if (pagesData.error.code === 200 || pagesData.error.code === 10) {
              
            }
          } else if (pagesData.data && pagesData.data.length > 0) {
            // Usar a primeira página encontrada (ou a página conectada se o accountId corresponder)
            let selectedPage = pagesData.data[0];
            
            // Tentar encontrar a página que corresponde ao accountId salvo
            if (connection.accountId) {
              const matchingPage = pagesData.data.find((page: any) => page.id === connection.accountId);
              if (matchingPage) {
                selectedPage = matchingPage;
                
              }
            }

            pageId = selectedPage.id;
            pageToken = selectedPage.access_token;
            pageName = selectedPage.name;
            isPage = true;
          } else {
            
          }
        } catch (e) {
          
        }

        // Se não encontrou páginas, tentar usar o ID da página salvo ou perfil pessoal
        if (!pageId || !pageToken) {
          // Se o accountId salvo parece ser um ID de página (numérico longo), tentar usar diretamente
          if (connection.accountId && connection.accountId.length > 10 && /^\d+$/.test(connection.accountId)) {
            // Verificar se é realmente uma página ou perfil pessoal
            // Tentar usar o ID salvo primeiro (pode ser página)
            
            pageId = connection.accountId;
            pageToken = connection.accessToken;
            pageName = connection.accountName || "Sua Conta";
            isPage = true; // Assumir que é página primeiro
            
          } else {
            // Se não tem ID numérico longo ou não encontrou páginas, usar perfil pessoal
            
            pageId = "me";
            pageToken = connection.accessToken;
            pageName = connection.accountName || "Seu Perfil";
            isPage = false;
          }
        }

        // Publicar o post
        let publishUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`;
        const publishParams = new URLSearchParams({
          message: data.content,
          access_token: pageToken,
        });

        // Se houver imagem, usar photos endpoint
        if (fullImageUrl) {
          publishUrl = `https://graph.facebook.com/v18.0/${pageId}/photos`;
          publishParams.append("url", fullImageUrl);
        }

        const publishRes = await fetch(publishUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: publishParams.toString(),
        });

        const publishData = await publishRes.json();

        if (publishData.error) {
          console.error("Erro ao publicar no Facebook:", publishData.error);
          
          // Mensagens de erro mais específicas e úteis
          let errorMessage = publishData.error.message || "Erro desconhecido";
          let helpMessage = "";
          
          if (publishData.error.code === 200) {
            if (isPage) {
              // Se tentou publicar em página e falhou, tentar perfil pessoal
              if (pageId !== "me" && pageId !== connection.accountId) {
                
                // Tentar novamente no perfil pessoal
                const personalPublishUrl = `https://graph.facebook.com/v18.0/me/feed`;
                const personalPublishParams = new URLSearchParams({
                  message: data.content,
                  access_token: connection.accessToken,
                });

                const personalPublishRes = await fetch(personalPublishUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  body: personalPublishParams.toString(),
                });

                const personalPublishData = await personalPublishRes.json();

                if (!personalPublishData.error) {
                  // Sucesso ao publicar no perfil pessoal
                  connection.lastSyncAt = new Date();
                  await connection.save();

                  return res.json({
                    success: true,
                    message: "Post publicado com sucesso no seu perfil pessoal!",
                    postId: personalPublishData.id,
                    url: personalPublishData.id ? `https://www.facebook.com/${personalPublishData.id}` : null,
                  });
                }
              }
              
              errorMessage = "Permissões insuficientes para publicar na página.";
              helpMessage = "SOLUÇÃO: 1) Certifique-se de que você é administrador da página. 2) O app precisa estar em modo de desenvolvimento com você como usuário de teste, OU o app precisa ser revisado pelo Facebook.";
          } else {
            // Se tentou publicar no perfil pessoal e falhou, pode ser falta de permissões
            // Mas o Facebook geralmente não permite publicação em perfis pessoais via API
            errorMessage = "Não é possível publicar no perfil pessoal via API do Facebook.";
            helpMessage = "SOLUÇÃO: O Facebook não permite mais publicação automática em perfis pessoais sem permissões especiais. Crie uma página do Facebook (é gratuito) e publique nela. Vá em: https://www.facebook.com/pages/create";
          }
          } else if (publishData.error.code === 100) {
            // ID não permitido - pode ser perfil pessoal ou página sem acesso
            
            // Tentar publicar no perfil pessoal
            const personalPublishUrl = `https://graph.facebook.com/v18.0/me/feed`;
            const personalPublishParams = new URLSearchParams({
              message: data.content,
              access_token: connection.accessToken,
            });

            const personalPublishRes = await fetch(personalPublishUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: personalPublishParams.toString(),
            });

            const personalPublishData = await personalPublishRes.json();

            if (!personalPublishData.error) {
              // Sucesso ao publicar no perfil pessoal
              connection.lastSyncAt = new Date();
              await connection.save();

              return res.json({
                success: true,
                message: "Post publicado com sucesso no seu perfil pessoal!",
                postId: personalPublishData.id,
                url: personalPublishData.id ? `https://www.facebook.com/${personalPublishData.id}` : null,
              });
            }
            
            errorMessage = "ID não permitido para publicação. O ID fornecido pode ser de um perfil pessoal ou você não tem acesso à página.";
            helpMessage = "SOLUÇÃO: 1) Verifique se o ID é de uma página real (não perfil pessoal). 2) Certifique-se de que você é administrador da página. 3) Tente usar o método automático (OAuth) para obter o token de página correto.";
          } else if (publishData.error.code === 190) {
            errorMessage = "Token de acesso inválido ou expirado.";
            helpMessage = "SOLUÇÃO: Reconecte sua conta do Facebook.";
          } else if (publishData.error.code === 10) {
            errorMessage = "Permissão negada.";
            helpMessage = "SOLUÇÃO: Você precisa ser administrador da página e o app precisa ter permissões de publicação.";
          }
          
          return res.status(400).json({
            success: false,
            message: `Erro ao publicar: ${errorMessage}${helpMessage ? ` ${helpMessage}` : ""}`,
            error: publishData.error,
            helpMessage: helpMessage || undefined,
          });
        }

        // Atualizar última sincronização
        if (isPage && pageId !== "me") {
          connection.accountId = pageId;
          connection.accountName = pageName || connection.accountName;
          connection.accessToken = pageToken; // Atualizar com token de página se for página
        }
        connection.lastSyncAt = new Date();
        await connection.save();

        res.json({
          success: true,
          message: `Post publicado com sucesso${isPage ? ` na página "${pageName}"` : " no seu perfil"}!`,
          postId: publishData.id,
          url: publishData.id ? `https://www.facebook.com/${publishData.id}` : null,
        });
      } catch (error: any) {
        console.error("Erro ao publicar no Facebook:", error);
        return res.status(500).json({
          success: false,
          message: `Erro ao publicar no Facebook: ${error.message || "Erro desconhecido"}`,
        });
      }
    } else if (data.platform === "instagram") {
      // Publicar no Instagram
      try {
        // Instagram requer uma página do Facebook conectada
        // Primeiro, buscar páginas do Facebook
        const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${connection.accessToken}`;
        const pagesRes = await fetch(pagesUrl);
        const pagesData = await pagesRes.json();

        if (pagesData.error || !pagesData.data || pagesData.data.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Nenhuma página do Facebook encontrada. O Instagram requer uma página do Facebook conectada. Crie uma página em: https://www.facebook.com/pages/create",
            helpMessage: "SOLUÇÃO: 1) Crie uma página do Facebook. 2) Conecte sua conta Instagram Business à página. 3) Reconecte sua conta no sistema.",
          });
        }

        // Usar a primeira página ou a página salva
        let selectedPage = pagesData.data[0];
        if (connection.accountId) {
          const matchingPage = pagesData.data.find((page: any) => page.id === connection.accountId);
          if (matchingPage) {
            selectedPage = matchingPage;
          }
        }

        const pageId = selectedPage.id;
        const pageToken = selectedPage.access_token;

        // Buscar Instagram Business Account ID
        const pageInfoUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`;
        const pageInfoRes = await fetch(pageInfoUrl);
        const pageInfoData = await pageInfoRes.json();

        if (pageInfoData.error || !pageInfoData.instagram_business_account) {
          return res.status(400).json({
            success: false,
            message: "Conta Instagram Business não encontrada. Certifique-se de que sua conta Instagram está conectada à página do Facebook.",
            helpMessage: "SOLUÇÃO: 1) Vá em Configurações da sua página do Facebook. 2) Conecte sua conta Instagram Business. 3) Certifique-se de que é uma conta Business ou Creator (não pessoal).",
          });
        }

        const instagramAccountId = pageInfoData.instagram_business_account.id;

        // Instagram requer imagem para posts no feed
        if (!fullImageUrl) {
          return res.status(400).json({
            success: false,
            message: "Instagram requer uma imagem para publicar posts no feed. Adicione uma imagem ao post.",
          });
        }

        // Passo 1: Criar container de mídia
        const containerUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/media`;
        const containerParams = new URLSearchParams({
          image_url: fullImageUrl,
          caption: data.content,
          access_token: pageToken,
        });

        const containerRes = await fetch(containerUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: containerParams.toString(),
        });

        const containerData = await containerRes.json();

        if (containerData.error) {
          console.error("Erro ao criar container Instagram:", containerData.error);
          let errorMessage = containerData.error.message || "Erro desconhecido";
          let helpMessage = "";

          if (containerData.error.code === 100) {
            errorMessage = "URL da imagem inválida ou inacessível.";
            helpMessage = "SOLUÇÃO: Certifique-se de que a URL da imagem é pública e acessível.";
          } else if (containerData.error.code === 190) {
            errorMessage = "Token de acesso inválido ou expirado.";
            helpMessage = "SOLUÇÃO: Reconecte sua conta do Instagram.";
          } else if (containerData.error.code === 2207007) {
            errorMessage = "Limite de publicações atingido. Instagram permite máximo de 25 posts por 24 horas.";
            helpMessage = "SOLUÇÃO: Aguarde 24 horas ou publique manualmente.";
          }

          return res.status(400).json({
            success: false,
            message: `Erro ao criar post no Instagram: ${errorMessage}${helpMessage ? ` ${helpMessage}` : ""}`,
            error: containerData.error,
            helpMessage: helpMessage || undefined,
          });
        }

        const creationId = containerData.id;

        // Passo 2: Publicar o container
        const publishUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`;
        const publishParams = new URLSearchParams({
          creation_id: creationId,
          access_token: pageToken,
        });

        const publishRes = await fetch(publishUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: publishParams.toString(),
        });

        const publishData = await publishRes.json();

        if (publishData.error) {
          console.error("Erro ao publicar no Instagram:", publishData.error);
          let errorMessage = publishData.error.message || "Erro desconhecido";
          let helpMessage = "";

          if (publishData.error.code === 2207007) {
            errorMessage = "Limite de publicações atingido. Instagram permite máximo de 25 posts por 24 horas.";
            helpMessage = "SOLUÇÃO: Aguarde 24 horas ou publique manualmente.";
          } else if (publishData.error.code === 190) {
            errorMessage = "Token de acesso inválido ou expirado.";
            helpMessage = "SOLUÇÃO: Reconecte sua conta do Instagram.";
          }

          return res.status(400).json({
            success: false,
            message: `Erro ao publicar no Instagram: ${errorMessage}${helpMessage ? ` ${helpMessage}` : ""}`,
            error: publishData.error,
            helpMessage: helpMessage || undefined,
          });
        }

        // Atualizar conexão
        connection.accountId = instagramAccountId;
        connection.accountName = selectedPage.name || connection.accountName;
        connection.lastSyncAt = new Date();
        await connection.save();

        res.json({
          success: true,
          message: "Post publicado com sucesso no Instagram!",
          postId: publishData.id,
          url: publishData.id ? `https://www.instagram.com/p/${publishData.id}/` : null,
        });
      } catch (error: any) {
        console.error("Erro ao publicar no Instagram:", error);
        return res.status(500).json({
          success: false,
          message: `Erro ao publicar no Instagram: ${error.message || "Erro desconhecido"}`,
        });
      }
    } else if (data.platform === "linkedin") {
      // Publicar no LinkedIn
      try {
        // LinkedIn requer formato específico de UGC Posts
        // Primeiro, obter informações do perfil
        const meUrl = `https://api.linkedin.com/v2/me?oauth2_access_token=${connection.accessToken}`;
        const meRes = await fetch(meUrl);
        const meData = await meRes.json();

        if (meData.error || !meData.id) {
          return res.status(400).json({
            success: false,
            message: "Erro ao obter informações do perfil LinkedIn. Token pode estar inválido.",
            helpMessage: "SOLUÇÃO: Reconecte sua conta do LinkedIn.",
          });
        }

        const personUrn = `urn:li:person:${meData.id}`;

        // Criar UGC Post
        // LinkedIn usa formato específico para posts
        const shareUrl = `https://api.linkedin.com/v2/ugcPosts`;
        
        const shareBody = {
          author: personUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text: data.content,
              },
              shareMediaCategory: fullImageUrl ? "IMAGE" : "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        };

        // Se houver imagem, adicionar ao post
        if (fullImageUrl) {
          // LinkedIn requer upload da imagem primeiro para obter URN
          // Por simplicidade, vamos publicar apenas texto por enquanto
          // Para imagens, seria necessário: upload -> obter URN -> incluir no post
          // Isso requer implementação adicional de upload
        }

        const shareRes = await fetch(shareUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${connection.accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          body: JSON.stringify(shareBody),
        });

        const shareData = await shareRes.json();

        if (shareRes.status !== 201) {
          console.error("Erro ao publicar no LinkedIn:", shareData);
          let errorMessage = shareData.message || "Erro desconhecido";
          let helpMessage = "";

          if (shareRes.status === 401) {
            errorMessage = "Token de acesso inválido ou expirado.";
            helpMessage = "SOLUÇÃO: Reconecte sua conta do LinkedIn.";
          } else if (shareRes.status === 403) {
            errorMessage = "Permissões insuficientes. Certifique-se de que o app tem permissão 'w_member_social'.";
            helpMessage = "SOLUÇÃO: Reconecte sua conta e autorize a permissão de publicação.";
          } else if (shareRes.status === 429) {
            errorMessage = "Limite de requisições excedido. Aguarde alguns minutos.";
            helpMessage = "SOLUÇÃO: LinkedIn limita o número de posts. Aguarde antes de tentar novamente.";
          }

          return res.status(shareRes.status).json({
            success: false,
            message: `Erro ao publicar no LinkedIn: ${errorMessage}${helpMessage ? ` ${helpMessage}` : ""}`,
            error: shareData,
            helpMessage: helpMessage || undefined,
          });
        }

        // Atualizar conexão
        connection.lastSyncAt = new Date();
        await connection.save();

        // LinkedIn retorna o ID no header Location
        const postId = shareRes.headers.get("x-linkedin-id") || shareData.id || "unknown";

        res.json({
          success: true,
          message: "Post publicado com sucesso no LinkedIn!",
          postId: postId,
          url: `https://www.linkedin.com/feed/update/${postId}`,
        });
      } catch (error: any) {
        console.error("Erro ao publicar no LinkedIn:", error);
        return res.status(500).json({
          success: false,
          message: `Erro ao publicar no LinkedIn: ${error.message || "Erro desconhecido"}`,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: `Plataforma ${data.platform} não suportada`,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Publish post error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao publicar post",
    });
  }
};

// Iniciar fluxo OAuth - Gera URL de autorização
export const startOAuthFlow = async (req: AuthRequest, res: Response) => {
  try {
    const { platform } = req.params;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    // Callback será processado pelo servidor e depois redirecionado para o frontend
    const callbackUrl = `${process.env.BACKEND_URL || "http://localhost:3001"}/api/marketing/oauth/callback`;

    // Verificar se as credenciais OAuth estão configuradas
    const oauthConfig = getOAuthConfig(platform as any);
    if (!oauthConfig) {
      return res.status(400).json({
        success: false,
        message: "Plataforma não suportada ou não configurada. Configure as credenciais OAuth no arquivo .env do servidor.",
      });
    }

    // Gerar state para segurança (prevenir CSRF) - incluir userId e timestamp
    const state = Buffer.from(`${req.userId}-${Date.now()}-${platform}`).toString('base64');

    const authUrl = buildOAuthUrl(platform as any, oauthConfig, callbackUrl, state);

    res.json({
      success: true,
      authUrl,
      state,
    });
  } catch (error) {
    console.error("Start OAuth flow error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao iniciar fluxo OAuth",
    });
  }
};

// Processar callback OAuth
export const handleOAuthCallback = async (req: express.Request, res: Response) => {
  try {
    const { code, state, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";

    if (error) {
      console.error("OAuth error:", error);
      return res.redirect(`${frontendUrl}/oauth/callback?error=${encodeURIComponent(error as string)}`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/oauth/callback?error=missing_params`);
    }

    // Validar state e extrair userId e platform
    let userId: string | null = null;
    let platform: string | null = null;
    try {
      const decodedState = Buffer.from(state as string, 'base64').toString('utf-8');
      const parts = decodedState.split('-');
      userId = parts[0];
      platform = parts[2] || null;
    } catch (e) {
      console.error("Erro ao decodificar state:", e);
      return res.redirect(`${frontendUrl}/oauth/callback?error=invalid_state`);
    }

    if (!userId || !platform) {
      return res.redirect(`${frontendUrl}/oauth/callback?error=invalid_state`);
    }

    const oauthConfig = getOAuthConfig(platform as any);
    if (!oauthConfig) {
      return res.redirect(`${frontendUrl}/oauth/callback?error=invalid_platform`);
    }

    // Trocar código por token
    const callbackUrl = `${process.env.BACKEND_URL || "http://localhost:3001"}/api/marketing/oauth/callback`;
    const tokenData = await exchangeCodeForToken(platform as any, code as string, oauthConfig, callbackUrl);
    
    if (!tokenData) {
      console.error("Token exchange failed");
      return res.redirect(`${frontendUrl}/oauth/callback?error=token_exchange_failed`);
    }

    // Obter informações da conta
    const accountInfo = await getAccountInfo(platform as any, tokenData.accessToken);
    
    if (!accountInfo) {
      console.error("Account info failed");
      return res.redirect(`${frontendUrl}/oauth/callback?error=account_info_failed`);
    }

    // Para Facebook, tentar obter token de página se houver páginas
    let pageToken = tokenData.accessToken;
    let pageId = accountInfo.id;
    let pageName = accountInfo.name;

    if (platform === "facebook") {
      try {
        // Buscar páginas do usuário - os tokens de página já vêm com permissões necessárias
        // Mesmo sem permissões explícitas, podemos tentar buscar páginas
        const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category&access_token=${tokenData.accessToken}`;
        const pagesRes = await fetch(pagesUrl);
        const pagesData = await pagesRes.json();

        

        if (pagesData.error) {
          // Continuar com perfil pessoal se não conseguir buscar páginas
        } else if (pagesData.data && pagesData.data.length > 0) {
          // Usar a primeira página encontrada
          const selectedPage = pagesData.data[0];
          pageId = selectedPage.id;
          pageToken = selectedPage.access_token; // Token de página tem permissões necessárias
          pageName = selectedPage.name;
        } else {
          
          
          // Tentar buscar informações do perfil para ver se é uma página
          try {
            const profileUrl = `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${tokenData.accessToken}`;
            const profileRes = await fetch(profileUrl);
            const profileData = await profileRes.json();
            
            if (profileData.id && !profileData.error) {
              // Verificar se o ID parece ser de uma página (IDs numéricos longos geralmente são páginas)
              if (profileData.id.length > 10) {
                
                pageId = profileData.id;
                pageToken = tokenData.accessToken;
                pageName = profileData.name;
              }
            }
          } catch (e) {
            
          }
          
          if (!pageId) {
            
          }
        }
      } catch (e) {
        
        // Continuar com token de usuário
      }
    }

    // Salvar conexão com informações do perfil
    const existing = await SocialConnection.findOne({ 
      userId: userId as any, 
      platform: platform as any 
    });

    const profileData = {
      accountName: pageName || accountInfo.name,
      accountId: pageId,
      accessToken: pageToken, // Usar token de página se disponível
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt,
      isActive: true,
      profilePicture: accountInfo.profilePicture || null,
      followersCount: accountInfo.followersCount || null,
      followingCount: accountInfo.followingCount || null,
      postsCount: accountInfo.postsCount || null,
      username: accountInfo.username || accountInfo.name,
      verified: accountInfo.verified || false,
      lastSyncAt: new Date(),
    };

    if (existing) {
      Object.assign(existing, profileData);
      await existing.save();
    } else {
      await SocialConnection.create({
        userId: userId as any,
        platform: platform as any,
        ...profileData,
      });
    }

    // Redirecionar para o frontend com sucesso
    
    res.redirect(`${frontendUrl}/oauth/callback?connected=${platform}`);
  } catch (error) {
    console.error("Handle OAuth callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    res.redirect(`${frontendUrl}/oauth/callback?error=oauth_failed`);
  }
};

// Funções auxiliares OAuth
function getOAuthConfig(platform: "facebook" | "instagram" | "linkedin") {
  const configs: Record<string, any> = {
    facebook: {
      clientId: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
      scope: "public_profile", // Permissões básicas - tokens de página serão obtidos depois
    },
    instagram: {
      clientId: process.env.FACEBOOK_APP_ID, // Instagram usa o mesmo app do Facebook
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
      scope: "instagram_basic,instagram_content_publish",
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      authUrl: "https://www.linkedin.com/oauth/v2/authorization",
      tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
      scope: "w_member_social",
    },
  };

  const config = configs[platform];
  if (!config || !config.clientId || !config.clientSecret) {
    return null;
  }
  return config;
}

function buildOAuthUrl(platform: string, config: any, callbackUrl: string, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    state: state,
  });

  // Adicionar scope apenas se não estiver vazio
  if (config.scope && config.scope.trim() !== "") {
    params.append("scope", config.scope);
  }

  return `${config.authUrl}?${params.toString()}`;
}

async function exchangeCodeForToken(platform: string, code: string, config: any, callbackUrl: string): Promise<any> {
  try {
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code as string,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    });

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Token exchange error:", data);
      return null;
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  } catch (error) {
    console.error("Exchange code for token error:", error);
    return null;
  }
}

async function getAccountInfo(platform: string, accessToken: string): Promise<any> {
  try {
    if (platform === "facebook") {
      // Buscar informações básicas do perfil (sem followers_count que não existe para perfis pessoais)
      const meUrl = `https://graph.facebook.com/v18.0/me?fields=id,name,picture{url}&access_token=${accessToken}`;
      const meRes = await fetch(meUrl);
      
      if (!meRes.ok) {
        console.error("Facebook API error - Status:", meRes.status);
        return null;
      }
      
      const meData = await meRes.json();
      
      if (meData.error) {
        console.error("Get Facebook account info error:", meData.error);
        return null;
      }

      // Tentar obter informações da página se o usuário tiver páginas
      let pageInfo = null;
      try {
        const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,picture{url},followers_count&access_token=${accessToken}`;
        const pagesRes = await fetch(pagesUrl);
        
        if (!pagesRes.ok) {
          // Se não tiver permissão ou não tiver páginas, continuar com perfil pessoal
        } else {
          const pagesData = await pagesRes.json();
          
          if (pagesData.error) {
          } else if (pagesData.data && pagesData.data.length > 0) {
            // Usar a primeira página encontrada
            pageInfo = pagesData.data[0];
          }
        }
      } catch (e) {
        // Ignorar erro se não tiver páginas ou não tiver permissão
      }

      // Se encontrou uma página, usar informações da página, senão usar perfil pessoal
      const account = pageInfo || meData;
      
      return {
        id: account.id,
        name: account.name,
        username: account.username || account.name,
        profilePicture: account.picture?.data?.url || account.picture?.url || null,
        followersCount: account.followers_count || null, // Só existe para páginas
        verified: false,
      };
    } else if (platform === "instagram") {
      // Primeiro obter página conectada
      const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`;
      const pagesRes = await fetch(pagesUrl);
      
      if (!pagesRes.ok) {
        console.error("Erro ao buscar páginas do Facebook para Instagram:", pagesRes.status);
        return null;
      }
      
      const pagesData = await pagesRes.json();
      
      if (pagesData.error) {
        console.error("Erro na API do Facebook:", pagesData.error);
        return null;
      }
      
      if (pagesData.data && pagesData.data.length > 0) {
        const pageId = pagesData.data[0].id;
        const instagramUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`;
        const instagramRes = await fetch(instagramUrl);
        
        if (!instagramRes.ok) {
          console.error("Erro ao buscar conta Instagram:", instagramRes.status);
          return null;
        }
        
        const instagramData = await instagramRes.json();
        
        if (instagramData.error) {
          console.error("Erro na API do Instagram:", instagramData.error);
          return null;
        }
        
        if (instagramData.instagram_business_account) {
          const igAccountId = instagramData.instagram_business_account.id;
          // Buscar informações completas do Instagram
          const accountUrl = `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,username,profile_picture_url,followers_count,follows_count,media_count&access_token=${accessToken}`;
          const accountRes = await fetch(accountUrl);
          
          if (!accountRes.ok) {
            console.error("Erro ao buscar detalhes do Instagram:", accountRes.status);
            return {
              id: igAccountId,
              name: "Instagram Account",
              username: null,
            };
          }
          
          const accountData = await accountRes.json();
          
          if (accountData.error) {
            console.error("Get Instagram account info error:", accountData.error);
            return {
              id: igAccountId,
              name: accountData.username || "Instagram Account",
              username: accountData.username,
            };
          }
          
          return {
            id: accountData.id,
            name: accountData.username || "Instagram Account",
            username: accountData.username,
            profilePicture: accountData.profile_picture_url || null,
            followersCount: accountData.followers_count || 0,
            followingCount: accountData.follows_count || 0,
            postsCount: accountData.media_count || 0,
            verified: false, // Instagram não retorna isso facilmente
          };
        }
      }
      return null;
    } else if (platform === "linkedin") {
      // Buscar informações completas do LinkedIn
      const meUrl = `https://api.linkedin.com/v2/me?oauth2_access_token=${accessToken}`;
      const meRes = await fetch(meUrl);
      
      if (!meRes.ok) {
        console.error("Erro ao buscar perfil do LinkedIn - Status:", meRes.status);
        return null;
      }
      
      const meData = await meRes.json();
      
      if (meData.errorCode || meData.serviceErrorCode) {
        console.error("Get LinkedIn account info error:", meData);
        return null;
      }

      // Buscar foto do perfil
      let profilePicture = null;
      try {
        const pictureUrl = `https://api.linkedin.com/v2/me?projection=(id,profilePicture(displayImage~:playableStreams))&oauth2_access_token=${accessToken}`;
        const pictureRes = await fetch(pictureUrl);
        const pictureData = await pictureRes.json();
        
        if (pictureData.profilePicture?.["displayImage~"]?.elements) {
          const images = pictureData.profilePicture["displayImage~"].elements;
          if (images.length > 0) {
            profilePicture = images[images.length - 1].identifiers[0]?.identifier;
          }
        }
      } catch (e) {
        // Ignorar erro se não conseguir foto
      }

      const firstName = meData.localizedFirstName || "";
      const lastName = meData.localizedLastName || "";
      const fullName = `${firstName} ${lastName}`.trim();

      return {
        id: meData.id,
        name: fullName || "LinkedIn Account",
        username: meData.vanityName || meData.id,
        profilePicture: profilePicture,
        verified: false,
      };
    }

    return null;
  } catch (error) {
    console.error("Get account info error:", error);
    return null;
  }
}

// Conectar rede social (método manual - mantido para compatibilidade)
export const connectSocial = async (req: AuthRequest, res: Response) => {
  try {
    const data = connectSocialSchema.parse(req.body);

    // Tentar buscar informações do perfil com o token fornecido
    let profileInfo = null;
    try {
      profileInfo = await getAccountInfo(data.platform, data.accessToken);
    } catch (error) {
      console.error("Erro ao buscar informações do perfil:", error);
      // Continuar mesmo se não conseguir buscar informações
    }

    // Verificar se já existe conexão para esta plataforma
    const existing = await SocialConnection.findOne({ 
      userId: req.userId, 
      platform: data.platform 
    });

    const profileData = {
      accountName: profileInfo?.name || data.accountName,
      accountId: data.accountId || profileInfo?.id, // Priorizar ID fornecido manualmente
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      isActive: true,
      profilePicture: profileInfo?.profilePicture || null,
      followersCount: profileInfo?.followersCount || null,
      followingCount: profileInfo?.followingCount || null,
      postsCount: profileInfo?.postsCount || null,
      username: profileInfo?.username || data.accountName,
      verified: profileInfo?.verified || false,
      lastSyncAt: new Date(),
    };

    if (existing) {
      // Atualizar conexão existente
      Object.assign(existing, profileData);
      await existing.save();

      return res.json({
        success: true,
        connection: {
          id: existing._id.toString(),
          platform: existing.platform,
          accountName: existing.accountName,
          accountId: existing.accountId,
          isActive: existing.isActive,
          profilePicture: existing.profilePicture,
          followersCount: existing.followersCount,
          followingCount: existing.followingCount,
          postsCount: existing.postsCount,
          username: existing.username,
          verified: existing.verified,
          lastSyncAt: existing.lastSyncAt,
        },
        message: "Conexão atualizada com sucesso",
      });
    }

    // Criar nova conexão
    const connection = new SocialConnection({
      userId: req.userId,
      platform: data.platform,
      ...profileData,
    });

    await connection.save();

    res.status(201).json({
      success: true,
      connection: {
        id: connection._id.toString(),
        platform: connection.platform,
        accountName: connection.accountName,
        accountId: connection.accountId,
        isActive: connection.isActive,
        profilePicture: connection.profilePicture,
        followersCount: connection.followersCount,
        followingCount: connection.followingCount,
        postsCount: connection.postsCount,
        username: connection.username,
        verified: connection.verified,
        lastSyncAt: connection.lastSyncAt,
      },
      message: "Rede social conectada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors.map((err) => err.message).join(", "),
      });
    }

    console.error("Connect social error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao conectar rede social",
    });
  }
};

// Desconectar rede social
export const disconnectSocial = async (req: AuthRequest, res: Response) => {
  try {
    const { platform } = req.params;

    const connection = await SocialConnection.findOne({ 
      userId: req.userId, 
      platform: platform as any 
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Conexão não encontrada",
      });
    }

    connection.isActive = false;
    await connection.save();

    res.json({
      success: true,
      message: "Rede social desconectada com sucesso",
    });
  } catch (error) {
    console.error("Disconnect social error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao desconectar rede social",
    });
  }
};
