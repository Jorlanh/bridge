import admin from "firebase-admin";
import dotenv from "dotenv";

// Garantir que o dotenv seja carregado antes de acessar variáveis de ambiente
dotenv.config();

// Inicializar Firebase Admin apenas uma vez
if (!admin.apps.length) {
  try {
    // Usar variáveis de ambiente para inicializar
    // Você precisará criar uma conta de serviço no Firebase Console
    // e adicionar as credenciais no .env do servidor
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccount) {
      try {
        // Se tiver JSON da conta de serviço como string
        const serviceAccountJson = JSON.parse(serviceAccount);
        
        // Verificar se o JSON foi parseado corretamente
        if (!serviceAccountJson.project_id) {
          throw new Error("project_id não encontrado no JSON da conta de serviço");
        }
        
        // Inicializar Firebase Admin com projectId explícito
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountJson),
          projectId: serviceAccountJson.project_id,
        });
        
        console.log("✅ Firebase Admin inicializado com credenciais de serviço");
        console.log(`📋 Firebase Project ID: ${serviceAccountJson.project_id}`);
        
      } catch (parseError: any) {
        throw parseError;
      }
    } else {
      // Alternativa: usar Application Default Credentials (ADC)
      // Útil para produção em serviços como Google Cloud
      try {
        admin.initializeApp();
        console.log("✅ Firebase Admin inicializado com Application Default Credentials (ADC)");
      } catch (error) {
        console.warn("⚠️ Firebase Admin não inicializado. Notificações push não funcionarão.");
      }
    }
  } catch (error: any) {
    // Erro ao inicializar Firebase Admin
  }
}

// Função para enviar notificação push
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: {
    type?: string;
    link?: string;
    notificationId?: string;
  }
): Promise<boolean> {
  try {
    if (!admin.apps.length) {
      return false;
    }

    const message: any = {
      notification: {
        title: title,
        body: body,
      },
      token: fcmToken,
    };

    if (data) {
      message.data = {
        type: data.type || "info",
        link: data.link || "",
        notificationId: data.notificationId || "",
      };
    }

    await admin.messaging().send(message);
    return true;
  } catch (error: any) {
    // Se o token for inválido, remover do banco
    if (error.code === "messaging/invalid-registration-token" || 
        error.code === "messaging/registration-token-not-registered") {
      // Buscar usuário pelo token e remover
      try {
        const { User } = await import("../models/User.js");
        await User.updateOne(
          { fcmToken },
          { $unset: { fcmToken: "" } }
        );
        console.log("Token FCM inválido removido do banco");
      } catch (updateError) {
        console.error("Erro ao remover token inválido:", updateError);
      }
    }
    
    return false;
  }
}

export default admin;

