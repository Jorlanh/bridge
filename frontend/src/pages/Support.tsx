import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { 
  Phone,
  Loader2,
  Settings,
  Zap,
  MessageSquare,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  Bot,
  Send,
  CheckCircle2,
  Clock,
  Users,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { whatsappApi, WhatsAppConnection, WhatsAppMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Support() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  
  // Estados para WhatsApp
  const [whatsappConnection, setWhatsappConnection] = useState<WhatsAppConnection | null>(null);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [profileInfo, setProfileInfo] = useState<{
    name?: string;
    phoneNumber?: string;
    profilePicture?: string;
  } | null>(null);
  const [profilePictureError, setProfilePictureError] = useState(false);
  
  // Estados para atividades em tempo real
  interface Activity {
    id: string;
    type: "received" | "ai_processing" | "ai_generated" | "sent";
    message?: string;
    contactName?: string;
    timestamp: Date;
    status?: "processing" | "success" | "error";
  }
  const [activities, setActivities] = useState<Activity[]>([]);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  // Estados para envio em massa
  const [contacts, setContacts] = useState<Array<{ jid: string; name?: string; exists?: boolean; profilePicture?: string }>>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkDelay, setBulkDelay] = useState(2000);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState<{
    total: number;
    sent: number;
    failed: number;
    results: Array<{ contact: string; contactName?: string; success: boolean; error?: string }>;
  } | null>(null);

  useEffect(() => {
    loadWhatsAppConnection();
  }, []);

  // Carregar contatos quando conexão estiver ativa
  useEffect(() => {
    if (whatsappConnection?.status === "connected" && whatsappConnection?.id) {
      loadContacts();
    }
  }, [whatsappConnection?.status, whatsappConnection?.id]);

  // Carregar atividades iniciais
  useEffect(() => {
    if (whatsappConnection?.status === "connected" && whatsappConnection?.id) {
      loadRecentActivities();
    }
  }, [whatsappConnection?.status, whatsappConnection?.id]);

  // Conectar ao WebSocket para receber eventos em tempo real
  useEffect(() => {
    if (!whatsappConnection || whatsappConnection.status !== "connected" || !whatsappConnection.id) return;

    let socket: any = null;

    // Importar dinamicamente para evitar problemas de SSR
    import("socket.io-client").then(({ io: ioClient }) => {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const token = localStorage.getItem("token");

      if (!token) return;

      socket = ioClient(API_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        console.log("✅ WebSocket conectado para WhatsApp em tempo real");
      });

      // Escutar eventos de WhatsApp em tempo real
      socket.on("whatsapp-activity", (event: {
        type: "message_received" | "ai_processing" | "ai_generated" | "message_sent";
        message: any;
        connectionId: string;
      }) => {
        // Verificar se é da conexão atual
        if (event.connectionId !== whatsappConnection?.id) return;

        const now = new Date();
        let newActivity: Activity | null = null;

        switch (event.type) {
          case "message_received":
            newActivity = {
              id: `received-${event.message.id}`,
              type: "received",
              message: event.message.content,
              contactName: event.message.contactName || event.message.from,
              timestamp: new Date(event.message.timestamp || now),
              status: "success",
            };
            break;
          case "ai_processing":
            newActivity = {
              id: `ai-processing-${Date.now()}`,
              type: "ai_processing",
              message: event.message.originalMessage,
              contactName: event.message.contactName || event.message.from,
              timestamp: now,
              status: "processing",
            };
            break;
          case "ai_generated":
            newActivity = {
              id: `ai-generated-${Date.now()}`,
              type: "ai_generated",
              message: event.message.content,
              contactName: event.message.contactName || event.message.from,
              timestamp: now,
              status: "success",
            };
            break;
          case "message_sent":
            newActivity = {
              id: `sent-${event.message.id}`,
              type: "sent",
              message: event.message.content,
              contactName: event.message.contactName || event.message.to,
              timestamp: new Date(event.message.timestamp || now),
              status: "success",
            };
            break;
        }

        if (newActivity) {
          setActivities((prev) => {
            // Evitar duplicatas
            if (prev.some(a => a.id === newActivity!.id)) {
              return prev;
            }
            // Adicionar no início e manter apenas as últimas 50
            return [newActivity!, ...prev].slice(0, 50);
          });

          // Atualizar estatísticas em tempo real
          if (event.type === "message_received") {
            setWhatsappConnection(prev => prev ? {
              ...prev,
              messagesReceived: (prev.messagesReceived || 0) + 1,
              lastMessageAt: new Date().toISOString(),
            } : null);
          } else if (event.type === "message_sent") {
            setWhatsappConnection(prev => prev ? {
              ...prev,
              messagesSent: (prev.messagesSent || 0) + 1,
              lastMessageAt: new Date().toISOString(),
            } : null);
          }
          
          // Recarregar estatísticas do servidor após um pequeno delay para garantir sincronização
          setTimeout(() => {
            loadWhatsAppConnection();
          }, 1000);
        }
      });

      socket.on("disconnect", () => {
        console.log("❌ WebSocket desconectado");
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Erro ao conectar WebSocket:", error);
      });
    });

    // Fallback: polling a cada 5 segundos caso WebSocket falhe
    const fallbackInterval = setInterval(() => {
      loadRecentActivities();
    }, 5000);

    return () => {
      if (socket) {
        socket.disconnect();
      }
      clearInterval(fallbackInterval);
    };
  }, [whatsappConnection?.status, whatsappConnection?.id]);

  const loadRecentActivities = async () => {
    if (!whatsappConnection?.id) return;

    try {
      const result = await whatsappApi.getMessages({
        connectionId: whatsappConnection.id,
        limit: 20,
      });

      if (result.success && result.messages) {
        const newActivities: Activity[] = [];
        const processedIds = new Set<string>();

        // Processar mensagens em ordem cronológica
        const sortedMessages = [...result.messages].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        for (const msg of sortedMessages) {
          if (processedIds.has(msg.id)) continue;

          if (msg.direction === "inbound") {
            processedIds.add(msg.id);
            
            // Mensagem recebida
            newActivities.push({
              id: `received-${msg.id}`,
              type: "received",
              message: msg.content,
              contactName: msg.contactName || msg.from,
              timestamp: new Date(msg.timestamp),
              status: "success",
            });

            // Verificar se há resposta automática (buscar mensagem de resposta enviada logo após)
            const msgTime = new Date(msg.timestamp).getTime();
            const replyMessage = sortedMessages.find(
              (m) => m.direction === "outbound" && 
              m.to === msg.from && 
              !processedIds.has(m.id) &&
              new Date(m.timestamp).getTime() > msgTime &&
              new Date(m.timestamp).getTime() - msgTime < 60000 // Dentro de 1 minuto
            );

            // Se encontrou resposta, adicionar atividades de IA
            if (replyMessage) {
              processedIds.add(replyMessage.id);
              
              // Simular processamento da IA (500ms após receber)
              newActivities.push({
                id: `ai-processing-${msg.id}`,
                type: "ai_processing",
                message: msg.content,
                contactName: msg.contactName || msg.from,
                timestamp: new Date(msgTime + 500),
                status: "processing",
              });

              // Resposta gerada pela IA (2 segundos após receber)
              newActivities.push({
                id: `ai-generated-${msg.id}`,
                type: "ai_generated",
                message: replyMessage.content,
                contactName: msg.contactName || msg.from,
                timestamp: new Date(msgTime + 2000),
                status: "success",
              });

              // Mensagem enviada
              newActivities.push({
                id: `sent-${replyMessage.id}`,
                type: "sent",
                message: replyMessage.content,
                contactName: msg.contactName || msg.from,
                timestamp: new Date(replyMessage.timestamp),
                status: replyMessage.status === "sent" || replyMessage.status === "delivered" ? "success" : "processing",
              });
            }
          }
        }

        // Combinar atividades existentes com novas, removendo duplicatas
        const existingIds = new Set(activities.map(a => a.id));
        const uniqueNewActivities = newActivities.filter(a => !existingIds.has(a.id));
        
        // Combinar e ordenar (mais recentes primeiro)
        const allActivities = [...activities, ...uniqueNewActivities]
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 50); // Manter últimas 50 atividades

        setActivities(allActivities);
      }
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
    }
  };

  // Funções para envio em massa
  const loadContacts = async () => {
    if (!whatsappConnection?.id) return;
    
    try {
      setWhatsappLoading(true);
      const result = await whatsappApi.getContacts(whatsappConnection.id);
      if (result.success && result.contacts) {
        setContacts(result.contacts);
      }
    } catch (error: any) {
      console.error("Erro ao carregar contatos:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar contatos",
        variant: "destructive",
      });
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleSelectAllContacts = () => {
    if (selectedContacts.size === contacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.jid)));
    }
  };

  const handleToggleContact = (jid: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(jid)) {
      newSelected.delete(jid);
    } else {
      newSelected.add(jid);
    }
    setSelectedContacts(newSelected);
  };

  const handleSendBulkMessages = async () => {
    if (!whatsappConnection?.id) {
      toast({
        title: "Erro",
        description: "Conexão WhatsApp não encontrada",
        variant: "destructive",
      });
      return;
    }

    if (selectedContacts.size === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um contato",
        variant: "destructive",
      });
      return;
    }

    if (!bulkMessage.trim()) {
      toast({
        title: "Atenção",
        description: "Digite uma mensagem",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSendingBulk(true);
      setBulkProgress({ current: 0, total: selectedContacts.size });
      setBulkResults(null);

      const contactsToSend = Array.from(selectedContacts).map(jid => {
        const contact = contacts.find(c => c.jid === jid);
        return contact || { jid };
      });

      const result = await whatsappApi.sendBulkMessages({
        connectionId: whatsappConnection.id,
        contacts: contactsToSend,
        message: bulkMessage,
        delay: bulkDelay,
      });

      setBulkResults(result);
      setBulkProgress({ current: result.total, total: result.total });

      toast({
        title: "Envio concluído",
        description: `${result.sent} enviadas, ${result.failed} falharam`,
        variant: result.failed > 0 ? "destructive" : "default",
      });

      // Limpar seleção e mensagem após sucesso
      if (result.failed === 0) {
        setSelectedContacts(new Set());
        setBulkMessage("");
      }
    } catch (error: any) {
      console.error("Erro ao enviar mensagens em massa:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar mensagens em massa",
        variant: "destructive",
      });
    } finally {
      setIsSendingBulk(false);
    }
  };

  // Funções para WhatsApp
  const loadWhatsAppConnection = async () => {
    try {
      const result = await whatsappApi.getConnections();
      if (result.success && result.connections.length > 0) {
        const connection = result.connections[0];
        setWhatsappConnection(connection);
        // Se estiver conectando, verificar QR Code
        if (connection.status === "connecting") {
          checkQRCode(connection.id);
        }
        // Se estiver conectado, buscar informações do perfil
        if (connection.status === "connected" && connection.id) {
          loadProfileInfo(connection.id);
          setProfilePictureError(false); // Resetar erro ao reconectar
        }
      }
    } catch (error) {
      console.error("Erro ao carregar conexão WhatsApp:", error);
    }
  };

  const loadProfileInfo = async (connectionId: string) => {
    try {
      const result = await whatsappApi.getProfileInfo(connectionId);
      if (result.success && result.profile) {
        setProfileInfo(result.profile);
      }
    } catch (error) {
      console.error("Erro ao carregar informações do perfil:", error);
    }
  };

  // Atualizar estatísticas e perfil periodicamente
  useEffect(() => {
    if (whatsappConnection?.status === "connected" && whatsappConnection?.id) {
      // Carregar perfil imediatamente
      loadProfileInfo(whatsappConnection.id);
      
      // Atualizar estatísticas a cada 10 segundos
      const statsInterval = setInterval(() => {
        loadWhatsAppConnection();
      }, 10000);
      return () => clearInterval(statsInterval);
    } else {
      // Limpar perfil se desconectado
      setProfileInfo(null);
    }
  }, [whatsappConnection?.status, whatsappConnection?.id]);

  const checkQRCode = async (connectionId: string) => {
    try {
      const result = await whatsappApi.getQRCode(connectionId);
      if (result.success && result.qrCode) {
        setQrCode(result.qrCode);
        setShowQRDialog(true);
      }
    } catch (error) {
      console.error("Erro ao buscar QR Code:", error);
    }
  };

  const handleConnectWhatsApp = async () => {
    try {
      setWhatsappLoading(true);
      
      if (whatsappConnection) {
        // Se já existe conexão, verificar status
        const statusResult = await whatsappApi.getConnectionStatus(whatsappConnection.id);
        if (statusResult.success) {
          if (statusResult.status === "connecting") {
            // Buscar QR Code separadamente
            await checkQRCode(whatsappConnection.id);
          } else if (statusResult.status === "connected") {
            setWhatsappConnection({ ...whatsappConnection, status: "connected" });
            if (whatsappConnection.id) {
              loadProfileInfo(whatsappConnection.id);
              setProfilePictureError(false);
            }
            toast({
              title: "WhatsApp Conectado",
              description: "Sua conexão está ativa e pronta para automação.",
            });
          }
        }
      } else {
        // Criar nova conexão
        const result = await whatsappApi.createConnection({ instanceName: "Principal" });
        if (result.success && result.connection) {
          setWhatsappConnection(result.connection);
          // Verificar QR Code após criar conexão
          setTimeout(() => {
            checkQRCode(result.connection.id);
          }, 1000);
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao conectar WhatsApp",
        variant: "destructive",
      });
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!whatsappConnection) return;
    
    try {
      setWhatsappLoading(true);
      await whatsappApi.deleteConnection(whatsappConnection.id);
      setWhatsappConnection(null);
      setProfileInfo(null);
      setProfilePictureError(false);
      setShowQRDialog(false);
      setQrCode(null);
      toast({
        title: "WhatsApp Desconectado",
        description: "Conexão removida com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao desconectar",
        variant: "destructive",
      });
    } finally {
      setWhatsappLoading(false);
    }
  };

  // Verificar status periodicamente se estiver conectando
  useEffect(() => {
    if (whatsappConnection && whatsappConnection.status === "connecting") {
      const interval = setInterval(async () => {
        const statusResult = await whatsappApi.getConnectionStatus(whatsappConnection.id);
        if (statusResult.success) {
          if (statusResult.status === "connected") {
            setWhatsappConnection({ ...whatsappConnection, status: "connected" });
            if (whatsappConnection.id) {
              loadProfileInfo(whatsappConnection.id);
              setProfilePictureError(false);
            }
            setShowQRDialog(false);
            setQrCode(null);
            toast({
              title: "WhatsApp Conectado!",
              description: "Conexão estabelecida com sucesso.",
            });
          } else if (statusResult.status === "connecting") {
            // Atualizar QR Code se ainda estiver conectando
            await checkQRCode(whatsappConnection.id);
          }
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [whatsappConnection?.id, whatsappConnection?.status]);


  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar 
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader 
          title="Automação WhatsApp" 
          subtitle="Automatize respostas das suas mensagens pessoais usando inteligência artificial"
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 p-6 overflow-auto max-w-7xl mx-auto w-full">
          {/* Estatísticas Resumidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-5 glass-card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mensagens Recebidas</p>
                  <p className="text-3xl font-bold">
                    {whatsappConnection?.messagesReceived || 0}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-green-500" />
                </div>
              </div>
            </Card>
            <Card className="p-5 glass-card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mensagens Enviadas</p>
                  <p className="text-3xl font-bold">
                    {whatsappConnection?.messagesSent || 0}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-blue-500" />
                </div>
              </div>
            </Card>
            <Card className="p-5 glass-card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status da Automação</p>
                  <p className="text-3xl font-bold">
                    {whatsappConnection?.status === "connected" ? "Ativo" : "Inativo"}
                  </p>
                </div>
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  whatsappConnection?.status === "connected" 
                    ? "bg-purple-500/20" 
                    : "bg-gray-500/20"
                )}>
                  <Zap className={cn(
                    "w-7 h-7",
                    whatsappConnection?.status === "connected" 
                      ? "text-purple-500" 
                      : "text-gray-500"
                  )} />
                </div>
              </div>
            </Card>
          </div>

          {/* Conteúdo Principal */}
          <div className="space-y-6">

            {/* Seção: Conexão WhatsApp */}
            <Card className="glass-card">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Conexão WhatsApp</h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie sua conexão e configure a automação
                    </p>
                  </div>
                  {whatsappConnection?.status === "connected" && (
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="w-4 h-4" />
                      Configurações
                    </Button>
                  )}
                </div>
              </div>

              {whatsappConnection ? (
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    {/* Foto de perfil ou ícone padrão */}
                    <div className={cn(
                      "w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden",
                      whatsappConnection?.status === "connected" 
                        ? "bg-green-500/20 border-2 border-green-500/30" 
                        : whatsappConnection?.status === "connecting"
                        ? "bg-yellow-500/20 border-2 border-yellow-500/30"
                        : "bg-gray-500/20 border-2 border-gray-500/30"
                    )}>
                      {whatsappConnection?.status === "connected" && profileInfo?.profilePicture && !profilePictureError ? (
                        <img 
                          src={profileInfo.profilePicture} 
                          alt={profileInfo.name || "Perfil WhatsApp"}
                          className="w-full h-full object-cover"
                          onError={() => setProfilePictureError(true)}
                        />
                      ) : (
                        <Phone className={cn(
                          "w-8 h-8",
                          whatsappConnection?.status === "connected" 
                            ? "text-green-500" 
                            : whatsappConnection?.status === "connecting"
                            ? "text-yellow-500"
                            : "text-gray-500"
                        )} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg">
                          {profileInfo?.name || whatsappConnection.instanceName || "WhatsApp"}
                        </h3>
                        {whatsappConnection?.status === "connected" ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                            Conectado
                          </Badge>
                        ) : whatsappConnection?.status === "connecting" ? (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                            <Loader2 className="w-3 h-3 animate-spin mr-2" />
                            Conectando...
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30">
                            Desconectado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {profileInfo?.phoneNumber || whatsappConnection.phoneNumber || "Aguardando conexão..."}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {whatsappConnection?.status === "connected" ? (
                        <Button 
                          variant="outline" 
                          onClick={handleDisconnectWhatsApp}
                          disabled={whatsappLoading}
                          size="sm"
                        >
                          Desconectar
                        </Button>
                      ) : whatsappConnection?.status === "connecting" ? (
                        <Button 
                          variant="outline" 
                          onClick={handleDisconnectWhatsApp}
                          disabled={whatsappLoading}
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleConnectWhatsApp}
                          disabled={whatsappLoading}
                          className="gap-2"
                          size="sm"
                        >
                          {whatsappLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Phone className="w-4 h-4" />
                          )}
                          Conectar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Phone className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-semibold text-lg mb-2">Nenhuma conexão ativa</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Conecte seu WhatsApp para começar a automatizar respostas das suas mensagens pessoais
                  </p>
                  <Button onClick={handleConnectWhatsApp} disabled={whatsappLoading} className="gap-2">
                    {whatsappLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                    Conectar WhatsApp
                  </Button>
                </div>
              )}
            </Card>

            {/* Seção: Configuração de Automação */}
            {whatsappConnection?.status === "connected" && (
              <Card className="glass-card">
                <div className="p-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Automação de Respostas</h2>
                      <p className="text-sm text-muted-foreground">
                        Configure respostas automáticas usando inteligência artificial
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Toggle de Automação */}
                  <div className="flex items-start justify-between gap-6 p-5 rounded-lg border bg-muted/30">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <Label htmlFor="automation-toggle" className="text-base font-semibold cursor-pointer">
                          Respostas Automáticas com IA
                        </Label>
                        <Switch
                          id="automation-toggle"
                          checked={whatsappConnection.automationEnabled !== false}
                          onCheckedChange={async (checked) => {
                            try {
                              setWhatsappLoading(true);
                              await whatsappApi.updateAutomation(whatsappConnection.id, checked);
                              setWhatsappConnection({ ...whatsappConnection, automationEnabled: checked });
                              toast({
                                title: checked ? "Automação Ativada" : "Automação Desativada",
                                description: checked 
                                  ? "As respostas automáticas estão agora ativas"
                                  : "As respostas automáticas foram desativadas",
                              });
                            } catch (error: any) {
                              toast({
                                title: "Erro",
                                description: error.message || "Erro ao atualizar automação",
                                variant: "destructive",
                              });
                            } finally {
                              setWhatsappLoading(false);
                            }
                          }}
                          disabled={whatsappLoading}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Ative para que suas mensagens recebidas sejam respondidas automaticamente usando inteligência artificial. 
                        A IA analisa o contexto da conversa para gerar respostas adequadas e naturais.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <span>Mensagens de grupos são ignoradas automaticamente</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <span>Apenas conversas individuais recebem resposta automática</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <span>A IA analisa o contexto para gerar respostas adequadas</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <span>Você pode desativar a qualquer momento</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Seção: Atividades em Tempo Real e Envio em Massa */}
            {whatsappConnection?.status === "connected" && (
              <Card className="glass-card">
                <div className="p-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Fluxo de Automação em Tempo Real</h2>
                      <p className="text-sm text-muted-foreground">
                        Acompanhe o processo completo de automação de mensagens
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <Tabs defaultValue="recebidas" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-8 bg-muted/50 p-1">
                      <TabsTrigger 
                        value="recebidas" 
                        className="flex flex-col items-center gap-1.5 py-3 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-500"
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span className="font-medium">Recebidas</span>
                        </div>
                        {activities.filter(a => a.type === "received").length > 0 ? (
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                            {activities.filter(a => a.type === "received").length}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="gerando" 
                        className="flex flex-col items-center gap-1.5 py-3 data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-500"
                      >
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          <span className="font-medium">Gerando</span>
                        </div>
                        {activities.filter(a => a.type === "ai_processing" || a.type === "ai_generated").length > 0 ? (
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                            {activities.filter(a => a.type === "ai_processing" || a.type === "ai_generated").length}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="enviado" 
                        className="flex flex-col items-center gap-1.5 py-3 data-[state=active]:bg-green-500/10 data-[state=active]:text-green-500"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium">Enviadas</span>
                        </div>
                        {activities.filter(a => a.type === "sent" && a.status === "success").length > 0 ? (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                            {activities.filter(a => a.type === "sent" && a.status === "success").length}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="envio-massa" 
                        className="flex flex-col items-center gap-1.5 py-3 data-[state=active]:bg-green-500/10 data-[state=active]:text-green-500"
                      >
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span className="font-medium">Envio em Massa</span>
                        </div>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="todas" 
                        className="flex flex-col items-center gap-1.5 py-3 data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-500"
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          <span className="font-medium">Todas</span>
                        </div>
                        {activities.length > 0 ? (
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                            {activities.length}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="recebidas" className="mt-0">
                      <div className="mb-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-500">
                            Mensagens Recebidas ({activities.filter(a => a.type === "received").length})
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          Mensagens que chegaram no seu WhatsApp
                        </p>
                      </div>
                      <ScrollArea className="h-[400px] pr-4">
                        {activities.filter(a => a.type === "received").length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                              <MessageSquare className="w-10 h-10 text-blue-500/50" />
                            </div>
                            <p className="text-muted-foreground font-medium mb-1">Nenhuma mensagem recebida ainda</p>
                            <p className="text-sm text-muted-foreground">
                              As mensagens recebidas aparecerão aqui automaticamente
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {activities
                              .filter(a => a.type === "received")
                              .map((activity) => (
                                <div
                                  key={activity.id}
                                  className="p-4 rounded-lg border-2 bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40 transition-colors"
                                >
                                  <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                      <MessageSquare className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-blue-500">
                                            Mensagem Recebida
                                          </span>
                                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {activity.timestamp.toLocaleTimeString("pt-BR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit"
                                          })}
                                        </span>
                                      </div>
                                      {activity.contactName && (
                                        <div className="mb-2">
                                          <span className="text-xs text-muted-foreground">De: </span>
                                          <span className="text-xs font-semibold text-foreground">{activity.contactName}</span>
                                        </div>
                                      )}
                                      {activity.message && (
                                        <div className="bg-muted/70 p-3 rounded-lg border border-blue-500/10">
                                          <p className="text-sm text-foreground leading-relaxed">
                                            {activity.message}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="gerando" className="mt-0">
                      <div className="mb-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <div className="flex items-center gap-2">
                          <Bot className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-yellow-500">
                            IA Gerando Respostas ({activities.filter(a => a.type === "ai_processing" || a.type === "ai_generated").length})
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          Processamento e geração de respostas automáticas pela IA
                        </p>
                      </div>
                      <ScrollArea className="h-[400px] pr-4">
                        {activities.filter(a => a.type === "ai_processing" || a.type === "ai_generated").length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                              <Bot className="w-10 h-10 text-yellow-500/50" />
                            </div>
                            <p className="text-muted-foreground font-medium mb-1">Nenhuma resposta sendo gerada</p>
                            <p className="text-sm text-muted-foreground">
                              A IA aparecerá aqui quando estiver processando e gerando respostas
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {activities
                              .filter(a => a.type === "ai_processing" || a.type === "ai_generated")
                              .map((activity) => (
                                <div
                                  key={activity.id}
                                  className={cn(
                                    "p-4 rounded-lg border-2",
                                    activity.type === "ai_processing" 
                                      ? "bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40" 
                                      : "bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40",
                                    "transition-colors"
                                  )}
                                >
                                  <div className="flex items-start gap-4">
                                    <div className={cn(
                                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                      activity.type === "ai_processing" 
                                        ? "bg-yellow-500/20" 
                                        : "bg-purple-500/20"
                                    )}>
                                      {activity.type === "ai_processing" ? (
                                        <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                                      ) : (
                                        <Bot className="w-6 h-6 text-purple-500" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <span className={cn(
                                            "text-sm font-bold",
                                            activity.type === "ai_processing" 
                                              ? "text-yellow-500" 
                                              : "text-purple-500"
                                          )}>
                                            {activity.type === "ai_processing" 
                                              ? "🤖 Gerando Resposta..." 
                                              : "✨ Resposta Gerada pela IA"}
                                          </span>
                                          {activity.type === "ai_processing" ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                                          ) : (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                          )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {activity.timestamp.toLocaleTimeString("pt-BR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit"
                                          })}
                                        </span>
                                      </div>
                                      {activity.contactName && (
                                        <div className="mb-2">
                                          <span className="text-xs text-muted-foreground">Para: </span>
                                          <span className="text-xs font-semibold text-foreground">{activity.contactName}</span>
                                        </div>
                                      )}
                                      {activity.message && activity.type === "ai_generated" && (
                                        <div className="bg-muted/70 p-3 rounded-lg border border-purple-500/10">
                                          <p className="text-sm text-foreground leading-relaxed">
                                            {activity.message}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="enviado" className="mt-0">
                      <div className="mb-4 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-500">
                            Mensagens Enviadas ({activities.filter(a => a.type === "sent" && a.status === "success").length})
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          Respostas automáticas que foram enviadas com sucesso
                        </p>
                      </div>
                      <ScrollArea className="h-[400px] pr-4">
                        {activities.filter(a => a.type === "sent" && a.status === "success").length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                              <Send className="w-10 h-10 text-green-500/50" />
                            </div>
                            <p className="text-muted-foreground font-medium mb-1">Nenhuma mensagem enviada ainda</p>
                            <p className="text-sm text-muted-foreground">
                              As mensagens enviadas aparecerão aqui automaticamente
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {activities
                              .filter(a => a.type === "sent" && a.status === "success")
                              .map((activity) => (
                                <div
                                  key={activity.id}
                                  className="p-4 rounded-lg border-2 bg-green-500/5 border-green-500/20 hover:border-green-500/40 transition-colors"
                                >
                                  <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                      <Send className="w-6 h-6 text-green-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-green-500">
                                            ✅ Mensagem Enviada
                                          </span>
                                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {activity.timestamp.toLocaleTimeString("pt-BR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit"
                                          })}
                                        </span>
                                      </div>
                                      {activity.contactName && (
                                        <div className="mb-2">
                                          <span className="text-xs text-muted-foreground">Para: </span>
                                          <span className="text-xs font-semibold text-foreground">{activity.contactName}</span>
                                        </div>
                                      )}
                                      {activity.message && (
                                        <div className="bg-muted/70 p-3 rounded-lg border border-green-500/10">
                                          <p className="text-sm text-foreground leading-relaxed">
                                            {activity.message}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="envio-massa" className="mt-0">
                      <div className="mb-4 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-500">
                            Envio em Massa
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          Envie mensagens para múltiplos contatos de uma vez
                        </p>
                      </div>

                      <div className="space-y-6">
                        {/* Seleção de Contatos */}
                        <Card className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <Label className="text-base font-semibold">Contatos</Label>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAllContacts}
                                disabled={contacts.length === 0}
                              >
                                {selectedContacts.size === contacts.length ? "Desmarcar Todos" : "Selecionar Todos"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={loadContacts}
                                disabled={whatsappLoading}
                              >
                                {whatsappLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Atualizar"
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mb-3">
                            {selectedContacts.size > 0 ? (
                              <span className="text-green-500 font-semibold">
                                {selectedContacts.size} contato(s) selecionado(s)
                              </span>
                            ) : (
                              "Nenhum contato selecionado"
                            )}
                          </div>
                          <ScrollArea className="h-[200px] border rounded-lg p-3">
                            {contacts.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                                <Users className="w-12 h-12 text-muted-foreground/50 mb-2" />
                                <p className="text-sm text-muted-foreground">Nenhum contato encontrado</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Os contatos aparecerão quando houver conversas
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {contacts.map((contact) => (
                                  <div
                                    key={contact.jid}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                  >
                                    <Checkbox
                                      checked={selectedContacts.has(contact.jid)}
                                      onCheckedChange={() => handleToggleContact(contact.jid)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {contact.name || contact.jid.split("@")[0]}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {contact.jid}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        </Card>

                        {/* Mensagem */}
                        <Card className="p-4">
                          <Label htmlFor="bulk-message" className="text-base font-semibold mb-2 block">
                            Mensagem
                          </Label>
                          <Textarea
                            id="bulk-message"
                            placeholder="Digite a mensagem que será enviada para todos os contatos selecionados..."
                            value={bulkMessage}
                            onChange={(e) => setBulkMessage(e.target.value)}
                            rows={6}
                            disabled={isSendingBulk}
                            className="resize-none"
                          />
                          <div className="mt-2 flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Label htmlFor="bulk-delay" className="text-sm text-muted-foreground">
                                Delay entre envios (ms):
                              </Label>
                              <Input
                                id="bulk-delay"
                                type="number"
                                min="1000"
                                max="10000"
                                step="500"
                                value={bulkDelay}
                                onChange={(e) => setBulkDelay(Number(e.target.value))}
                                disabled={isSendingBulk}
                                className="w-24"
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {bulkMessage.length} caracteres
                            </span>
                          </div>
                        </Card>

                        {/* Progresso */}
                        {isSendingBulk && (
                          <Card className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Enviando mensagens...</span>
                                <span className="text-muted-foreground">
                                  {bulkProgress.current} / {bulkProgress.total}
                                </span>
                              </div>
                              <Progress
                                value={(bulkProgress.current / bulkProgress.total) * 100}
                                className="h-2"
                              />
                            </div>
                          </Card>
                        )}

                        {/* Resultados */}
                        {bulkResults && (
                          <Card className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Resultado do Envio</h3>
                                <div className="flex items-center gap-4">
                                  <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                                    {bulkResults.sent} enviadas
                                  </Badge>
                                  {bulkResults.failed > 0 && (
                                    <Badge variant="secondary" className="bg-red-500/20 text-red-500">
                                      {bulkResults.failed} falharam
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {bulkResults.failed > 0 && (
                                <ScrollArea className="h-[150px] border rounded-lg p-3">
                                  <div className="space-y-2">
                                    {bulkResults.results
                                      .filter((r) => !r.success)
                                      .map((result, idx) => (
                                        <div key={idx} className="text-sm text-red-500">
                                          <span className="font-medium">{result.contactName || result.contact}:</span>{" "}
                                          {result.error}
                                        </div>
                                      ))}
                                  </div>
                                </ScrollArea>
                              )}
                            </div>
                          </Card>
                        )}

                        {/* Botão de Enviar */}
                        <Button
                          onClick={handleSendBulkMessages}
                          disabled={isSendingBulk || selectedContacts.size === 0 || !bulkMessage.trim()}
                          className="w-full gap-2"
                          size="lg"
                        >
                          {isSendingBulk ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Enviar para {selectedContacts.size} contato(s)
                            </>
                          )}
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="todas" className="mt-0">
                      <div className="mb-4 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-purple-500">
                            Todas as Atividades ({activities.length})
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          Visualização completa do fluxo de automação em ordem cronológica
                        </p>
                      </div>
                      <ScrollArea className="h-[400px] pr-4">
                        {activities.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                              <Zap className="w-10 h-10 text-purple-500/50" />
                            </div>
                            <p className="text-muted-foreground font-medium mb-1">Nenhuma atividade ainda</p>
                            <p className="text-sm text-muted-foreground">
                              As atividades aparecerão aqui quando mensagens forem recebidas e respondidas
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {activities.map((activity) => (
                              <div
                                key={activity.id}
                                className={cn(
                                  "p-4 rounded-lg border-2 transition-all hover:shadow-md",
                                  activity.type === "received" && "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40",
                                  activity.type === "ai_processing" && "bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40",
                                  activity.type === "ai_generated" && "bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40",
                                  activity.type === "sent" && "bg-green-500/5 border-green-500/20 hover:border-green-500/40"
                                )}
                              >
                                <div className="flex items-start gap-4">
                                  <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                    activity.type === "received" && "bg-blue-500/20",
                                    activity.type === "ai_processing" && "bg-yellow-500/20",
                                    activity.type === "ai_generated" && "bg-purple-500/20",
                                    activity.type === "sent" && "bg-green-500/20"
                                  )}>
                                    {activity.type === "received" && (
                                      <MessageSquare className="w-6 h-6 text-blue-500" />
                                    )}
                                    {activity.type === "ai_processing" && (
                                      <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                                    )}
                                    {activity.type === "ai_generated" && (
                                      <Bot className="w-6 h-6 text-purple-500" />
                                    )}
                                    {activity.type === "sent" && (
                                      <Send className="w-6 h-6 text-green-500" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <span className={cn(
                                          "text-sm font-bold",
                                          activity.type === "received" && "text-blue-500",
                                          activity.type === "ai_processing" && "text-yellow-500",
                                          activity.type === "ai_generated" && "text-purple-500",
                                          activity.type === "sent" && "text-green-500"
                                        )}>
                                          {activity.type === "received" && "📥 Mensagem Recebida"}
                                          {activity.type === "ai_processing" && "🤖 Gerando Resposta..."}
                                          {activity.type === "ai_generated" && "✨ Resposta Gerada"}
                                          {activity.type === "sent" && "✅ Mensagem Enviada"}
                                        </span>
                                        {activity.status === "processing" && (
                                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                        )}
                                        {activity.status === "success" && (
                                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        )}
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {activity.timestamp.toLocaleTimeString("pt-BR", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          second: "2-digit"
                                        })}
                                      </span>
                                    </div>
                                    {activity.contactName && (
                                      <div className="mb-2">
                                        <span className="text-xs text-muted-foreground">
                                          {activity.type === "received" ? "De" : "Para"}: 
                                        </span>
                                        <span className="text-xs font-semibold text-foreground ml-1">
                                          {activity.contactName}
                                        </span>
                                      </div>
                                    )}
                                    {activity.message && (
                                      <div className={cn(
                                        "bg-muted/70 p-3 rounded-lg border",
                                        activity.type === "received" && "border-blue-500/10",
                                        activity.type === "ai_generated" && "border-purple-500/10",
                                        activity.type === "sent" && "border-green-500/10"
                                      )}>
                                        <p className="text-sm text-foreground leading-relaxed">
                                          {activity.message}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              </Card>
            )}

          </div>

          {/* Dialog para QR Code */}
          <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Conectar WhatsApp</DialogTitle>
                <DialogDescription>
                  Escaneie o QR Code com seu WhatsApp para conectar
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                {qrCode ? (
                  <>
                    <img src={qrCode} alt="QR Code" className="w-64 h-64 border rounded-lg" />
                    <p className="text-sm text-muted-foreground text-center">
                      1. Abra o WhatsApp no seu celular<br />
                      2. Vá em Configurações → Aparelhos conectados<br />
                      3. Toque em "Conectar um aparelho"<br />
                      4. Escaneie este QR Code
                    </p>
                  </>
                ) : (
                  <div className="w-64 h-64 border rounded-lg flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}





