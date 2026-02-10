import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { emitUnreadCount } from "../utils/socket.js";

// Buscar todas as notificações do usuário
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const { limit = 50, unreadOnly = false } = req.query;

    const query: any = { userId: req.userId };
    if (unreadOnly === "true") {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      read: false,
    });

    res.json({
      success: true,
      notifications: notifications.map((notif) => ({
        id: notif._id.toString(),
        title: notif.title,
        message: notif.message,
        type: notif.type,
        read: notif.read,
        link: notif.link,
        createdAt: notif.createdAt,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar notificações",
    });
  }
};

// Marcar notificação como lida
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "ID da notificação é obrigatório",
      });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      userId: req.userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notificação não encontrada",
      });
    }

    notification.read = true;
    await notification.save();

    // Atualizar contador em tempo real
    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      read: false,
    });
    emitUnreadCount(req.userId, unreadCount);

    res.json({
      success: true,
      message: "Notificação marcada como lida",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao marcar notificação como lida",
    });
  }
};

// Marcar todas como lidas
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    await Notification.updateMany(
      { userId: req.userId, read: false },
      { read: true }
    );

    // Atualizar contador em tempo real
    emitUnreadCount(req.userId, 0);

    res.json({
      success: true,
      message: "Todas as notificações foram marcadas como lidas",
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao marcar notificações como lidas",
    });
  }
};

// Deletar notificação
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "ID da notificação é obrigatório",
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: req.userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notificação não encontrada",
      });
    }

    // Atualizar contador em tempo real
    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      read: false,
    });
    emitUnreadCount(req.userId, unreadCount);

    res.json({
      success: true,
      message: "Notificação deletada com sucesso",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao deletar notificação",
    });
  }
};

// Buscar contador de não lidas
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      read: false,
    });

    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar contador de notificações",
    });
  }
};

// Salvar token FCM do usuário
export const saveFCMToken = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "Token FCM é obrigatório",
      });
    }

    await User.findByIdAndUpdate(req.userId, {
      fcmToken: fcmToken,
    });

    res.json({
      success: true,
      message: "Token FCM salvo com sucesso",
    });
  } catch (error) {
    console.error("Save FCM token error:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao salvar token FCM",
    });
  }
};


