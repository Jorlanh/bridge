import Queue, { Queue as QueueType } from "bull";
import Redis from "ioredis";

// Configuração do Redis
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => {
    // Retry até 3 vezes, depois para
    if (times > 3) {
      return null; // Para de tentar
    }
    return Math.min(times * 200, 2000); // Delay exponencial
  },
  enableOfflineQueue: false, // Não enfileirar comandos quando offline
};

// Cliente Redis com tratamento de erros
let redisClient: Redis | null = null;
let redisAvailable = false;

try {
  redisClient = new Redis(redisConfig);
  
  redisClient.on("connect", () => {
    redisAvailable = true;
  });
  
  redisClient.on("error", () => {
    redisAvailable = false;
  });
  
  redisClient.on("close", () => {
    redisAvailable = false;
  });
} catch (error) {
  redisAvailable = false;
}

// Filas (serão inicializadas apenas se Redis estiver disponível)
export let emailQueue: QueueType<any> | null = null;
export let notificationQueue: QueueType<any> | null = null;
export let postPublishQueue: QueueType<any> | null = null;
export let reportQueue: QueueType<any> | null = null;

// Função para criar filas apenas se Redis estiver disponível
function createQueues() {
  if (!redisAvailable) {
    return false;
  }

  try {
    emailQueue = new Queue("email", {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });

    notificationQueue = new Queue("notification", {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });

    postPublishQueue = new Queue("post-publish", {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });

    reportQueue = new Queue("report", {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: "fixed",
          delay: 5000,
        },
        removeOnComplete: 50,
        removeOnFail: 200,
      },
    });

    return true;
  } catch (error) {
    return false;
  }
}

// Processadores de fila
export function initializeQueues() {
  // Verificar se Redis está disponível
  if (!redisAvailable || !createQueues()) {
    return false;
  }

  if (!emailQueue || !notificationQueue || !postPublishQueue || !reportQueue) {
    return false;
  }

  // Processar emails
  emailQueue.process("send-email", async (job: any) => {
    const { to, subject, html, text } = job.data;
    // TODO: Implementar envio de email
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true };
  });

  // Processar notificações
  notificationQueue.process("send-notification", async (job: any) => {
    const { userId, title, message, type, link, sendPush, sendEmail, sendWhatsApp } = job.data;
    
    try {
      // Importar função de criação de notificação
      const { createNotification } = await import("./notifications.js");
      
      // Criar notificação no banco e enviar via canais configurados
      const notification = await createNotification({
        userId,
        title,
        message,
        type: type || "info",
        link,
        sendPush: sendPush !== false, // Default true
        sendEmail: sendEmail === true, // Default false
        sendWhatsApp: sendWhatsApp === true, // Default false
      });

      return { 
        success: true, 
        notificationId: notification?._id?.toString(),
        createdAt: notification?.createdAt 
      };
    } catch (error: any) {
      console.error("Erro ao processar notificação:", error);
      throw error; // Re-throw para que o Bull possa fazer retry
    }
  });

  // Processar publicação de posts
  postPublishQueue.process("publish-post", async (job: any) => {
    const { postId, platform, content, imageUrl } = job.data;
    // TODO: Implementar publicação real
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return { success: true, publishedAt: new Date() };
  });

  // Processar relatórios
  reportQueue.process("generate-report", async (job: any) => {
    const { reportId, format, data } = job.data;
    // TODO: Implementar geração de relatório
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return { success: true, filePath: `/reports/${reportId}.${format}` };
  });

  return true;
}

// Função helper para adicionar job à fila (com fallback se Redis não estiver disponível)
export async function addToQueue(
  queue: QueueType<any> | null,
  jobName: string,
  data: any
): Promise<{ success: boolean; message: string }> {
  if (!queue || !redisAvailable) {
    return {
      success: false,
      message: "Sistema de filas não disponível (Redis não configurado)",
    };
  }

  try {
    await queue.add(jobName, data);
    return { success: true, message: "Job adicionado à fila" };
  } catch (error: any) {
    return {
      success: false,
      message: `Erro ao adicionar job: ${error.message}`,
    };
  }
}

// Verificar se Redis está disponível
export function isRedisAvailable(): boolean {
  return redisAvailable;
}

/**
 * Função helper para enviar notificação via fila
 * Esta função facilita o envio de notificações de qualquer lugar do código
 */
export async function sendNotification({
  userId,
  title,
  message,
  type = "info",
  link,
  sendPush = true,
  sendEmail = false,
  sendWhatsApp = false,
}: {
  userId: string | any;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error" | "course" | "certificate";
  link?: string;
  sendPush?: boolean;
  sendEmail?: boolean;
  sendWhatsApp?: boolean;
}): Promise<{ success: boolean; message: string }> {
  // Se a fila não estiver disponível, criar notificação diretamente
  if (!notificationQueue || !redisAvailable) {
    try {
      const { createNotification } = await import("./notifications.js");
      await createNotification({
        userId,
        title,
        message,
        type: type || "info",
        link,
        sendPush,
        sendEmail,
        sendWhatsApp,
      });
      return { success: true, message: "Notificação criada diretamente (fila não disponível)" };
    } catch (error: any) {
      return { success: false, message: `Erro ao criar notificação: ${error.message}` };
    }
  }

  // Adicionar à fila
  return await addToQueue(notificationQueue, "send-notification", {
    userId: typeof userId === "string" ? userId : userId.toString(),
    title,
    message,
    type: type || "info",
    link,
    sendPush,
    sendEmail,
    sendWhatsApp,
  });
}
