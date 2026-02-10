import { SocialConnection } from "../models/SocialConnection.js";
import mongoose from "mongoose";

/**
 * Renova token de acesso para uma conexão social
 */
export async function refreshAccessToken(connection: any): Promise<boolean> {
  try {
    const { platform, refreshToken, accessToken } = connection;

    if (!refreshToken) {
      return false;
    }

    if (platform === "facebook" || platform === "instagram") {
      // Facebook/Instagram: usar o access token atual para gerar um novo de longa duração
      const tokenUrl = "https://graph.facebook.com/v18.0/oauth/access_token";
      const params = new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.FACEBOOK_APP_ID || "",
        client_secret: process.env.FACEBOOK_APP_SECRET || "",
        fb_exchange_token: accessToken, // Facebook usa o access token atual para gerar um novo
      });

      const response = await fetch(`${tokenUrl}?${params.toString()}`, {
        method: "GET",
      });

      const data = await response.json();

      if (data.error) {
        console.error(`[Token Refresh] Erro ao renovar token Facebook/Instagram:`, data.error);
        return false;
      }

      // Atualizar conexão com novo token
      connection.accessToken = data.access_token;
      if (data.expires_in) {
        connection.expiresAt = new Date(Date.now() + data.expires_in * 1000);
      }
      connection.lastSyncAt = new Date();
      await connection.save();

      return true;
    } else if (platform === "linkedin") {
      // LinkedIn: usar refresh token
      const tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";
      const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID || "",
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
      });

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (data.error || data.error_description) {
        console.error(`[Token Refresh] Erro ao renovar token LinkedIn:`, data.error || data.error_description);
        return false;
      }

      // Atualizar conexão com novo token
      connection.accessToken = data.access_token;
      if (data.refresh_token) {
        connection.refreshToken = data.refresh_token;
      }
      if (data.expires_in) {
        connection.expiresAt = new Date(Date.now() + data.expires_in * 1000);
      }
      connection.lastSyncAt = new Date();
      await connection.save();

      return true;
    }

    return false;
  } catch (error) {
    console.error(`[Token Refresh] Erro ao renovar token para ${connection.platform}:`, error);
    return false;
  }
}

/**
 * Verifica e renova tokens que estão próximos de expirar (dentro de 7 dias)
 */
export async function refreshExpiringTokens(): Promise<void> {
  try {
    // Verificar se o MongoDB está conectado antes de fazer a query
    if (mongoose.connection.readyState !== 1) {
      console.log("[Token Refresh] MongoDB não está conectado. Pulando verificação de tokens.");
      return;
    }

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Buscar conexões com tokens expirando em até 7 dias
    // Adicionar timeout personalizado e maxTimeMS para evitar timeout longo
    const expiringConnections = await SocialConnection.find({
      isActive: true,
      expiresAt: {
        $lte: sevenDaysFromNow,
        $gte: new Date(), // Ainda não expirado
      },
    })
      .maxTimeMS(5000) // Timeout de 5 segundos
      .lean(); // Usar lean() para melhor performance

    if (expiringConnections.length === 0) {
      return; // Nenhum token expirando
    }

    console.log(`[Token Refresh] Encontrados ${expiringConnections.length} tokens expirando. Renovando...`);

    for (const connectionData of expiringConnections) {
      try {
        // Buscar o documento completo para poder salvar
        const connection = await SocialConnection.findById(connectionData._id);
        if (connection) {
          await refreshAccessToken(connection);
          // Pequeno delay para não sobrecarregar APIs
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`[Token Refresh] Erro ao renovar token para conexão ${connectionData._id}:`, error);
        // Continuar com os próximos tokens mesmo se um falhar
      }
    }
  } catch (error: any) {
    // Verificar se é erro de timeout ou conexão
    if (error.name === "MongooseError" && error.message.includes("buffering timed out")) {
      console.log("[Token Refresh] MongoDB não está conectado ou está lento. Pulando verificação.");
    } else {
      console.error("[Token Refresh] Erro ao verificar tokens expirando:", error);
    }
  }
}

/**
 * Verifica se um token está válido fazendo uma requisição de teste
 */
export async function validateToken(platform: string, accessToken: string): Promise<boolean> {
  try {
    if (platform === "facebook" || platform === "instagram") {
      const testUrl = `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`;
      const response = await fetch(testUrl);
      const data = await response.json();
      return !data.error;
    } else if (platform === "linkedin") {
      const testUrl = `https://api.linkedin.com/v2/me?oauth2_access_token=${accessToken}`;
      const response = await fetch(testUrl);
      const data = await response.json();
      return !data.errorCode && !data.serviceErrorCode;
    }
    return false;
  } catch (error) {
    return false;
  }
}

