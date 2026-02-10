/**
 * Serviço de integração com WhatsApp usando Baileys
 * Baileys é uma biblioteca que se conecta diretamente ao WhatsApp Web
 * Não precisa de API externa ou cadastro em plataformas
 */

import makeWASocket, {
  ConnectionState,
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  proto,
  WAMessageContent,
  WAMessageKey,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import crypto from "crypto";

export interface WhatsAppConfig {
  instanceName: string;
  phoneNumber?: string;
}

export interface SendMessageParams {
  to: string; // Número no formato internacional (ex: 5519995555280)
  message: string;
  mediaUrl?: string;
  mediaType?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  data?: any;
}

/**
 * Serviço de integração com WhatsApp usando Baileys
 * Funciona conectando-se diretamente ao WhatsApp Web
 */
export class WhatsAppService {
  private instanceName: string;
  private socket: WASocket | null = null;
  private qrCode: string | null = null;
  private connectionState: "disconnected" | "connecting" | "connected" | "error" = "disconnected";
  private authDir: string;
  private onMessageCallback?: (message: any) => void;
  private onConnectionUpdateCallback?: (status: string, phoneNumber?: string, profileName?: string) => void;
  private store: any = null; // Store do Baileys para acessar contatos

  constructor(config: WhatsAppConfig) {
    this.instanceName = config.instanceName;
    // Diretório para armazenar autenticação (sessão do WhatsApp)
    this.authDir = path.join(process.cwd(), "whatsapp-sessions", this.instanceName);
    
    // Criar diretório se não existir
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  /**
   * Conectar ao WhatsApp e obter QR Code
   */
  async connect(): Promise<WhatsAppResponse> {
    try {
      if (this.socket) {
        await this.disconnect();
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      console.log(`🔌 [WhatsApp ${this.instanceName}] Iniciando conexão REAL com WhatsApp Web`);
      console.log(`   📦 Versão Baileys: ${version.join(".")}`);
      console.log(`   🔐 Diretório de sessão: ${this.authDir}`);

      // Verificar se já existe sessão salva
      const hasSession = state.creds.registered;
      console.log(`   ${hasSession ? "✅" : "❌"} Sessão existente: ${hasSession ? "SIM (reconexão)" : "NÃO (precisa QR Code)"}`);

      this.connectionState = "connecting";

      // Criar socket REAL do WhatsApp Web usando Baileys
      console.log(`   🔗 Criando socket REAL do WhatsApp Web...`);
      
      this.socket = makeWASocket({
        version,
        logger: pino({ level: "silent" }), // Desabilitar logs verbosos
        printQRInTerminal: false,
        auth: state,
        browser: ["BridgeAI Hub", "Chrome", "1.0.0"],
        getMessage: async (key: WAMessageKey) => {
          return {
            conversation: "Mensagem não encontrada",
          };
        },
        // IMPORTANTE: Habilitar sincronização de mensagens
        syncFullHistory: false, // Não sincronizar histórico completo (mais rápido)
        markOnlineOnConnect: true, // Marcar como online ao conectar
      });

      // Tentar acessar o store do socket (pode estar disponível internamente)
      try {
        this.store = (this.socket as any).store;
        if (this.store) {
          console.log(`   ✅ Store do WhatsApp acessível`);
        }
      } catch (error) {
        // Store pode não estar disponível diretamente, mas isso não é crítico
        console.log(`   ℹ️ Store não acessível diretamente (normal em algumas versões do Baileys)`);
      }

      // Salvar credenciais quando atualizadas
      this.socket.ev.on("creds.update", saveCreds);

      // Listener para mensagens recebidas (REAL do WhatsApp)
      // IMPORTANTE: Configurar DEPOIS que o socket está criado
      this.socket.ev.on("messages.upsert", async (m) => {
        const messages = m.messages || [];
        console.log(`📥 [WhatsApp ${this.instanceName}] ⚡ EVENTO 'messages.upsert' DISPARADO!`);
        console.log(`   📊 Total de mensagens no evento: ${messages.length}`);
        console.log(`   🔔 Listener ATIVO - Processando mensagens...`);
        console.log(`   📋 Tipo do evento: ${m.type || "upsert"}`);
        
        if (messages.length === 0) {
          console.log(`   ⚠️ Evento recebido mas sem mensagens no array`);
          console.log(`   📋 Dados completos do evento:`, JSON.stringify(m).substring(0, 300));
          return;
        }
        
        for (const message of messages) {
          // Ignorar mensagens próprias (eco)
          if (message.key?.fromMe) {
            console.log(`   ⏭️ Ignorando mensagem própria (eco) de: ${message.key.remoteJid}`);
            continue;
          }
          
          // Ignorar atualizações de status (verificar exatamente)
          const remoteJid = message.key?.remoteJid || "";
          if (remoteJid === "status@broadcast" || remoteJid.includes("status@broadcast")) {
            console.log(`   ⏭️ Ignorando atualização de status: ${remoteJid}`);
            continue;
          }

          // Verificar se tem conteúdo de mensagem
          const hasMessage = message.message && (
            message.message.conversation ||
            message.message.extendedTextMessage ||
            message.message.imageMessage ||
            message.message.videoMessage ||
            message.message.documentMessage
          );

          if (!hasMessage) {
            console.log(`   ⏭️ Ignorando mensagem sem conteúdo (pode ser notificação): ${remoteJid}`);
            continue;
          }

          console.log(`   📨 Mensagem REAL de: ${remoteJid}`);
          console.log(`   🆔 Message ID: ${message.key?.id || "sem ID"}`);
          console.log(`   ✅ Esta é uma mensagem REAL recebida do WhatsApp Web`);

          // Processar mensagem recebida
          if (this.onMessageCallback) {
            console.log(`   🔄 Chamando callback de processamento...`);
            try {
              await this.onMessageCallback({
                key: message.key,
                message: message.message,
                messageTimestamp: message.messageTimestamp,
              });
              console.log(`   ✅ Mensagem processada com sucesso!`);
            } catch (error) {
              console.error(`   ❌ Erro ao processar mensagem no callback:`, error);
            }
          } else {
            console.warn(`   ⚠️ ATENÇÃO: onMessageCallback não está configurado! Mensagem não será processada.`);
          }
        }
      });

      // Listener alternativo para mensagens (caso messages.upsert não funcione)
      this.socket.ev.on("messages.update", async (updates) => {
        console.log(`📥 [WhatsApp ${this.instanceName}] Evento 'messages.update' disparado!`);
        console.log(`   📊 Total de atualizações: ${Array.isArray(updates) ? updates.length : "não é array"}`);
        // Este evento geralmente é para atualizações de status, não novas mensagens
      });
      
      console.log(`   ✅ Listener de mensagens 'messages.upsert' configurado para ${this.instanceName}`);
      console.log(`   ✅ Listener alternativo 'messages.update' configurado`);

      // Gerar QR Code e gerenciar conexão
      this.socket.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          // Gerar QR Code em base64
          try {
            this.qrCode = await QRCode.toDataURL(qr);
            console.log(`[WhatsApp ${this.instanceName}] QR Code gerado`);
          } catch (err) {
            console.error("Erro ao gerar QR Code:", err);
          }
        }

        if (connection === "close") {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          
          if (shouldReconnect) {
            this.connectionState = "disconnected";
            console.log(`[WhatsApp ${this.instanceName}] Desconectado, tentando reconectar...`);
            // Tentar reconectar após 3 segundos
            setTimeout(() => this.connect(), 3000);
          } else {
            this.connectionState = "disconnected";
            console.log(`[WhatsApp ${this.instanceName}] Deslogado pelo usuário`);
            // Limpar sessão se foi deslogado
            if (fs.existsSync(this.authDir)) {
              fs.rmSync(this.authDir, { recursive: true, force: true });
            }
          }
        } else if (connection === "open") {
          this.connectionState = "connected";
          this.qrCode = null; // Limpar QR Code quando conectado
          const user = this.socket?.user;
          const phoneNumber = user?.id?.split(":")[0];
          const profileName = user?.name;
          console.log(`✅ [WhatsApp ${this.instanceName}] CONEXÃO REAL ESTABELECIDA!`);
          console.log(`   📱 Número conectado: ${phoneNumber}`);
          console.log(`   👤 Nome: ${profileName || "Não disponível"}`);
          console.log(`   ✅ Esta é uma conexão REAL com WhatsApp Web via Baileys`);
          console.log(`   📥 Listener de mensagens ATIVO e pronto para receber mensagens!`);
          console.log(`   🔔 Aguardando mensagens do WhatsApp Web...`);
          
          // Notificar callback de atualização de conexão (para atualizar banco de dados)
          if (this.onConnectionUpdateCallback) {
            try {
              await this.onConnectionUpdateCallback("connected", phoneNumber, profileName);
              console.log(`   ✅ Callback de atualização de conexão executado!`);
            } catch (error) {
              console.error(`   ❌ Erro ao executar callback de atualização:`, error);
            }
          }
          
          // Verificar se o callback está configurado
          if (this.onMessageCallback) {
            console.log(`   ✅ Callback de mensagens está configurado e pronto!`);
          } else {
            console.warn(`   ⚠️ ATENÇÃO: Callback de mensagens NÃO está configurado ainda!`);
            console.warn(`   ⚠️ As mensagens recebidas não serão processadas até o callback ser configurado!`);
          }
        } else if (connection === "connecting") {
          this.connectionState = "connecting";
          console.log(`🔄 [WhatsApp ${this.instanceName}] Conectando ao WhatsApp Web REAL...`);
        }
      });

      // Se já tem sessão, aguardar conexão
      if (hasSession) {
        // Aguardar até conectar ou timeout
        let attempts = 0;
        while (this.connectionState === "connecting" && attempts < 20) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          attempts++;
        }
      } else {
        // Aguardar QR Code ser gerado
        let attempts = 0;
        while (!this.qrCode && attempts < 10) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          attempts++;
        }
      }

      return {
        success: true,
        data: {
          qrCode: this.qrCode,
          status: this.connectionState,
        },
      };
    } catch (error: any) {
      this.connectionState = "error";
      console.error(`[WhatsApp ${this.instanceName}] Erro ao conectar:`, error);
      return {
        success: false,
        error: error.message || "Erro ao conectar",
      };
    }
  }

  /**
   * Obter QR Code atual
   */
  async getQRCode(): Promise<WhatsAppResponse> {
    if (!this.socket) {
      // Tentar conectar se não estiver conectado
      const result = await this.connect();
      if (!result.success) {
        return result;
      }
    }

    // Aguardar QR Code ser gerado
    let attempts = 0;
    while (!this.qrCode && attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    }

    if (this.qrCode) {
      return {
        success: true,
        data: {
          qrCode: this.qrCode,
        },
      };
    }

    return {
      success: false,
      error: "QR Code não disponível. Tente conectar novamente.",
    };
  }

  /**
   * Verificar status da conexão
   */
  async getStatus(): Promise<WhatsAppResponse> {
    if (!this.socket) {
      return {
        success: true,
        data: {
          status: "disconnected",
        },
      };
    }

    const state = this.socket.user;
    
    return {
      success: true,
      data: {
        status: this.connectionState,
        phoneNumber: state?.id?.split(":")[0] || undefined,
        name: state?.name || undefined,
      },
    };
  }

  /**
   * Buscar contatos do WhatsApp do store do Baileys
   * Busca todos os contatos que estão no cache do WhatsApp Web
   */
  async getContacts(): Promise<WhatsAppResponse> {
    try {
      if (!this.socket || this.connectionState !== "connected") {
        return {
          success: false,
          error: "Não conectado ao WhatsApp. Conecte-se primeiro.",
        };
      }

      console.log(`📇 [WhatsApp ${this.instanceName}] Buscando contatos do WhatsApp Web...`);

      const contacts: any[] = [];
      const contactsMap = new Map<string, any>();
      
      try {
        // Tentar acessar o store através do socket
        const store = (this.socket as any).store;
        
        if (store && store.contacts) {
          try {
            // Tentar usar o método all() se disponível
            if (typeof store.contacts.all === "function") {
              const allContacts = await store.contacts.all();
              console.log(`   📋 Encontrados ${allContacts.length} contatos no store`);
              
              for (const [jid, contact] of allContacts) {
                try {
                  if (jid.includes("@g.us") || jid.includes("@broadcast")) continue;
                  
                  const number = jid.replace("@s.whatsapp.net", "");
                  if (number.length > 15) continue;

                  const name = contact.name || contact.notify || number;
                  
                  if (!contactsMap.has(number)) {
                    contactsMap.set(number, {
                      jid,
                      number,
                      name,
                      exists: true,
                    });
                  }
                } catch (error) {
                  // Ignorar erro
                }
              }
            }
          } catch (error) {
            console.log(`   ⚠️ Erro ao buscar contatos do store:`, error);
          }
        }

        // Buscar chats do store (contatos com conversas)
        if (store && store.chats) {
          try {
            if (typeof store.chats.all === "function") {
              const allChats = await store.chats.all();
              console.log(`   💬 Encontrados ${allChats.length} chats no store`);
              
              for (const [jid, chat] of allChats) {
                try {
                  if (jid.includes("@g.us") || jid.includes("@broadcast")) continue;
                  
                  const number = jid.replace("@s.whatsapp.net", "");
                  if (number.length > 15) continue;

                  const name = chat.name || chat.subject;
                  
                  if (!contactsMap.has(number)) {
                    contactsMap.set(number, {
                      jid,
                      number,
                      name: name || number,
                      exists: true,
                    });
                  } else if (name) {
                    // Atualizar nome se encontrou no chat
                    const existing = contactsMap.get(number);
                    if (existing && (!existing.name || existing.name === existing.number)) {
                      existing.name = name;
                    }
                  }
                } catch (error) {
                  // Ignorar erro
                }
              }
            }
          } catch (error) {
            console.log(`   ⚠️ Erro ao buscar chats do store:`, error);
          }
        }
      } catch (error: any) {
        console.log(`   ℹ️ Store não acessível diretamente (normal):`, error.message);
      }

      // Se não encontrou contatos no store, retornar lista vazia
      // Os contatos aparecerão quando houver mensagens trocadas
      if (contactsMap.size === 0) {
        console.log(`   ℹ️ Nenhum contato encontrado no store. Contatos aparecerão quando houver mensagens.`);
      } else {
        // Buscar fotos de perfil e adicionar à lista
        for (const [number, contact] of contactsMap) {
          try {
            let profilePicture: string | undefined;
            try {
              profilePicture = await this.socket.profilePictureUrl(contact.jid);
            } catch {
              // Ignorar erro de foto
            }
            
            contacts.push({
              ...contact,
              profilePicture,
            });
            
            console.log(`   ✅ Contato: ${contact.name} (${number})`);
          } catch (error) {
            contacts.push(contact);
          }
        }
      }

      console.log(`✅ [WhatsApp ${this.instanceName}] Total de contatos encontrados: ${contacts.length}`);

      return {
        success: true,
        data: {
          contacts,
        },
      };
    } catch (error: any) {
      console.error(`❌ [WhatsApp ${this.instanceName}] Erro ao buscar contatos:`, error);
      return {
        success: false,
        error: error.message || "Erro ao buscar contatos",
      };
    }
  }

  /**
   * Buscar informações do perfil conectado
   */
  async getProfileInfo(): Promise<WhatsAppResponse> {
    try {
      if (!this.socket || this.connectionState !== "connected") {
        return {
          success: false,
          error: "Não conectado ao WhatsApp. Conecte-se primeiro.",
        };
      }

      const user = this.socket.user;
      let profilePicture: string | undefined;

      try {
        if (user?.id) {
          profilePicture = await this.socket.profilePictureUrl(user.id);
        }
      } catch {
        // Ignorar erro de foto de perfil
      }

      return {
        success: true,
        data: {
          id: user?.id,
          name: user?.name,
          phoneNumber: user?.id?.split(":")[0],
          profilePicture,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao buscar informações do perfil",
      };
    }
  }

  /**
   * Buscar conversas/chats
   */
  async getChats(): Promise<WhatsAppResponse> {
    try {
      if (!this.socket || this.connectionState !== "connected") {
        return {
          success: false,
          error: "Não conectado ao WhatsApp. Conecte-se primeiro.",
        };
      }

      // Buscar chats usando a API do Baileys
      const chats = await this.socket.fetchBlocklist();
      
      // Tentar buscar conversas recentes
      // Nota: Baileys não tem método direto para buscar chats, então vamos usar uma abordagem alternativa
      return {
        success: true,
        data: {
          chats: [],
          message: "Use a lista de mensagens para ver conversas",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao buscar conversas",
      };
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(params: SendMessageParams): Promise<WhatsAppResponse> {
    try {
      if (!this.socket || this.connectionState !== "connected") {
        return {
          success: false,
          error: "Não conectado ao WhatsApp. Conecte-se primeiro.",
        };
      }

      // Formatar número (remover caracteres especiais e adicionar @s.whatsapp.net)
      const number = this.formatPhoneNumber(params.to);

      console.log(`📤 [WhatsApp ${this.instanceName}] Enviando mensagem REAL para ${number}`);
      console.log(`   📝 Conteúdo: ${params.message.substring(0, 50)}...`);

      // Enviar mensagem REAL através do socket do WhatsApp
      const result = await this.socket.sendMessage(number, {
        text: params.message,
      });

      if (!result) {
        throw new Error("Resposta inválida ao enviar mensagem: resultado vazio");
      }

      if (!result.key) {
        throw new Error("Resposta inválida ao enviar mensagem: chave não encontrada");
      }

      if (!result.key.id) {
        throw new Error("Resposta inválida ao enviar mensagem: ID da mensagem não encontrado");
      }

      const messageId = result.key.id;

      console.log(`✅ [WhatsApp ${this.instanceName}] Mensagem REAL enviada com sucesso!`);
      console.log(`   🆔 Message ID: ${messageId}`);
      console.log(`   📱 Para: ${number}`);
      console.log(`   ✅ Esta é uma mensagem REAL enviada via WhatsApp Web`);

      return {
        success: true,
        messageId: messageId,
        data: result,
      };
    } catch (error: any) {
      console.error(`[WhatsApp ${this.instanceName}] Erro ao enviar mensagem:`, error);
      return {
        success: false,
        error: error.message || "Erro ao enviar mensagem",
      };
    }
  }

  /**
   * Enviar mensagem com mídia
   */
  async sendMediaMessage(params: SendMessageParams): Promise<WhatsAppResponse> {
    if (!params.mediaUrl) {
      return {
        success: false,
        error: "mediaUrl é obrigatório para mensagens com mídia",
      };
    }

    try {
      if (!this.socket || this.connectionState !== "connected") {
        return {
          success: false,
          error: "Não conectado ao WhatsApp. Conecte-se primeiro.",
        };
      }

      const number = this.formatPhoneNumber(params.to);
      const mediaType = params.mediaType || this.detectMediaType(params.mediaUrl);

      // Baixar mídia da URL
      const mediaResponse = await fetch(params.mediaUrl);
      const buffer = Buffer.from(await mediaResponse.arrayBuffer());

      let message: any = {};

      if (mediaType.startsWith("image/")) {
        message = {
          image: buffer,
          caption: params.message || "",
        };
      } else if (mediaType.startsWith("video/")) {
        message = {
          video: buffer,
          caption: params.message || "",
        };
      } else if (mediaType.startsWith("audio/")) {
        message = {
          audio: buffer,
          mimetype: mediaType,
        };
      } else {
        // Documento
        const filename = params.mediaUrl.split("/").pop() || "document";
        message = {
          document: buffer,
          mimetype: mediaType,
          fileName: filename,
          caption: params.message || "",
        };
      }

      const result = await this.socket.sendMessage(number, message);

      if (!result || !result.key) {
        throw new Error("Resposta inválida ao enviar mídia");
      }

      const messageId = result.key.id || crypto.randomUUID();

      return {
        success: true,
        messageId: messageId,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao enviar mídia",
      };
    }
  }

  /**
   * Desconectar
   */
  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.end(undefined);
      this.socket = null;
    }
    this.connectionState = "disconnected";
    this.qrCode = null;
  }

  /**
   * Deletar sessão (deslogar)
   */
  async deleteSession(): Promise<WhatsAppResponse> {
    try {
      await this.disconnect();

      // Deletar diretório de autenticação
      if (fs.existsSync(this.authDir)) {
        fs.rmSync(this.authDir, { recursive: true, force: true });
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao deletar sessão",
      };
    }
  }

  /**
   * Formatar número de telefone para o formato do WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    // Se já é um JID completo (com @lid, @s.whatsapp.net, etc), retornar como está
    // IMPORTANTE: Não converter LID para número - usar JID original diretamente
    // Conforme: https://baileys.wiki/docs/migration/to-v7.0.0/
    if (phone.includes("@")) {
      const jidType = phone.includes("@lid") ? "LID" : phone.includes("@s.whatsapp.net") ? "PN" : "JID";
      console.log(`   🔢 [formatPhoneNumber] JID completo detectado (${jidType}): ${phone} -> Usando diretamente`);
      return phone;
    }
    
    // Remover caracteres especiais
    let number = phone.replace(/[^0-9]/g, "");
    
    // Se o número estiver vazio, retornar erro
    if (!number || number.length === 0) {
      throw new Error("Número de telefone inválido: número vazio");
    }
    
    // Se o número for muito curto (menos de 10 dígitos), pode ser inválido
    if (number.length < 10) {
      throw new Error(`Número de telefone inválido: muito curto (${number.length} dígitos)`);
    }
    
    // Se não começar com código do país e tiver 11 dígitos, assumir Brasil (55)
    if (!number.startsWith("55") && number.length === 11) {
      number = "55" + number;
    }
    
    // Log para debug
    console.log(`   🔢 [formatPhoneNumber] Original: ${phone} -> Limpo: ${number} -> Final: ${number}@s.whatsapp.net`);
    
    // Adicionar sufixo do WhatsApp
    return `${number}@s.whatsapp.net`;
  }

  /**
   * Detectar tipo de mídia pela URL
   */
  private detectMediaType(url: string): string {
    const extension = url.split(".").pop()?.toLowerCase();
    
    const mediaTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      mp4: "video/mp4",
      avi: "video/avi",
      mov: "video/quicktime",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    return mediaTypes[extension || ""] || "application/octet-stream";
  }

  /**
   * Obter instância do socket (para uso avançado)
   */
  getSocket(): WASocket | null {
    return this.socket;
  }

  /**
   * Definir callback para mensagens recebidas
   */
  setOnMessageCallback(callback: (message: any) => void): void {
    this.onMessageCallback = callback;
    console.log(`✅ [WhatsApp ${this.instanceName}] Callback de mensagens configurado!`);
    console.log(`   📥 Listener pronto para receber mensagens do WhatsApp Web`);
  }

  /**
   * Definir callback para atualizações de conexão (status, phoneNumber, profileName)
   */
  setOnConnectionUpdateCallback(callback: (status: string, phoneNumber?: string, profileName?: string) => void | Promise<void>): void {
    this.onConnectionUpdateCallback = callback;
    console.log(`✅ [WhatsApp ${this.instanceName}] Callback de atualização de conexão configurado!`);
  }
}
