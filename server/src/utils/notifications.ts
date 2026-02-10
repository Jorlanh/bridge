import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import { sendPushNotification } from "./firebaseAdmin.js";
import { emitNotification, emitUnreadCount } from "./socket.js";

interface CreateNotificationParams {
  userId: mongoose.Types.ObjectId | string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "course" | "certificate";
  link?: string;
  sendPush?: boolean; // Se deve enviar notificação push
  sendEmail?: boolean; // Se deve enviar notificação por email
  sendWhatsApp?: boolean; // Se deve enviar notificação por WhatsApp (opcional)
}

// Função auxiliar para verificar se está em horário silencioso
function isQuietHours(quietHours?: { enabled: boolean; start: string; end: string }): boolean {
  if (!quietHours || !quietHours.enabled) {
    return false;
  }

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  
  const start = quietHours.start;
  const end = quietHours.end;

  // Se o horário silencioso cruza a meia-noite
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }
  
  return currentTime >= start && currentTime <= end;
}

// Função auxiliar para verificar se o tipo de notificação está habilitado
function isNotificationTypeEnabled(
  type: string,
  preferences?: {
    enabled: boolean;
    types: {
      marketing: boolean;
      sales: boolean;
      support: boolean;
      social: boolean;
      processes: boolean;
      academy: boolean;
      system: boolean;
    };
  }
): boolean {
  if (!preferences || !preferences.enabled) {
    return true; // Por padrão, todas as notificações são habilitadas
  }

  // Mapear tipos de notificação para preferências
  const typeMap: Record<string, keyof typeof preferences.types> = {
    marketing: "marketing",
    sales: "sales",
    support: "support",
    social: "social",
    processes: "processes",
    academy: "academy",
    course: "academy",
    certificate: "academy",
    error: "system",
    warning: "system",
    success: "system",
    info: "system",
  };

  const preferenceKey = typeMap[type] || "system";
  return preferences.types[preferenceKey] !== false; // Default true se não especificado
}

export async function createNotification({
  userId,
  title,
  message,
  type,
  link,
  sendPush = true, // Por padrão, envia push se o usuário tiver token
  sendEmail = false, // Por padrão, não envia email (pode ser caro)
  sendWhatsApp = false, // Por padrão, não envia WhatsApp (opcional)
}: CreateNotificationParams) {
  try {
    const userIdObj = typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
    
    // Buscar usuário para verificar preferências
    const user = await User.findById(userIdObj);
    
    // Verificar se notificações estão habilitadas
    if (user?.notificationPreferences?.enabled === false) {
      // Criar notificação no banco mesmo se desabilitada (para histórico)
      // Mas não enviar push ou WebSocket
      const notification = await Notification.create({
        userId: userIdObj,
        title,
        message,
        type,
        link,
        read: false,
      });
      return notification;
    }

    // Verificar se o tipo de notificação está habilitado
    if (!isNotificationTypeEnabled(type, user?.notificationPreferences)) {
      // Criar notificação no banco mas não enviar
      const notification = await Notification.create({
        userId: userIdObj,
        title,
        message,
        type,
        link,
        read: false,
      });
      return notification;
    }

    // Verificar horário silencioso
    const inQuietHours = isQuietHours(user?.notificationPreferences?.quietHours);
    
    // Criar notificação no banco
    const notification = await Notification.create({
      userId: userIdObj,
      title,
      message,
      type,
      link,
      read: false,
    });

    // Preparar dados da notificação para WebSocket
    const notificationData = {
      id: notification._id.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      link: notification.link,
      createdAt: notification.createdAt,
    };

    // Emitir notificação em tempo real via WebSocket (sempre, mesmo em horário silencioso)
    const userIdString = typeof userId === "string" ? userId : userId.toString();
    emitNotification(userIdString, notificationData);

    // Atualizar contador de não lidas em tempo real
    const unreadCount = await Notification.countDocuments({
      userId: userIdObj,
      read: false,
    });
    emitUnreadCount(userIdString, unreadCount);

    // Enviar notificação push se solicitado, se o usuário tiver token FCM, e não estiver em horário silencioso
    if (sendPush && !inQuietHours) {
      try {
        const pushEnabled = user?.notificationPreferences?.channels?.push !== false; // Default true
        if (pushEnabled && user?.fcmToken) {
          await sendPushNotification(
            user.fcmToken,
            title,
            message,
            {
              type,
              link,
              notificationId: notification._id.toString(),
            }
          );
        }
      } catch (pushError) {
        // Não falhar se o push não funcionar
        console.error("Erro ao enviar notificação push:", pushError);
      }
    }

    // Enviar notificação por email se solicitado e habilitado nas preferências
    if (sendEmail && user?.email && user?.notificationPreferences?.channels?.email) {
      try {
        const { sendEmail: sendEmailService } = await import("./emailService.js");
        const { generateNotificationEmailHTML } = await import("./emailService.js");
        
        await sendEmailService({
          to: user.email,
          subject: `🔔 ${title} - BridgeAI Hub`,
          html: generateNotificationEmailHTML(title, message, type, link),
          text: `${title}\n\n${message}${link ? `\n\n${link}` : ""}`,
        });
      } catch (emailError) {
        // Não falhar se o email não funcionar
        console.error("Erro ao enviar notificação por email:", emailError);
      }
    }

    // Enviar notificação por WhatsApp se solicitado (opcional)
    if (sendWhatsApp && user?.phone) {
      try {
        const { WhatsAppConnection } = await import("../models/WhatsAppConnection.js");
        const { WhatsAppService } = await import("../services/whatsappService.js");
        
        // Buscar conexão ativa do usuário
        const connection = await WhatsAppConnection.findOne({
          userId: userIdObj,
          isActive: true,
          status: "connected",
        });

        if (connection) {
          // Criar serviço temporário para enviar
          const service = new WhatsAppService({
            instanceName: connection.instanceName,
            phoneNumber: connection.phoneNumber,
          });
          
          // Formatar mensagem para WhatsApp
          const whatsappMessage = `🔔 *${title}*\n\n${message}${link ? `\n\n🔗 ${link}` : ""}`;
          
          // Enviar para o próprio número do usuário
          const cleanPhone = user.phone.replace(/\D/g, ""); // Apenas números
          await service.sendTextMessage({
            to: cleanPhone,
            message: whatsappMessage,
          });
        }
      } catch (whatsappError) {
        // Não falhar se o WhatsApp não funcionar
        console.error("Erro ao enviar notificação por WhatsApp:", whatsappError);
      }
    }

    return notification;
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    // Não lançar erro para não quebrar o fluxo principal
  }
}


