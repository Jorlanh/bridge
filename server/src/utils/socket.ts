import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

// Armazenar conexões por userId
const userSockets = new Map<string, string[]>();

export let io: SocketIOServer | null = null;

export function initializeSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV === "production" 
        ? (process.env.FRONTEND_URL || "http://localhost:8080")
        : true, // Permitir todas as origens em desenvolvimento
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware de autenticação
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return next(new Error("Token não fornecido"));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error("JWT_SECRET não configurado"));
      }

      const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };
      socket.data.userId = decoded.userId;
      socket.data.email = decoded.email;
      
      next();
    } catch (error) {
      console.error("Erro na autenticação Socket.io:", error);
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    
    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`✅ WebSocket conectado: usuário=${userId} socket=${socket.id}`);

    // Adicionar socket à lista de conexões do usuário
    if (!userSockets.has(userId)) {
      userSockets.set(userId, []);
    }
    userSockets.get(userId)!.push(socket.id);

    // Notificar que está online
    socket.emit("connected", { message: "Conectado ao servidor de notificações" });

    // Quando desconectar
    socket.on("disconnect", () => {
      // Remover socket da lista
      const sockets = userSockets.get(userId);
      if (sockets) {
        const index = sockets.indexOf(socket.id);
        if (index > -1) {
          sockets.splice(index, 1);
        }
        if (sockets.length === 0) {
          userSockets.delete(userId);
        }
      }

      console.log(`❌ WebSocket desconectado: usuário=${userId} socket=${socket.id}`);
    });
  });
}

// Função para emitir notificação em tempo real
export function emitNotification(userId: string, notification: any) {
  if (!io) {
    return;
  }

  const sockets = userSockets.get(userId);
  if (sockets && sockets.length > 0) {
    sockets.forEach((socketId) => {
      io!.to(socketId).emit("new-notification", notification);
    });
  }
}

// Função para emitir atualização de contador
export function emitUnreadCount(userId: string, count: number) {
  if (!io) {
    return;
  }

  const sockets = userSockets.get(userId);
  if (sockets && sockets.length > 0) {
    sockets.forEach((socketId) => {
      io!.to(socketId).emit("unread-count", { count });
    });
  }
}

// Função para emitir eventos de WhatsApp em tempo real
export function emitWhatsAppMessage(userId: string, event: {
  type: "message_received" | "ai_processing" | "ai_generated" | "message_sent";
  message: any;
  connectionId: string;
}) {
  if (!io) {
    return;
  }

  const sockets = userSockets.get(userId);
  if (sockets && sockets.length > 0) {
    sockets.forEach((socketId) => {
      io!.to(socketId).emit("whatsapp-activity", event);
    });
  }
}




