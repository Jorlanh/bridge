import { requestNotificationPermission, onMessageListener } from "./firebase";
import { toast } from "sonner";
import { notificationApi } from "./api";

// Interface para payload de notificação
interface NotificationPayload {
  notification?: {
    title: string;
    body: string;
    icon?: string;
  };
  data?: {
    type?: string;
    link?: string;
    notificationId?: string;
  };
}

// Inicializar serviço de notificações Firebase
export class FirebaseNotificationService {
  private static instance: FirebaseNotificationService;
  private fcmToken: string | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): FirebaseNotificationService {
    if (!FirebaseNotificationService.instance) {
      FirebaseNotificationService.instance = new FirebaseNotificationService();
    }
    return FirebaseNotificationService.instance;
  }

  // Inicializar o serviço de notificações
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Solicitar permissão e obter token
      const token = await requestNotificationPermission();
      
      if (token) {
        this.fcmToken = token;
        
        // Enviar token para o backend
        await this.sendTokenToBackend(token);
        
        // Configurar listener para mensagens em foreground
        this.setupForegroundListener();
      } else {
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("❌ Erro ao inicializar Firebase Notifications:", error);
    }
  }

  // Enviar token FCM para o backend
  private async sendTokenToBackend(fcmToken: string): Promise<void> {
    try {
      const authModule = await import("./auth");
      const authToken = authModule.auth.getToken();
      
      if (!authToken) {
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/fcm-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ fcmToken: fcmToken }),
      });

      if (response.ok) {
      } else {
      }
    } catch (error) {
      console.error("❌ Erro ao enviar token para o backend:", error);
    }
  }

  // Configurar listener para mensagens em foreground
  private setupForegroundListener(): void {
    onMessageListener()
      .then((payload: NotificationPayload | null) => {
        if (payload) {
          this.handleForegroundMessage(payload);
        }
      })
      .catch((error) => {
        console.error("❌ Erro no listener de mensagens:", error);
      });
  }

  // Tratar mensagens recebidas em foreground
  private handleForegroundMessage(payload: NotificationPayload): void {
    const title = payload.notification?.title || "Nova notificação";
    const body = payload.notification?.body || "";
    const type = payload.data?.type || "info";
    const link = payload.data?.link;

    // Mostrar toast de notificação
    toast.info(title, {
      description: body,
      duration: 5000,
      action: link
        ? {
            label: "Abrir",
            onClick: () => {
              if (link) {
                window.location.href = link;
              }
            },
          }
        : undefined,
    });

    // Atualizar contador de notificações não lidas
    notificationApi.getUnreadCount().catch(console.error);
  }

  // Obter token FCM atual
  getToken(): string | null {
    return this.fcmToken;
  }

  // Verificar se o serviço está inicializado
  isReady(): boolean {
    return this.isInitialized && this.fcmToken !== null;
  }
}

// Exportar instância singleton
export const firebaseNotificationService = FirebaseNotificationService.getInstance();
