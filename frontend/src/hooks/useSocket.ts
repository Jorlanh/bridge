import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { auth } from "@/lib/auth";
import { notificationApi, Notification } from "@/lib/api";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Só conectar se o usuário estiver autenticado
    if (!auth.isAuthenticated()) {
      return;
    }

    const token = auth.getToken();
    if (!token) {
      return;
    }

    // Conectar ao servidor Socket.io
    const socket = io(API_URL, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Eventos de conexão
    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Erro ao conectar WebSocket:", error);
      setIsConnected(false);
    });

    socket.on("connected", (data) => {
    });

    // Escutar novas notificações em tempo real
    socket.on("new-notification", (notification: Notification) => {
      
      // Atualizar contador
      setUnreadCount((prev) => prev + 1);

      // Mostrar toast de notificação
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
        action: notification.link
          ? {
              label: "Abrir",
              onClick: () => {
                window.location.href = notification.link!;
              },
            }
          : undefined,
      });

      // Disparar evento customizado para atualizar componentes
      window.dispatchEvent(
        new CustomEvent("new-notification", { detail: notification })
      );
    });

    // Escutar atualizações de contador
    socket.on("unread-count", (data: { count: number }) => {
      setUnreadCount(data.count);
      
      // Disparar evento customizado
      window.dispatchEvent(
        new CustomEvent("unread-count-update", { detail: { count: data.count } })
      );
    });

    // Carregar contador inicial
    notificationApi.getUnreadCount().then((result) => {
      if (result.success) {
        setUnreadCount(result.unreadCount);
      }
    });

    // Cleanup ao desmontar
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Reconectar quando o token mudar (login/logout)
  useEffect(() => {
    const handleAuthChange = () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };

    // Escutar mudanças de autenticação
    window.addEventListener("storage", handleAuthChange);
    
    return () => {
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  return {
    isConnected,
    unreadCount,
    socket: socketRef.current,
  };
}





