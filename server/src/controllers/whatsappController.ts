import { Response, Request } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { WhatsAppConnection } from "../models/WhatsAppConnection.js";
import { WhatsAppMessage } from "../models/WhatsAppMessage.js";
import { WhatsAppService, WhatsAppConfig } from "../services/whatsappService.js";
import { createNotification } from "../utils/notifications.js";
import { emitWhatsAppMessage } from "../utils/socket.js";
import crypto from "crypto";

// Armazenar instâncias ativas do serviço
const activeServices = new Map<string, WhatsAppService>();

/**
 * Configurar listener de mensagens recebidas
 */
async function setupMessageListener(
  connectionId: string,
  service: WhatsAppService,
  connection: any
) {
  console.log(`🔧 [WhatsApp ${connection.instanceName}] Configurando listener de mensagens...`);
  service.setOnMessageCallback(async (messageData: any) => {
    console.log(`📬 [WhatsApp ${connection.instanceName}] Callback de mensagem chamado!`);
    try {
      // Extrair JID (pode ser PN: 5519995555280@s.whatsapp.net ou LID: 86608049127447@lid)
      // IMPORTANTE: LID não é número de telefone - é um identificador único do WhatsApp
      // Conforme: https://baileys.wiki/docs/migration/to-v7.0.0/
      const remoteJid = messageData.key.remoteJid || "";
      
      // Guardar JID original para usar ao enviar resposta
      // NUNCA converter LID para número - usar o JID original diretamente
      const originalJid = remoteJid;
      
      // Verificar se é grupo
      const isGroup = remoteJid.includes("@g.us");
      const isBroadcast = remoteJid.includes("@broadcast");
      
      // Remover todos os sufixos possíveis
      let from = remoteJid
        .replace("@s.whatsapp.net", "")
        .replace("@g.us", "")
        .replace("@lid", "")
        .replace("@c.us", "")
        .replace("@broadcast", "");
      
      // Limpar número (remover caracteres não numéricos)
      let cleanFrom = from.replace(/[^0-9]/g, "");
      
      // Se o JID original tinha @lid, tentar buscar o PN (Phone Number) se disponível
      // NOTA: LID não é conversível para PN diretamente - só podemos obter se o WhatsApp
      // fornecer o mapeamento via store ou eventos. Se não houver, usamos o LID mesmo.
      const hadLid = remoteJid.includes("@lid");
      let realPhoneNumber: string | null = null;
      
      if (hadLid && !isGroup) {
        // Tentar buscar o PN do contato usando o store do Baileys (se disponível)
        // Isso é opcional - se não encontrar, usamos o LID mesmo
        try {
          const socket = service.getSocket();
          if (socket) {
            // Tentar acessar o mapeamento LID->PN do Baileys (se disponível)
            const signalRepo = (socket as any).signalRepository;
            if (signalRepo?.lidMapping) {
              try {
                const pn = await signalRepo.lidMapping.getPNForLID(remoteJid);
                if (pn) {
                  realPhoneNumber = pn;
                  cleanFrom = pn.replace("@s.whatsapp.net", "").replace(/[^0-9]/g, "");
                  console.log(`   🔍 PN encontrado via lidMapping: ${pn}`);
                }
              } catch (error) {
                // Mapeamento não disponível - normal, usar LID
              }
            }
            
            // Fallback: tentar buscar do store de contatos
            if (!realPhoneNumber) {
              const contactJid = remoteJid;
              const store = (socket as any).store;
              if (store && store.contacts) {
                const contact = await store.contacts.get(contactJid);
                // No Baileys 7.x, Contact tem campo 'phoneNumber' se id for LID
                if (contact?.phoneNumber) {
                  realPhoneNumber = contact.phoneNumber;
                  cleanFrom = contact.phoneNumber.replace(/[^0-9]/g, "");
                  console.log(`   🔍 PN encontrado via store.contacts: ${contact.phoneNumber}`);
                }
              }
            }
          }
        } catch (error) {
          // Não é erro - simplesmente não temos o PN, usaremos o LID
          console.log(`   ℹ️ PN não disponível para LID ${remoteJid} - usando LID diretamente (normal)`);
        }
      }
      
      // Formatar número de telefone para exibição
      // Se o número começar com 55 (Brasil) e tiver 12-13 dígitos, formatar
      if (cleanFrom.startsWith("55") && cleanFrom.length >= 12 && cleanFrom.length <= 13 && !isGroup) {
        // Formato: 55 + DDD (2 dígitos) + número (9 dígitos)
        // Exemplo: 5519987360962 -> +55 19 987360962
        const countryCode = cleanFrom.substring(0, 2); // 55
        const ddd = cleanFrom.substring(2, 4); // 19
        const number = cleanFrom.substring(4); // 987360962
        
        // Formatar para exibição: +55 19 987360962
        from = `+${countryCode} ${ddd} ${number}`;
      } else if (cleanFrom.length === 11 && cleanFrom.startsWith("19") && !isGroup) {
        // Número brasileiro sem código do país: 19987360962 -> +55 19 987360962
        const ddd = cleanFrom.substring(0, 2);
        const number = cleanFrom.substring(2);
        from = `+55 ${ddd} ${number}`;
        cleanFrom = `55${cleanFrom}`; // Adicionar código do país para busca
      } else if (cleanFrom.length > 15 && !isGroup && !realPhoneNumber) {
        // Se for muito longo e não encontramos número real, pode ser ID especial
        // Tentar usar apenas os últimos 11 dígitos se parecer com número brasileiro
        if (cleanFrom.length >= 11) {
          const last11 = cleanFrom.substring(cleanFrom.length - 11);
          if (last11.startsWith("19") && last11.length === 11) {
            const ddd = last11.substring(0, 2);
            const number = last11.substring(2);
            from = `+55 ${ddd} ${number}`;
            cleanFrom = `55${last11}`;
            console.log(`   🔍 Número extraído dos últimos dígitos: +55 ${ddd} ${number}`);
          } else {
            from = cleanFrom;
          }
        } else {
          from = cleanFrom;
        }
      } else {
        // Manter número limpo
        from = cleanFrom;
      }
      
      const messageId = messageData.key.id || crypto.randomUUID();
      
      // Extrair conteúdo da mensagem
      let content = "";
      const msg = messageData.message;
      
      if (msg?.conversation) {
        content = msg.conversation;
      } else if (msg?.extendedTextMessage?.text) {
        content = msg.extendedTextMessage.text;
      } else if (msg?.imageMessage?.caption) {
        content = msg.imageMessage.caption;
      } else if (msg?.videoMessage?.caption) {
        content = msg.videoMessage.caption;
      } else if (msg?.documentMessage?.caption) {
        content = msg.documentMessage.caption;
      } else {
        content = "[Mídia]";
      }

      // Verificar se mensagem já existe
      const existingMessage = await WhatsAppMessage.findOne({
        messageId,
        connectionId: connection._id,
      });

      if (existingMessage) {
        console.log(`   ⏭️ Mensagem já processada anteriormente: ${messageId}`);
        return; // Mensagem já processada
      }

      // Buscar nome do contato do store do WhatsApp
      let contactName: string | undefined;
      // Usar cleanFrom para busca (número limpo sem formatação)
      const cleanNumber = cleanFrom;
      
      if (cleanNumber.length <= 15 && !isGroup) {
        try {
          const socket = service.getSocket();
          if (socket && from) {
            const jid = `${from}@s.whatsapp.net`;
            
            // Tentar obter nome do contato do store do Baileys
            try {
              const store = (socket as any).store;
              if (store && store.contacts) {
                const contact = await store.contacts.get(jid);
                if (contact) {
                  // Usar nome do contato salvo no WhatsApp
                  contactName = contact.name || contact.notify;
                  console.log(`   👤 Nome encontrado no store: ${contactName} para ${from}`);
                }
              }
            } catch (error) {
              // Se não encontrar no store, tentar buscar de outras formas
            }

            // Se não encontrou no store, tentar buscar do chat
            if (!contactName) {
              try {
                const store = (socket as any).store;
                if (store && store.chats) {
                  const chat = await store.chats.get(jid);
                  if (chat) {
                    contactName = chat.name || chat.subject;
                    console.log(`   💬 Nome encontrado no chat: ${contactName} para ${from}`);
                  }
                }
              } catch (error) {
                // Ignorar erro
              }
            }

            // Se ainda não encontrou, verificar se existe no WhatsApp
            if (!contactName) {
              try {
                const contact = await socket.onWhatsApp(jid);
                if (contact && contact[0]?.exists) {
                  // Formatar número para exibição
                  if (cleanNumber.length === 13 && cleanNumber.startsWith("55")) {
                    const ddd = cleanNumber.substring(2, 4);
                    const number = cleanNumber.substring(4);
                    if (number.length === 9) {
                      contactName = `(${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
                    } else if (number.length === 8) {
                      contactName = `(${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
                    } else {
                      contactName = cleanNumber;
                    }
                  } else {
                    contactName = cleanNumber;
                  }
                }
              } catch (error) {
                // Ignorar erro
              }
            }

            // Se ainda não encontrou, usar número formatado
            if (!contactName) {
              if (cleanNumber.length === 13 && cleanNumber.startsWith("55")) {
                const ddd = cleanNumber.substring(2, 4);
                const number = cleanNumber.substring(4);
                if (number.length === 9) {
                  contactName = `(${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
                } else if (number.length === 8) {
                  contactName = `(${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
                } else {
                  contactName = cleanNumber;
                }
              } else {
                contactName = cleanNumber;
              }
            }
          }
        } catch (error) {
          console.error("Erro ao buscar nome do contato:", error);
          contactName = cleanNumber;
        }
      } else {
        // Para números muito longos ou grupos, usar o número limpo
        contactName = cleanNumber.length > 0 ? cleanNumber : from;
      }

      // Salvar mensagem recebida
      const whatsappMessage = new WhatsAppMessage({
        userId: connection.userId,
        connectionId: connection._id,
        messageId,
        from,
        to: connection.phoneNumber,
        type: msg?.imageMessage ? "image" : msg?.videoMessage ? "video" : msg?.documentMessage ? "document" : "text",
        content,
        direction: "inbound",
        status: "delivered",
        timestamp: new Date((messageData.messageTimestamp || Date.now()) * 1000),
        contactName,
        isGroup,
        groupId: isGroup ? from : undefined,
      });

      await whatsappMessage.save();

      // Atualizar estatísticas
      connection.messagesReceived = (connection.messagesReceived || 0) + 1;
      connection.lastMessageAt = new Date();
      await connection.save();

      // Emitir evento em tempo real (usar conteúdo original, não criptografado)
      emitWhatsAppMessage(connection.userId.toString(), {
        type: "message_received",
        message: {
          id: whatsappMessage._id.toString(),
          messageId: whatsappMessage.messageId,
          from: whatsappMessage.from,
          to: whatsappMessage.to,
          content: content, // Usar conteúdo original (antes da criptografia)
          contactName: whatsappMessage.contactName,
          timestamp: whatsappMessage.timestamp,
        },
        connectionId: connectionId,
      });

      console.log(`📥 [WhatsApp ${connection.instanceName}] MENSAGEM REAL RECEBIDA DO WHATSAPP`);
      const jidType = remoteJid.includes("@lid") ? "LID" : remoteJid.includes("@s.whatsapp.net") ? "PN" : "JID";
      console.log(`   👤 De: ${from}${contactName ? ` (${contactName})` : ""}${isGroup ? " [GRUPO]" : ""}`);
      console.log(`   📱 JID: ${remoteJid} (${jidType})${remoteJid.includes("@lid") ? " - LID não é número de telefone" : ""}`);
      console.log(`   📝 Conteúdo: ${content.substring(0, 100)}`);
      console.log(`   🆔 Message ID: ${messageId}`);
      console.log(`   ✅ Esta é uma mensagem REAL do WhatsApp Web, não é mockada!`);
      console.log(`   🔍 Debug: remoteJid=${remoteJid}, isGroup=${isGroup}, isBroadcast=${isBroadcast}, content.length=${content.trim().length}`);

      // AUTOMAÇÃO: Resposta automática (se habilitada)
      try {
        // Buscar conexão atualizada do banco para garantir que temos o valor mais recente de automationEnabled
        const updatedConnection = await WhatsAppConnection.findById(connection._id);
        if (!updatedConnection) {
          console.log(`   ⚠️ Conexão não encontrada no banco`);
          return;
        }
        
        // Verificar se automação está habilitada (buscar valor atualizado do banco)
        const automationEnabled = updatedConnection.automationEnabled !== false; // Default true
        console.log(`   🤖 Automação habilitada: ${automationEnabled} (valor do banco: ${updatedConnection.automationEnabled})`);
        
        if (automationEnabled && !isGroup && !isBroadcast && content.trim().length > 0 && content !== "[Mídia]") {
          console.log(`   ✅ Condições atendidas para automação!`);
          console.log(`🤖 [WhatsApp ${updatedConnection.instanceName}] Processando automação para mensagem de ${from}`);
          
          // Buscar histórico recente de mensagens com este contato (últimas 5 mensagens)
          const recentMessages = await WhatsAppMessage.find({
            connectionId: updatedConnection._id,
            $or: [
              { from: { $regex: from.replace(/[^0-9]/g, ""), $options: "i" } },
              { to: { $regex: from.replace(/[^0-9]/g, ""), $options: "i" } }
            ]
          })
            .sort({ timestamp: -1 })
            .limit(5)
            .lean();

          // Criar contexto da conversa
          const conversationHistory = recentMessages
            .reverse()
            .map(msg => {
              return {
                role: msg.direction === "inbound" ? "user" : "assistant",
                content: msg.content
              };
            });

          // Gerar resposta automática usando IA
          const { generateContent } = await import("../utils/gemini.js");
          
          // Construir prompt com histórico da conversa
          let conversationContext = "";
          if (conversationHistory.length > 0) {
            conversationContext = "\n\nHISTÓRICO DA CONVERSA:\n";
            conversationHistory.forEach((msg, index) => {
              conversationContext += `${msg.role === "user" ? "Contato" : "Você"}: ${msg.content}\n`;
            });
          }
          
          const prompt = `Você está respondendo mensagens recebidas no seu WhatsApp pessoal. Seja profissional, amigável, objetivo e útil. Responda de forma natural e adequada ao contexto da conversa.

MENSAGEM RECEBIDA:
${content}${conversationContext}

INSTRUÇÕES:
- Analise o histórico da conversa para entender o contexto
- Responda de forma natural, como você responderia pessoalmente
- Seja conciso mas completo
- Mantenha o tom adequado ao contexto (formal ou informal conforme a conversa)
- Se for uma pergunta, responda diretamente
- Se for uma saudação, responda de forma amigável
- Se for uma solicitação, confirme e forneça informações relevantes

Gere uma resposta completa e pronta para enviar, sem marcações ou formatação adicional.`;
          
          let aiResponse;
          try {
            aiResponse = await generateContent(prompt);
          } catch (error: any) {
            console.error(`❌ [WhatsApp ${connection.instanceName}] Erro ao chamar Gemini:`, error);
            // Se for erro de quota ou rate limit, não tentar responder
            if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("rate limit") || error.message?.includes("Quota exceeded")) {
              console.log(`   ⚠️ Quota do Gemini excedida. Mensagem não será respondida automaticamente.`);
              console.log(`   💡 Considere atualizar seu plano do Gemini ou aguardar o reset da quota.`);
              aiResponse = { success: false, error: "Quota excedida" };
            } else {
              // Para outros erros, tentar continuar
              aiResponse = { success: false, error: error.message || "Erro desconhecido" };
            }
          }
          
          if (aiResponse.success && aiResponse.content) {
            // Emitir evento: IA processando
            emitWhatsAppMessage(updatedConnection.userId.toString(), {
              type: "ai_processing",
              message: {
                originalMessage: content,
                contactName,
                from,
              },
              connectionId: connectionId,
            });

            // Enviar resposta automática
            const service = activeServices.get(connectionId);
            if (!service) {
              console.error(`❌ [WhatsApp ${connection.instanceName}] Serviço não encontrado para conexão ${connectionId}`);
              return;
            }

            // Verificar se o serviço está conectado
            const serviceStatus = await service.getStatus();
            if (serviceStatus.data?.status !== "connected") {
              console.error(`❌ [WhatsApp ${connection.instanceName}] Serviço não está conectado. Status: ${serviceStatus.data?.status}`);
              return;
            }

            // IMPORTANTE: Usar o JID original (remoteJid) diretamente
            // Não converter LID para número - WhatsApp permite enviar usando LID ou PN
            // Conforme documentação Baileys: https://baileys.wiki/docs/migration/to-v7.0.0/
            const destinationJid = originalJid;
            
            console.log(`📤 [WhatsApp ${updatedConnection.instanceName}] Preparando para enviar resposta automática`);
            if (originalJid.includes("@lid")) {
              console.log(`   📱 JID (LID): ${originalJid} - Usando LID diretamente (não é número de telefone)`);
            } else if (originalJid.includes("@s.whatsapp.net")) {
              console.log(`   📱 JID (PN): ${originalJid} - Número de telefone`);
            } else {
              console.log(`   📱 JID: ${originalJid}`);
            }
            console.log(`   💬 Resposta: ${aiResponse.content.substring(0, 100)}...`);

            const sendResult = await service.sendTextMessage({
              to: destinationJid,
              message: aiResponse.content
            });

            console.log(`📊 [WhatsApp ${updatedConnection.instanceName}] Resultado do envio:`, {
              success: sendResult.success,
              messageId: sendResult.messageId,
              error: sendResult.error
            });

            if (sendResult.success && sendResult.messageId) {
                // Emitir evento: Resposta gerada pela IA
                emitWhatsAppMessage(updatedConnection.userId.toString(), {
                  type: "ai_generated",
                  message: {
                    content: aiResponse.content,
                    contactName,
                    from,
                  },
                  connectionId: connectionId,
                });

                // Salvar mensagem de resposta automática
                const replyMessage = new WhatsAppMessage({
                  userId: updatedConnection.userId,
                  connectionId: updatedConnection._id,
                  messageId: sendResult.messageId,
                  from: connection.phoneNumber,
                  to: from,
                  type: "text",
                  content: aiResponse.content,
                  direction: "outbound",
                  status: "sent",
                  timestamp: new Date(),
                  contactName,
                });

                await replyMessage.save();

                // Marcar mensagem original como respondida automaticamente
                whatsappMessage.autoReplied = true;
                whatsappMessage.replyMessageId = replyMessage.messageId;
                await whatsappMessage.save();

                // Atualizar estatísticas
                updatedConnection.messagesSent = (updatedConnection.messagesSent || 0) + 1;
                await updatedConnection.save();

                // Emitir evento: Mensagem enviada (usar conteúdo original, não criptografado)
                emitWhatsAppMessage(updatedConnection.userId.toString(), {
                  type: "message_sent",
                  message: {
                    id: replyMessage._id.toString(),
                    messageId: replyMessage.messageId,
                    from: replyMessage.from,
                    to: replyMessage.to,
                    content: aiResponse.content, // Usar conteúdo original (antes da criptografia)
                    contactName: replyMessage.contactName,
                    timestamp: replyMessage.timestamp,
                    status: replyMessage.status,
                  },
                  connectionId: connectionId,
                });

                console.log(`✅ [WhatsApp ${updatedConnection.instanceName}] Resposta automática enviada para ${from}`);
                console.log(`   💬 Resposta: ${aiResponse.content.substring(0, 100)}`);
              } else {
                console.error(`❌ [WhatsApp ${updatedConnection.instanceName}] Erro ao enviar resposta automática`);
                console.error(`   📋 Detalhes:`, {
                  success: sendResult.success,
                  error: sendResult.error,
                  messageId: sendResult.messageId,
                  hasData: !!sendResult.data
                });
              }
          } else {
            console.log(`⚠️ [WhatsApp ${connection.instanceName}] Não foi possível gerar resposta automática`);
          }
        }
      } catch (error: any) {
        console.error(`❌ [WhatsApp ${connection.instanceName}] Erro na automação:`, error);
        // Não interromper o fluxo principal se a automação falhar
      }
    } catch (error: any) {
      console.error("Erro ao processar mensagem recebida:", error);
    }
  });
}

/**
 * Criar nova conexão WhatsApp usando Baileys
 */
export const createConnection = async (req: AuthRequest, res: Response) => {
  try {
    const { instanceName, phoneNumber } = req.body;

    if (!instanceName) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: instanceName",
      });
    }

    // Verificar se já existe conexão com este nome
    const existingConnection = await WhatsAppConnection.findOne({
      userId: req.userId,
      instanceName,
    });

    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message: "Já existe uma conexão com este nome",
      });
    }

    // Criar serviço Baileys
    const service = new WhatsAppService({
      instanceName,
      phoneNumber,
    });

    // Conectar e obter QR Code
    const result = await service.connect();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Erro ao criar conexão",
      });
    }

    // Salvar conexão no banco
    const connection = new WhatsAppConnection({
      userId: req.userId,
      phoneNumber: phoneNumber || "",
      instanceName,
      provider: "baileys",
      qrCode: result.data?.qrCode || null,
      status: result.data?.status || "connecting",
      isActive: true,
    });

    await connection.save();

    // Configurar listener de mensagens
    setupMessageListener(connection._id.toString(), service, connection);

    // Configurar callback para atualizar conexão quando status mudar
    service.setOnConnectionUpdateCallback(async (status, phoneNumber, profileName) => {
      try {
        const conn = await WhatsAppConnection.findById(connection._id);
        if (conn) {
          conn.status = status as any;
          if (phoneNumber) {
            conn.phoneNumber = phoneNumber;
          }
          if (profileName) {
            conn.profileName = profileName;
          }
          await conn.save();
          console.log(`✅ [WhatsApp ${connection.instanceName}] Conexão atualizada no banco: status=${status}, phone=${phoneNumber || "N/A"}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar conexão no banco:`, error);
      }
    });

    // Armazenar serviço ativo
    activeServices.set(connection._id.toString(), service);

    res.status(201).json({
      success: true,
      connection: {
        id: connection._id.toString(),
        instanceName: connection.instanceName,
        status: connection.status,
        qrCode: connection.qrCode,
      },
    });
  } catch (error: any) {
    console.error("Create connection error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao criar conexão",
    });
  }
};

/**
 * Obter QR Code para autenticação
 */
export const getQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const connection = await WhatsAppConnection.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Conexão não encontrada",
      });
    }

    // Obter ou criar serviço
    let service = activeServices.get(id);
    if (!service) {
      service = new WhatsAppService({
        instanceName: connection.instanceName,
        phoneNumber: connection.phoneNumber,
      });
      activeServices.set(id, service);
      await service.connect();
      // Configurar listener de mensagens
      setupMessageListener(id, service, connection);
    }

    const result = await service.getQRCode();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Erro ao obter QR Code",
      });
    }

    // Atualizar QR Code no banco
    connection.qrCode = result.data?.qrCode;
    await connection.save();

    res.json({
      success: true,
      qrCode: result.data?.qrCode,
    });
  } catch (error: any) {
    console.error("Get QR Code error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao obter QR Code",
    });
  }
};

/**
 * Verificar status da conexão
 */
export const getConnectionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const connection = await WhatsAppConnection.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Conexão não encontrada",
      });
    }

    // Obter ou criar serviço
    let service = activeServices.get(id);
    if (!service) {
      service = new WhatsAppService({
        instanceName: connection.instanceName,
        phoneNumber: connection.phoneNumber,
      });
      activeServices.set(id, service);
      // Configurar listener ANTES de conectar
      setupMessageListener(id, service, connection);
      // Tentar conectar se não estiver conectado
      if (connection.status !== "connected") {
        await service.connect();
      }
    } else {
      // Garantir que o listener está configurado mesmo se o serviço já existe
      setupMessageListener(id, service, connection);
    }

    const result = await service.getStatus();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Erro ao verificar status",
      });
    }

    // Atualizar status no banco
    connection.status = result.data?.status || "disconnected";
    if (result.data?.phoneNumber) {
      connection.phoneNumber = result.data.phoneNumber;
    }
    if (result.data?.name) {
      connection.profileName = result.data.name;
    }
    await connection.save();

    res.json({
      success: true,
      status: connection.status,
      phoneNumber: connection.phoneNumber,
      profileName: connection.profileName,
    });
  } catch (error: any) {
    console.error("Get status error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao verificar status",
    });
  }
};

/**
 * Listar todas as conexões do usuário
 */
export const getConnections = async (req: AuthRequest, res: Response) => {
  try {
    const connections = await WhatsAppConnection.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

      // Tentar reconectar conexões ativas que não estão em memória
      for (const conn of connections) {
        if (conn.isActive && !activeServices.has(conn._id.toString())) {
          try {
            const service = new WhatsAppService({
              instanceName: conn.instanceName,
              phoneNumber: conn.phoneNumber,
            });
            activeServices.set(conn._id.toString(), service);
            // Configurar listener de mensagens
            setupMessageListener(conn._id.toString(), service, conn);
            // Conectar em background (não aguardar)
            service.connect().then((result) => {
              if (result.success && result.data?.status === "connected") {
                conn.status = "connected";
                conn.save();
              }
            }).catch(console.error);
          } catch (error) {
            console.error(`Erro ao reconectar ${conn.instanceName}:`, error);
          }
        }
      }

    // Calcular estatísticas reais a partir das mensagens no banco
    const connectionsWithStats = await Promise.all(
      connections.map(async (conn) => {
        // Contar mensagens recebidas
        const receivedCount = await WhatsAppMessage.countDocuments({
          connectionId: conn._id,
          direction: "inbound",
        });

        // Contar mensagens enviadas
        const sentCount = await WhatsAppMessage.countDocuments({
          connectionId: conn._id,
          direction: "outbound",
        });

        // Buscar última mensagem
        const lastMessage = await WhatsAppMessage.findOne({
          connectionId: conn._id,
        })
          .sort({ timestamp: -1 })
          .select("timestamp")
          .lean();

        return {
          id: conn._id.toString(),
          phoneNumber: conn.phoneNumber,
          instanceName: conn.instanceName,
          provider: conn.provider,
          status: conn.status,
          isActive: conn.isActive,
          automationEnabled: conn.automationEnabled,
          messagesSent: sentCount,
          messagesReceived: receivedCount,
          lastMessageAt: lastMessage?.timestamp || conn.lastMessageAt,
          createdAt: conn.createdAt,
        };
      })
    );

    res.json({
      success: true,
      connections: connectionsWithStats,
    });
  } catch (error: any) {
    console.error("Get connections error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao buscar conexões",
    });
  }
};

/**
 * Deletar conexão
 */
export const deleteConnection = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const connection = await WhatsAppConnection.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Conexão não encontrada",
      });
    }

    // Obter serviço e deletar sessão
    const service = activeServices.get(id);
    if (service) {
      await service.deleteSession();
      activeServices.delete(id);
    } else {
      // Se não estiver em memória, criar temporariamente para deletar
      const tempService = new WhatsAppService({
        instanceName: connection.instanceName,
        phoneNumber: connection.phoneNumber,
      });
      await tempService.deleteSession();
    }

    // Deletar do banco
    await connection.deleteOne();

    res.json({
      success: true,
      message: "Conexão deletada com sucesso",
    });
  } catch (error: any) {
    console.error("Delete connection error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao deletar conexão",
    });
  }
};

/**
 * Enviar mensagem
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { connectionId, to, message, mediaUrl, mediaType } = req.body;

    if (!connectionId || !to || !message) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios: connectionId, to, message",
      });
    }

    const connection = await WhatsAppConnection.findOne({
      _id: connectionId,
      userId: req.userId,
      isActive: true,
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Conexão não encontrada ou inativa",
      });
    }

    if (connection.status !== "connected") {
      return res.status(400).json({
        success: false,
        message: "Conexão não está conectada. Verifique o status da conexão.",
      });
    }

    // Obter ou criar serviço
    let service = activeServices.get(connectionId);
    if (!service) {
      service = new WhatsAppService({
        instanceName: connection.instanceName,
        phoneNumber: connection.phoneNumber,
      });
      activeServices.set(connectionId, service);
      // Tentar reconectar se necessário
      if (connection.status !== "connected") {
        await service.connect();
        // Configurar listener de mensagens
        setupMessageListener(connectionId, service, connection);
      }
    }
    
    // Verificar se o serviço está realmente conectado
    const statusResult = await service.getStatus();
    if (statusResult.data?.status !== "connected") {
      console.log(`[WhatsApp] Serviço não está conectado. Status: ${statusResult.data?.status}`);
      return res.status(400).json({
        success: false,
        message: "Serviço não está conectado. Aguarde alguns segundos e tente novamente.",
      });
    }

    // Limpar número de destino (remover sufixos se houver)
    const cleanTo = to
      .replace("@s.whatsapp.net", "")
      .replace("@g.us", "")
      .replace("@lid", "")
      .replace("@c.us", "")
      .replace(/[^0-9]/g, "");

    console.log(`[WhatsApp] Enviando mensagem para: ${cleanTo}, texto: ${message.substring(0, 50)}...`);

    // Salvar mensagem no banco com status "pending" primeiro
    const whatsappMessage = new WhatsAppMessage({
      userId: req.userId,
      connectionId: connection._id,
      messageId: crypto.randomUUID(), // ID temporário, será atualizado após envio
      from: connection.phoneNumber,
      to: cleanTo,
      type: mediaUrl ? (mediaType?.startsWith("image/") ? "image" : mediaType?.startsWith("video/") ? "video" : "document") : "text",
      content: message,
      mediaUrl,
      mediaType,
      direction: "outbound",
      status: "pending", // Status inicial como "pending"
      timestamp: new Date(),
    });

    await whatsappMessage.save();

    // Enviar mensagem (texto ou mídia)
    const result = mediaUrl
      ? await service.sendMediaMessage({ to: cleanTo, message, mediaUrl, mediaType })
      : await service.sendTextMessage({ to: cleanTo, message });

    if (!result.success || !result.messageId) {
      console.error(`[WhatsApp] Erro ao enviar: ${result.error || "Mensagem não foi enviada"}`);
      
      // Atualizar status para "failed"
      whatsappMessage.status = "failed";
      await whatsappMessage.save();
      
      return res.status(500).json({
        success: false,
        message: result.error || "Erro ao enviar mensagem",
      });
    }

    console.log(`[WhatsApp] Mensagem enviada com sucesso! ID: ${result.messageId}`);

    // Atualizar mensagem com o ID real e status "sent"
    whatsappMessage.messageId = result.messageId;
    whatsappMessage.status = "sent";
    await whatsappMessage.save();

    // Atualizar estatísticas da conexão
    connection.messagesSent = (connection.messagesSent || 0) + 1;
    connection.lastMessageAt = new Date();
    await connection.save();

    // Criar notificação
    await createNotification({
      userId: req.userId!,
      title: "Mensagem enviada",
      message: `Mensagem enviada para ${to} via WhatsApp`,
      type: "success",
      link: "/dashboard/whatsapp",
    });

    res.json({
      success: true,
      message: {
        id: whatsappMessage._id.toString(),
        messageId: whatsappMessage.messageId,
        to: whatsappMessage.to,
        content: whatsappMessage.content,
        status: whatsappMessage.status,
        timestamp: whatsappMessage.timestamp,
      },
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao enviar mensagem",
    });
  }
};

/**
 * Enviar mensagens em massa
 */
export const sendBulkMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { connectionId, contacts, message, mediaUrl, mediaType, delay = 2000 } = req.body;

    if (!connectionId || !contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios: connectionId, contacts (array não vazio)",
      });
    }

    if (!message && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: "É necessário fornecer 'message' ou 'mediaUrl'",
      });
    }

    const connection = await WhatsAppConnection.findOne({
      _id: connectionId,
      userId: req.userId,
      isActive: true,
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Conexão não encontrada ou inativa",
      });
    }

    if (connection.status !== "connected") {
      return res.status(400).json({
        success: false,
        message: "Conexão não está conectada. Verifique o status da conexão.",
      });
    }

    // Obter ou criar serviço
    let service = activeServices.get(connectionId);
    if (!service) {
      service = new WhatsAppService({
        instanceName: connection.instanceName,
        phoneNumber: connection.phoneNumber,
      });
      activeServices.set(connectionId, service);
      if (connection.status !== "connected") {
        await service.connect();
        setupMessageListener(connectionId, service, connection);
      }
    }

    // Verificar se o serviço está realmente conectado
    const statusResult = await service.getStatus();
    if (statusResult.data?.status !== "connected") {
      return res.status(400).json({
        success: false,
        message: "Serviço não está conectado. Aguarde alguns segundos e tente novamente.",
      });
    }

    // Limitar número de contatos por vez (evitar bloqueios)
    const MAX_CONTACTS = 100;
    if (contacts.length > MAX_CONTACTS) {
      return res.status(400).json({
        success: false,
        message: `Máximo de ${MAX_CONTACTS} contatos por envio em massa. Você tentou enviar para ${contacts.length} contatos.`,
      });
    }

    const results = [];
    const delayMs = Math.max(1000, delay); // Mínimo de 1 segundo entre envios

    // Enviar mensagens com delay entre cada uma
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const contactJid = contact.jid || contact; // Pode ser JID completo ou número

      try {
        // Salvar mensagem no banco com status "pending"
        const whatsappMessage = new WhatsAppMessage({
          userId: req.userId,
          connectionId: connection._id,
          messageId: crypto.randomUUID(),
          from: connection.phoneNumber,
          to: contactJid.replace(/[^0-9@]/g, "").replace(/@.*$/, "") || contactJid,
          type: mediaUrl ? (mediaType?.startsWith("image/") ? "image" : mediaType?.startsWith("video/") ? "video" : "document") : "text",
          content: message || "",
          mediaUrl,
          mediaType,
          direction: "outbound",
          status: "pending",
          timestamp: new Date(),
          contactName: contact.name || contact.contactName,
        });

        await whatsappMessage.save();

        // Enviar mensagem
        const result = mediaUrl
          ? await service.sendMediaMessage({ to: contactJid, message: message || "", mediaUrl, mediaType })
          : await service.sendTextMessage({ to: contactJid, message: message || "" });

        if (result.success && result.messageId) {
          // Atualizar mensagem com sucesso
          whatsappMessage.messageId = result.messageId;
          whatsappMessage.status = "sent";
          await whatsappMessage.save();

          results.push({
            contact: contactJid,
            contactName: contact.name || contact.contactName,
            success: true,
            messageId: result.messageId,
          });
        } else {
          // Atualizar mensagem com falha
          whatsappMessage.status = "failed";
          await whatsappMessage.save();

          results.push({
            contact: contactJid,
            contactName: contact.name || contact.contactName,
            success: false,
            error: result.error || "Erro desconhecido",
          });
        }

        // Atualizar estatísticas
        if (result.success) {
          connection.messagesSent = (connection.messagesSent || 0) + 1;
        }

        // Delay entre envios (exceto no último)
        if (i < contacts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error: any) {
        results.push({
          contact: contactJid,
          contactName: contact.name || contact.contactName,
          success: false,
          error: error.message || "Erro ao enviar mensagem",
        });
      }
    }

    // Salvar estatísticas atualizadas
    connection.lastMessageAt = new Date();
    await connection.save();

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    res.json({
      success: true,
      total: contacts.length,
      sent: successCount,
      failed: failCount,
      results,
    });
  } catch (error: any) {
    console.error("Bulk send error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao enviar mensagens em massa",
    });
  }
};

/**
 * Listar mensagens
 */
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const connectionId = Array.isArray(req.query.connectionId) ? req.query.connectionId[0] : req.query.connectionId;
    const from = Array.isArray(req.query.from) ? req.query.from[0] : req.query.from;
    const limit = Number(Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit) || 50;
    const page = Number(Array.isArray(req.query.page) ? req.query.page[0] : req.query.page) || 1;

    const filter: any = { userId: req.userId };
    if (connectionId) filter.connectionId = connectionId;
    if (from) {
      // Buscar mensagens onde o contato é o remetente (inbound) ou destinatário (outbound)
      filter.$or = [
        { from: from, direction: "inbound" },
        { to: from, direction: "outbound" }
      ];
    }

    const skip = (page - 1) * limit;

    const messages = await WhatsAppMessage.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .populate("connectionId", "instanceName phoneNumber");

    const total = await WhatsAppMessage.countDocuments(filter);

    res.json({
      success: true,
      messages: messages.map((msg) => {
        return {
          id: msg._id.toString(),
          messageId: msg.messageId,
          from: msg.from,
          to: msg.to,
          type: msg.type,
          content: msg.content,
          mediaUrl: msg.mediaUrl,
          direction: msg.direction,
          status: msg.status,
          timestamp: msg.timestamp,
          contactName: msg.contactName,
          connection: msg.connectionId,
        };
      }),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao buscar mensagens",
    });
  }
};

/**
 * Buscar contatos do WhatsApp
 */
export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const connectionId = req.query.connectionId;
    const id = Array.isArray(connectionId) ? String(connectionId[0]) : String(connectionId || "");

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "connectionId é obrigatório",
      });
    }

    const connection = await WhatsAppConnection.findOne({
      _id: id,
      userId: req.userId,
      isActive: true,
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Conexão não encontrada",
      });
    }

    if (connection.status !== "connected") {
      return res.status(400).json({
        success: false,
        message: "Conexão não está conectada",
      });
    }

    // Obter ou criar serviço
    const serviceId = String(id);
    let service = activeServices.get(serviceId);
    if (!service) {
      service = new WhatsAppService({
        instanceName: connection.instanceName,
        phoneNumber: connection.phoneNumber,
      });
      activeServices.set(serviceId, service);
      await service.connect();
    }

    const result = await service.getContacts();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Erro ao buscar contatos",
      });
    }

    res.json({
      success: true,
      contacts: result.data?.contacts || [],
    });
  } catch (error: any) {
    console.error("Get contacts error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao buscar contatos",
    });
  }
};

/**
 * Buscar informações do perfil conectado
 */
export const getProfileInfo = async (req: AuthRequest, res: Response) => {
  try {
    const connectionId = req.query.connectionId;
    const id = Array.isArray(connectionId) ? String(connectionId[0]) : String(connectionId || "");

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "connectionId é obrigatório",
      });
    }

    const connection = await WhatsAppConnection.findOne({
      _id: id,
      userId: req.userId,
      isActive: true,
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Conexão não encontrada",
      });
    }

    if (connection.status !== "connected") {
      return res.status(400).json({
        success: false,
        message: "Conexão não está conectada",
      });
    }

    // Obter ou criar serviço
    const serviceId = String(id);
    let service = activeServices.get(serviceId);
    if (!service) {
      service = new WhatsAppService({
        instanceName: connection.instanceName,
        phoneNumber: connection.phoneNumber,
      });
      activeServices.set(serviceId, service);
      await service.connect();
    }

    const result = await service.getProfileInfo();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || "Erro ao buscar informações do perfil",
      });
    }

    res.json({
      success: true,
      profile: result.data,
    });
  } catch (error: any) {
    console.error("Get profile info error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao buscar informações do perfil",
    });
  }
};

/**
 * Atualizar configuração de automação
 */
export const updateAutomation = async (req: AuthRequest, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { automationEnabled } = req.body;

    if (typeof automationEnabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório: automationEnabled (boolean)",
      });
    }

    const connection = await WhatsAppConnection.findOne({
      _id: connectionId,
      userId: req.userId,
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Conexão não encontrada",
      });
    }

    connection.automationEnabled = automationEnabled;
    await connection.save();

    res.json({
      success: true,
      connection: {
        id: connection._id.toString(),
        automationEnabled: connection.automationEnabled,
      },
    });
  } catch (error: any) {
    console.error("Update automation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao atualizar automação",
    });
  }
};

/**
 * Webhook para receber mensagens (chamado pela API do WhatsApp)
 */
export const webhook = async (req: Request, res: Response) => {
  try {
    // Evolution API envia eventos neste formato
    const event = req.body;

    // Verificar se é uma mensagem recebida
    if (event.event === "messages.upsert" || event.data?.key) {
      const messageData = event.data || event;

      // Buscar conexão pelo instanceName
      const connection = await WhatsAppConnection.findOne({
        instanceName: messageData.instance || event.instance,
        isActive: true,
      });

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: "Conexão não encontrada",
        });
      }

      // Extrair dados da mensagem
      const from = messageData.key?.remoteJid?.replace("@s.whatsapp.net", "") || messageData.from;
      const messageId = messageData.key?.id || messageData.id;
      const content = messageData.message?.conversation || 
                     messageData.message?.extendedTextMessage?.text ||
                     messageData.body ||
                     "";

      // Salvar mensagem recebida
      const whatsappMessage = new WhatsAppMessage({
        userId: connection.userId,
        connectionId: connection._id,
        messageId: messageId || crypto.randomUUID(),
        from: from || "",
        to: connection.phoneNumber,
        type: "text", // Simplificado, pode ser expandido
        content,
        direction: "inbound",
        status: "delivered",
        timestamp: new Date(messageData.messageTimestamp * 1000 || Date.now()),
      });

      await whatsappMessage.save();

      // Atualizar estatísticas
      connection.messagesReceived = (connection.messagesReceived || 0) + 1;
      connection.lastMessageAt = new Date();
      await connection.save();

      // Aqui você pode adicionar lógica de resposta automática, notificações, etc.
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao processar webhook",
    });
  }
};

