import { useState, useEffect } from "react";
import { socialApi, marketingApi } from "@/lib/api";
import { ptBR } from "date-fns/locale";
import { Loader2, Link2, Unlink, Facebook, Instagram, Linkedin, Info, RefreshCw, User, CheckCircle, X, Save, Bookmark, ChevronDown, ChevronUp } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { 
  Share2, 
  TrendingUp, 
  Heart, 
  MessageCircle,
  Eye,
  Calendar,
  Sparkles,
  Plus,
  Edit,
  Trash2,
  Image,
  Video,
  Link as LinkIcon,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SocialConnectionGuide } from "@/components/marketing/SocialConnectionGuide";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

export default function Social() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Estados para integrações
  const [socialConnections, setSocialConnections] = useState<any[]>([]);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any | null>(null);
  const [connectionForm, setConnectionForm] = useState({
    accountName: "",
    accountId: "",
    accessToken: "",
  });

  // Estados para posts
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [deletePostDialogOpen, setDeletePostDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postForm, setPostForm] = useState({
    content: "",
    platform: "facebook",
    scheduledDate: "",
    status: "draft" as "draft" | "scheduled" | "published",
    image: false,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Estados para gerador IA
  const [generatorForm, setGeneratorForm] = useState({
    theme: "",
    platform: "Facebook",
    tone: "Profissional",
  });
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<Array<{
    id: string;
    name: string;
    theme: string;
    platform: string;
    tone: string;
    createdAt: string;
  }>>([]);
  const [savePromptDialogOpen, setSavePromptDialogOpen] = useState(false);
  const [promptName, setPromptName] = useState("");
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    loadData();
    loadSavedPrompts();
    
    // Verificar se há parâmetros de callback OAuth na URL
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get("connected");
    const error = urlParams.get("error");
    
    if (connected) {
      toast({
        title: "Sucesso!",
        description: `${connected.charAt(0).toUpperCase() + connected.slice(1)} conectado com sucesso!`,
      });
      loadData();
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (error) {
      toast({
        title: "Erro na conexão",
        description: error === "oauth_failed" ? "Erro ao conectar. Tente novamente." : error,
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadSavedPrompts = () => {
    try {
      const saved = localStorage.getItem("social_prompts");
      if (saved) {
        setSavedPrompts(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Erro ao carregar prompts salvos:", error);
    }
  };

  const savePrompt = () => {
    if (!generatorForm.theme.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o tema do post antes de salvar",
        variant: "destructive",
      });
      return;
    }

    if (!promptName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para o prompt",
        variant: "destructive",
      });
      return;
    }

    try {
      const newPrompt = {
        id: Date.now().toString(),
        name: promptName.trim(),
        theme: generatorForm.theme,
        platform: generatorForm.platform,
        tone: generatorForm.tone,
        createdAt: new Date().toISOString(),
      };

      const updated = [...savedPrompts, newPrompt];
      setSavedPrompts(updated);
      localStorage.setItem("social_prompts", JSON.stringify(updated));
      
      toast({
        title: "Sucesso",
        description: "Prompt salvo com sucesso!",
      });
      
      setSavePromptDialogOpen(false);
      setPromptName("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar prompt",
        variant: "destructive",
      });
    }
  };

  const loadPrompt = (prompt: any) => {
    setGeneratorForm({
      theme: prompt.theme,
      platform: prompt.platform,
      tone: prompt.tone,
    });
    toast({
      title: "Prompt carregado",
      description: `Prompt "${prompt.name}" carregado com sucesso!`,
    });
  };

  const deletePrompt = (id: string) => {
    try {
      const updated = savedPrompts.filter(p => p.id !== id);
      setSavedPrompts(updated);
      localStorage.setItem("social_prompts", JSON.stringify(updated));
      toast({
        title: "Sucesso",
        description: "Prompt deletado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar prompt",
        variant: "destructive",
      });
    }
  };

  const toggleDateExpansion = (date: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  // Agrupar posts por data
  const postsByDate = scheduledPosts.reduce((acc: any, post: any) => {
    if (!post.scheduledDate) return acc;
    const date = new Date(post.scheduledDate).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(post);
    return acc;
  }, {});

  // Processar dados para gráfico de performance
  const processChartData = () => {
    // Agrupar posts publicados por data (últimos 30 dias)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filtrar posts dos últimos 30 dias
    const recentPosts = publishedPosts.filter((post: any) => {
      if (!post.publishedDate) return false;
      const postDate = new Date(post.publishedDate);
      return postDate >= thirtyDaysAgo;
    });

    // Agrupar por data
    const postsByDate: Record<string, any[]> = {};
    recentPosts.forEach((post: any) => {
      const date = new Date(post.publishedDate).toISOString().split('T')[0];
      if (!postsByDate[date]) postsByDate[date] = [];
      postsByDate[date].push(post);
    });

    // Criar array de dados para o gráfico
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayPosts = postsByDate[dateStr] || [];

      const dayData = {
        date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        fullDate: dateStr,
        posts: dayPosts.length,
        likes: dayPosts.reduce((sum, p) => sum + (p.engagement?.likes || 0), 0),
        comments: dayPosts.reduce((sum, p) => sum + (p.engagement?.comments || 0), 0),
        shares: dayPosts.reduce((sum, p) => sum + (p.engagement?.shares || 0), 0),
        views: dayPosts.reduce((sum, p) => sum + (p.engagement?.views || 0), 0),
        engagement: dayPosts.reduce((sum, p) => {
          const eng = p.engagement || {};
          return sum + (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0);
        }, 0),
      };

      chartData.push(dayData);
    }

    return chartData;
  };

  // Dados por plataforma
  const platformData = publishedPosts.reduce((acc: any, post: any) => {
    const platform = post.platform || "outros";
    if (!acc[platform]) {
      acc[platform] = {
        platform,
        posts: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        engagement: 0,
      };
    }
    acc[platform].posts += 1;
    const eng = post.engagement || {};
    acc[platform].likes += eng.likes || 0;
    acc[platform].comments += eng.comments || 0;
    acc[platform].shares += eng.shares || 0;
    acc[platform].views += eng.views || 0;
    acc[platform].engagement += (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0);
    return acc;
  }, {});

  const platformChartData = Object.values(platformData);

  const performanceChartData = processChartData();

  // Obter datas com posts para o calendário (normalizar para evitar problemas de timezone)
  const datesWithPosts = Object.keys(postsByDate).map(date => {
    // Criar data no timezone local para evitar problemas de comparação
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [postsResult, statsResult, connectionsResult] = await Promise.all([
        socialApi.getPosts().catch(() => ({ success: false, posts: [] })),
        socialApi.getStats().catch(() => ({ success: false, stats: null })),
        marketingApi.getSocialConnections().catch(() => ({ success: false, connections: [] })),
      ]);

      if (postsResult.success) {
        const posts = postsResult.posts || [];
        setScheduledPosts(posts.filter((p: any) => p.status === "scheduled" || p.status === "draft"));
        setPublishedPosts(posts.filter((p: any) => p.status === "published"));
      }
      if (statsResult.success) setStats(statsResult.stats);
      if (connectionsResult.success) setSocialConnections(connectionsResult.connections);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPostModal = (post?: any) => {
    if (post) {
      setSelectedPost(post);
      setPostForm({
        content: post.content,
        platform: post.platform,
        scheduledDate: post.scheduledDate ? new Date(post.scheduledDate).toISOString().slice(0, 16) : "",
        status: post.status,
        image: post.image || false,
      });
      setImagePreview(post.imageUrl ? `${import.meta.env.VITE_API_URL || "http://localhost:3001"}${post.imageUrl}` : null);
      setSelectedImage(null);
    } else {
      setSelectedPost(null);
      setPostForm({
        content: "",
        platform: "facebook",
        scheduledDate: "",
        status: "draft",
        image: false,
      });
      setImagePreview(null);
      setSelectedImage(null);
    }
    setPostModalOpen(true);
  };

  const handleClosePostModal = () => {
    setPostModalOpen(false);
    setSelectedPost(null);
    setPostForm({
      content: "",
      platform: "facebook",
      scheduledDate: "",
      status: "draft",
      image: false,
    });
    setImagePreview(null);
    setSelectedImage(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setPostForm({ ...postForm, image: true });
    }
  };

  const handleSubmitPost = async () => {
    if (!postForm.content.trim()) {
      toast({
        title: "Erro",
        description: "O conteúdo do post é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const data = {
        content: postForm.content,
        platform: postForm.platform,
        status: postForm.status,
        image: postForm.image || !!selectedImage || !!imagePreview,
        scheduledDate: postForm.scheduledDate ? new Date(postForm.scheduledDate).toISOString() : undefined,
      };

      if (selectedPost) {
        await socialApi.updatePost(selectedPost.id, data, selectedImage || undefined);
        toast({
          title: "Sucesso",
          description: "Post atualizado com sucesso!",
        });
      } else {
        await socialApi.createPost(data, selectedImage || undefined);
        toast({
          title: "Sucesso",
          description: "Post criado com sucesso!",
        });
      }

      handleClosePostModal();
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar post",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    
    try {
      await socialApi.deletePost(selectedPost.id);
      toast({
        title: "Sucesso",
        description: "Post deletado com sucesso!",
      });
      setDeletePostDialogOpen(false);
      setSelectedPost(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar post",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePost = async () => {
    if (!generatorForm.theme.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o tema do post",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratedContent("");
      
      const result = await socialApi.generatePost(
        generatorForm.theme,
        generatorForm.platform,
        generatorForm.tone
      );

      if (result.success && result.content) {
        setGeneratedContent(result.content);
        toast({
          title: "Sucesso",
          description: "Post gerado com sucesso!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar post",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseGeneratedContent = () => {
    if (generatedContent) {
      setPostForm({
        ...postForm,
        content: generatedContent,
        platform: generatorForm.platform.toLowerCase() as any,
      });
      setGeneratedContent("");
      setPostModalOpen(true);
    }
  };

  const handlePublishPost = async (post: any) => {
    const connection = socialConnections.find(conn => conn.platform === post.platform);
    if (!connection) {
      toast({
        title: "Erro",
        description: `Conecte sua conta do ${post.platform} primeiro para publicar`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPublishing(true);
      const imageUrl = post.imageUrl ? `${import.meta.env.VITE_API_URL || "http://localhost:3001"}${post.imageUrl}` : undefined;
      const result = await marketingApi.publishPost(post.content, post.platform, post.id, imageUrl);
      
      if (result.success) {
        // Atualizar status do post para publicado
        await socialApi.updatePost(post.id, { status: "published" });
        toast({
          title: "Sucesso!",
          description: result.message || "Post publicado com sucesso!",
        });
        await loadData();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao publicar post",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar 
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader 
          title="Marketing & Redes Sociais" 
          subtitle="Automação de marketing digital, criação de conteúdo com IA e gestão de redes sociais"
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Integrações - Compacta no Topo */}
          {showGuide ? (
            <Card className="p-6 glass-card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Guia de Conexão</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowGuide(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <SocialConnectionGuide onClose={() => setShowGuide(false)} />
            </Card>
          ) : (
            <Card className="p-4 glass-card mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Integrações</h3>
                  {socialConnections.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {socialConnections.length} conectada{socialConnections.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowGuide(true)}>
                  <Info className="w-3 h-3 mr-1" />
                  <span className="text-xs">Guia</span>
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { 
                    id: "facebook", 
                    name: "Facebook", 
                    icon: Facebook, 
                    color: "text-blue-600",
                    bgColor: "bg-blue-600/10"
                  },
                  { 
                    id: "instagram", 
                    name: "Instagram", 
                    icon: Instagram, 
                    color: "text-pink-600",
                    bgColor: "bg-pink-600/10"
                  },
                  { 
                    id: "linkedin", 
                    name: "LinkedIn", 
                    icon: Linkedin, 
                    color: "text-blue-700",
                    bgColor: "bg-blue-700/10"
                  },
                ].map((platform) => {
                  const Icon = platform.icon;
                  const isConnected = socialConnections.some(conn => conn.platform === platform.id);
                  const connection = socialConnections.find(conn => conn.platform === platform.id);

                  return (
                    <div
                      key={platform.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer",
                        isConnected 
                          ? "bg-success/10 border-success/30 hover:bg-success/20" 
                          : "bg-muted/50 border-border hover:bg-muted"
                      )}
                      onClick={async () => {
                        if (isConnected && connection) {
                          // Mostrar detalhes da conta conectada
                          setSelectedConnection(connection);
                        } else {
                          try {
                            setIsConnecting(true);
                            const oauthResult = await marketingApi.startOAuthFlow(platform.id);
                            
                            if (oauthResult.success && oauthResult.authUrl) {
                              const width = 600;
                              const height = 700;
                              const left = (window.screen.width - width) / 2;
                              const top = (window.screen.height - height) / 2;
                              
                              const popup = window.open(
                                oauthResult.authUrl,
                                'OAuth',
                                `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
                              );

                              if (!popup) {
                                throw new Error("Popup bloqueado. Por favor, permita popups para este site.");
                              }

                              const checkPopup = setInterval(() => {
                                if (popup.closed) {
                                  clearInterval(checkPopup);
                                  setIsConnecting(false);
                                  loadData();
                                }
                              }, 500);

                              const messageListener = (event: MessageEvent) => {
                                if (event.origin !== window.location.origin) return;
                                
                                if (event.data.type === 'OAUTH_SUCCESS') {
                                  clearInterval(checkPopup);
                                  if (!popup.closed) popup.close();
                                  window.removeEventListener('message', messageListener);
                                  setIsConnecting(false);
                                  toast({
                                    title: "Sucesso!",
                                    description: `${platform.name} conectado!`,
                                  });
                                  loadData();
                                } else if (event.data.type === 'OAUTH_ERROR') {
                                  clearInterval(checkPopup);
                                  if (!popup.closed) popup.close();
                                  window.removeEventListener('message', messageListener);
                                  setIsConnecting(false);
                                  toast({
                                    title: "Erro",
                                    description: event.data.message || "Erro ao conectar",
                                    variant: "destructive",
                                  });
                                }
                              };

                              window.addEventListener('message', messageListener);

                              setTimeout(() => {
                                if (!popup.closed) {
                                  clearInterval(checkPopup);
                                  popup.close();
                                  window.removeEventListener('message', messageListener);
                                  setIsConnecting(false);
                                  toast({
                                    title: "Timeout",
                                    description: "Tempo de conexão expirado.",
                                    variant: "destructive",
                                  });
                                }
                              }, 300000);
                            } else {
                              setIsConnecting(false);
                              setSelectedPlatform(platform.id);
                              setConnectionForm({
                                accountName: "",
                                accountId: "",
                                accessToken: "",
                              });
                              setConnectModalOpen(true);
                            }
                          } catch (error: any) {
                            setIsConnecting(false);
                            if (error.message?.includes("OAuth") || error.message?.includes("configurado")) {
                              toast({
                                title: "OAuth não configurado",
                                description: "Usando método manual.",
                                variant: "default",
                              });
                            } else {
                              toast({
                                title: "Erro",
                                description: error.message || "Erro ao iniciar conexão",
                                variant: "destructive",
                              });
                            }
                            setSelectedPlatform(platform.id);
                            setConnectionForm({
                              accountName: "",
                              accountId: "",
                              accessToken: "",
                            });
                            setConnectModalOpen(true);
                          }
                        }
                      }}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        platform.bgColor
                      )}>
                        <Icon className={cn("w-4 h-4", platform.color)} />
                      </div>
                      <span className="text-xs font-medium">{platform.name}</span>
                      {isConnected ? (
                        <CheckCircle className="w-3 h-3 text-success" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Card de Detalhes da Conexão */}
          {selectedConnection && (
            <Card className="p-4 glass-card mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {selectedConnection.platform === "facebook" && (
                    <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  {selectedConnection.platform === "instagram" && (
                    <div className="w-10 h-10 rounded-full bg-pink-600/10 flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-pink-600" />
                    </div>
                  )}
                  {selectedConnection.platform === "linkedin" && (
                    <div className="w-10 h-10 rounded-full bg-blue-700/10 flex items-center justify-center">
                      <Linkedin className="w-5 h-5 text-blue-700" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-sm">{selectedConnection.accountName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedConnection.platform === "facebook" && "Facebook"}
                      {selectedConnection.platform === "instagram" && "Instagram"}
                      {selectedConnection.platform === "linkedin" && "LinkedIn"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedConnection(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {selectedConnection.accountId && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ID da Conta</p>
                    <p className="text-sm font-medium">{selectedConnection.accountId}</p>
                  </div>
                )}
                {selectedConnection.username && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Username</p>
                    <p className="text-sm font-medium">@{selectedConnection.username}</p>
                  </div>
                )}
                {selectedConnection.followersCount !== null && selectedConnection.followersCount !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Seguidores</p>
                    <p className="text-sm font-medium">
                      {selectedConnection.followersCount >= 1000 
                        ? `${(selectedConnection.followersCount / 1000).toFixed(1)}k`
                        : selectedConnection.followersCount.toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedConnection.createdAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Conectado em</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedConnection.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                )}
              </div>

              {selectedConnection.profilePicture && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Foto do Perfil</p>
                  <img
                    src={selectedConnection.profilePicture}
                    alt={selectedConnection.accountName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await marketingApi.syncProfileInfo(selectedConnection.platform);
                      toast({
                        title: "Sucesso",
                        description: "Informações sincronizadas!",
                      });
                      loadData();
                      // Atualizar conexão selecionada
                      const updated = await marketingApi.getSocialConnections();
                      if (updated.success) {
                        const updatedConn = updated.connections.find((c: any) => c.id === selectedConnection.id);
                        if (updatedConn) setSelectedConnection(updatedConn);
                      }
                    } catch (error: any) {
                      toast({
                        title: "Erro",
                        description: error.message || "Erro ao sincronizar",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Sincronizar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await marketingApi.disconnectSocial(selectedConnection.platform);
                      toast({
                        title: "Sucesso",
                        description: "Rede social desconectada!",
                      });
                      setSelectedConnection(null);
                      loadData();
                    } catch (error: any) {
                      toast({
                        title: "Erro",
                        description: error.message || "Erro ao desconectar",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Unlink className="w-3 h-3 mr-1" />
                  Desconectar
                </Button>
              </div>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Posts Agendados"
              value={scheduledPosts.filter(p => p.status === "scheduled").length.toString()}
              change={stats?.newPosts ? `+${stats.newPosts} esta semana` : "Carregando..."}
              changeType="positive"
              icon={Calendar}
            />
            <StatCard
              title="Engajamento Total"
              value={stats?.totalEngagement ? `${(stats.totalEngagement / 1000).toFixed(1)}K` : "0"}
              change={stats?.engagementChange ? `${stats.engagementChange > 0 ? '+' : ''}${stats.engagementChange}% vs mês anterior` : "Sem dados"}
              changeType={stats?.engagementChange > 0 ? "positive" : "negative"}
              icon={Heart}
            />
            <StatCard
              title="Alcance Médio"
              value={stats?.averageReach ? `${(stats.averageReach / 1000).toFixed(1)}K` : "0"}
              change={stats?.reachChange ? `${stats.reachChange > 0 ? '+' : ''}${stats.reachChange}% vs mês anterior` : "Sem dados"}
              changeType={stats?.reachChange > 0 ? "positive" : "negative"}
              icon={Eye}
            />
            <StatCard
              title="Taxa de Crescimento"
              value={stats?.growthRate ? `+${stats.growthRate}%` : "0%"}
              change={stats?.growthChange ? `${stats.growthChange > 0 ? '+' : ''}${stats.growthChange}% vs mês anterior` : "Sem dados"}
              changeType={stats?.growthChange > 0 ? "positive" : "negative"}
              icon={TrendingUp}
            />
          </div>

          {/* Main Content */}
          <Tabs defaultValue="generator" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generator">
                <Sparkles className="w-4 h-4 mr-2" />
                Marketing com IA
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <Calendar className="w-4 h-4 mr-2" />
                Calendário Editorial
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Métricas & Analytics
              </TabsTrigger>
            </TabsList>

            {/* Marketing com IA */}
            <TabsContent value="generator" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="font-display font-bold text-2xl">Criação de Conteúdo com IA</h2>
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      Marketing Digital
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">Gere posts profissionais para suas redes sociais usando inteligência artificial. Otimize seu marketing digital com conteúdo de alta qualidade.</p>
                </div>
              </div>

              {/* Prompts Salvos */}
              {savedPrompts.length > 0 && (
                <Card className="p-4 glass-card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Bookmark className="w-4 h-4" />
                      Prompts Salvos
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {savedPrompts.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {savedPrompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => loadPrompt(prompt)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm truncate flex-1">{prompt.name}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePrompt(prompt.id);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{prompt.theme}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {prompt.platform}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {prompt.tone}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 glass-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Criar Novo Post</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!generatorForm.theme.trim()) {
                          toast({
                            title: "Erro",
                            description: "Preencha o tema do post antes de salvar",
                            variant: "destructive",
                          });
                          return;
                        }
                        setSavePromptDialogOpen(true);
                      }}
                      disabled={!generatorForm.theme.trim()}
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Salvar Prompt
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Plataforma</Label>
                      <Select 
                        value={generatorForm.platform} 
                        onValueChange={(value) => setGeneratorForm({ ...generatorForm, platform: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Tema do Post</Label>
                      <Textarea
                        placeholder="Ex: Dicas de IA para negócios, como melhorar produtividade..."
                        value={generatorForm.theme}
                        onChange={(e) => setGeneratorForm({ ...generatorForm, theme: e.target.value })}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Tom</Label>
                      <Select 
                        value={generatorForm.tone} 
                        onValueChange={(value) => setGeneratorForm({ ...generatorForm, tone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Profissional">Profissional</SelectItem>
                          <SelectItem value="Descontraído">Descontraído</SelectItem>
                          <SelectItem value="Inspirador">Inspirador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="w-full gap-2" 
                      onClick={handleGeneratePost}
                      disabled={isGenerating || !generatorForm.theme.trim()}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Gerar Post com IA
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 glass-card">
                  <h3 className="font-semibold mb-4">Post Gerado</h3>
                  <div className="space-y-4">
                    {generatedContent ? (
                      <>
                        <div className="p-4 rounded-xl bg-muted/50 min-h-[200px] max-h-[300px] overflow-y-auto">
                          <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              setPostForm({
                                content: generatedContent,
                                platform: generatorForm.platform.toLowerCase() as any,
                                scheduledDate: "",
                                status: "draft",
                                image: false,
                              });
                              setGeneratedContent("");
                              setPostModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar e Salvar
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              setPostForm({
                                content: generatedContent,
                                platform: generatorForm.platform.toLowerCase() as any,
                                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
                                status: "scheduled",
                                image: false,
                              });
                              setGeneratedContent("");
                              setPostModalOpen(true);
                            }}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Agendar
                          </Button>
                          <Button 
                            className="flex-1"
                            onClick={async () => {
                              const connection = socialConnections.find(
                                conn => conn.platform === generatorForm.platform.toLowerCase()
                              );
                              if (!connection) {
                                toast({
                                  title: "Erro",
                                  description: `Conecte sua conta do ${generatorForm.platform} primeiro`,
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              try {
                                setIsPublishing(true);
                                const result = await marketingApi.publishPost(
                                  generatedContent, 
                                  generatorForm.platform.toLowerCase() as any
                                );
                                
                                if (result.success) {
                                  // Salvar como post publicado
                                  await socialApi.createPost({
                                    content: generatedContent,
                                    platform: generatorForm.platform.toLowerCase(),
                                    status: "published",
                                  });
                                  toast({
                                    title: "Sucesso!",
                                    description: result.message || "Post publicado com sucesso!",
                                  });
                                  setGeneratedContent("");
                                  loadData();
                                }
                              } catch (error: any) {
                                toast({
                                  title: "Erro",
                                  description: error.message || "Erro ao publicar post",
                                  variant: "destructive",
                                });
                              } finally {
                                setIsPublishing(false);
                              }
                            }}
                            disabled={isPublishing}
                          >
                            {isPublishing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Publicando...
                              </>
                            ) : (
                              <>
                                <Share2 className="w-4 h-4 mr-2" />
                                Publicar
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 rounded-xl bg-muted/50 min-h-[200px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Clique em "Gerar Post com IA" para criar conteúdo</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Calendário Editorial */}
            <TabsContent value="calendar" className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-display font-bold text-2xl">Calendário Editorial</h2>
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    Planejamento
                  </Badge>
                </div>
                <p className="text-muted-foreground">Planeje e gerencie sua estratégia de marketing nas redes sociais. Visualize todos os posts agendados organizados por mês e mantenha sua presença digital organizada.</p>
              </div>

              <div className="space-y-6">
                {isLoading ? (
                  <Card className="p-6 glass-card flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </Card>
                ) : scheduledPosts.length === 0 ? (
                  <Card className="p-6 glass-card text-center">
                    <p className="text-muted-foreground">Nenhum evento no calendário</p>
                  </Card>
                ) : (
                  // Agrupar posts por mês
                  Object.entries(
                    scheduledPosts.reduce((acc: any, post: any) => {
                      if (!post.scheduledDate) return acc;
                      const postDate = new Date(post.scheduledDate);
                      const monthKey = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}`;
                      const monthName = postDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
                      
                      if (!acc[monthKey]) {
                        acc[monthKey] = {
                          monthKey,
                          monthName,
                          year: postDate.getFullYear(),
                          month: postDate.getMonth(),
                          posts: [],
                        };
                      }
                      acc[monthKey].posts.push(post);
                      return acc;
                    }, {})
                  )
                  .sort(([a], [b]) => {
                    // Ordenar por data (mais recente primeiro)
                    const dateA = new Date(a + "-01");
                    const dateB = new Date(b + "-01");
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map(([monthKey, monthData]: [string, any]) => {
                    // Agrupar posts do mês por data
                    const postsByDate = monthData.posts.reduce((acc: any, post: any) => {
                      const date = new Date(post.scheduledDate).toISOString().split('T')[0];
                      if (!acc[date]) acc[date] = { date, posts: [], platforms: [] };
                      acc[date].posts.push(post);
                      if (!acc[date].platforms.includes(post.platform)) {
                        acc[date].platforms.push(post.platform);
                      }
                      return acc;
                    }, {});

                    return (
                      <Card key={monthKey} className="p-6 glass-card">
                        <div className="mb-4 pb-4 border-b border-border">
                          <h3 className="text-xl font-semibold capitalize">
                            {monthData.monthName}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {monthData.posts.length} post{monthData.posts.length > 1 ? 's' : ''} agendado{monthData.posts.length > 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(postsByDate)
                            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                            .map(([date, event]: [string, any]) => {
                              const isExpanded = expandedDates.has(date);
                              return (
                                <Card key={date} className="p-4 glass-card-hover">
                                  <div className="flex items-start gap-3 mb-3">
                                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex flex-col items-center justify-center flex-shrink-0">
                                      <div className="text-xl font-bold">{new Date(event.date).getDate()}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {new Date(event.date).toLocaleDateString("pt-BR", { month: "short" })}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="mb-2">
                                        <span className="font-semibold text-sm">{event.posts.length} post{event.posts.length > 1 ? 's' : ''} agendado{event.posts.length > 1 ? 's' : ''}</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mb-2">
                                        {new Date(event.date).toLocaleDateString("pt-BR", { 
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric"
                                        })}
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {event.platforms.map((platform: string) => (
                                          <Badge key={platform} variant="outline" className="capitalize text-xs">{platform}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2"
                                    onClick={() => toggleDateExpansion(date)}
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-4 h-4" />
                                        Ocultar Detalhes
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-4 h-4" />
                                        Ver Detalhes
                                      </>
                                    )}
                                  </Button>
                                  
                                  {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-border">
                                      <div className="space-y-3">
                                        {event.posts.map((post: any) => (
                                          <Card 
                                            key={post.id} 
                                            className="p-3 glass-card-hover"
                                          >
                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="outline" className="capitalize text-xs">{post.platform}</Badge>
                                                <Badge 
                                                  variant={post.status === "scheduled" ? "default" : "secondary"}
                                                  className="text-xs"
                                                >
                                                  {post.status === "scheduled" ? "Agendado" : "Rascunho"}
                                                </Badge>
                                                {post.image && (
                                                  <Badge variant="outline" className="gap-1 text-xs">
                                                    <Image className="w-3 h-3" />
                                                    Imagem
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                            <div className="mb-2">
                                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                  {new Date(post.scheduledDate).toLocaleTimeString("pt-BR", {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                  })}
                                                </span>
                                              </div>
                                              <p className="text-xs text-foreground line-clamp-3">{post.content}</p>
                                            </div>
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              className="w-full text-xs"
                                              onClick={() => handleOpenPostModal(post)}
                                            >
                                              <Edit className="w-3 h-3 mr-1" />
                                              Editar
                                            </Button>
                                          </Card>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </Card>
                              );
                            })}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Métricas & Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="font-display font-bold text-2xl">Métricas de Marketing</h2>
                    <Badge variant="secondary" className="gap-1">
                      <BarChart3 className="w-3 h-3" />
                      Analytics
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">Acompanhe o desempenho da sua estratégia de marketing digital. Analise engajamento, alcance e crescimento das suas redes sociais.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {isLoading ? (
                  <Card className="p-6 glass-card flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </Card>
                ) : publishedPosts.length === 0 ? (
                  <Card className="p-6 glass-card text-center">
                    <p className="text-muted-foreground">Nenhum post publicado encontrado</p>
                  </Card>
                ) : (
                  publishedPosts.map((post) => (
                    <Card key={post.id} className="p-6 glass-card">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold mb-1">{post.platform}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                        </div>
                        <Badge variant="outline">
                          {post.publishedDate ? new Date(post.publishedDate).toLocaleDateString("pt-BR") : "N/A"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <Heart className="w-5 h-5 mx-auto mb-1 text-red-500" />
                          <div className="text-lg font-bold">{post.engagement?.likes || 0}</div>
                          <div className="text-xs text-muted-foreground">Curtidas</div>
                        </div>
                        <div className="text-center">
                          <MessageCircle className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                          <div className="text-lg font-bold">{post.engagement?.comments || 0}</div>
                          <div className="text-xs text-muted-foreground">Comentários</div>
                        </div>
                        <div className="text-center">
                          <Share2 className="w-5 h-5 mx-auto mb-1 text-green-500" />
                          <div className="text-lg font-bold">{post.engagement?.shares || 0}</div>
                          <div className="text-xs text-muted-foreground">Compartilhamentos</div>
                        </div>
                        <div className="text-center">
                          <Eye className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                          <div className="text-lg font-bold">{post.engagement?.views || 0}</div>
                          <div className="text-xs text-muted-foreground">Visualizações</div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Gráfico de Engajamento ao Longo do Tempo */}
                <Card className="p-6 glass-card">
                  <div className="mb-4">
                    <h3 className="font-semibold mb-1">Engajamento ao Longo do Tempo</h3>
                    <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
                  </div>
                  {performanceChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={performanceChartData}>
                        <defs>
                          <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="engagement" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1}
                          fill="url(#colorEngagement)"
                          name="Engajamento"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum dado disponível</p>
                        <p className="text-xs mt-1">Publique posts para ver as métricas</p>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Gráfico por Plataforma */}
                <Card className="p-6 glass-card">
                  <div className="mb-4">
                    <h3 className="font-semibold mb-1">Performance por Plataforma</h3>
                    <p className="text-sm text-muted-foreground">Distribuição de engajamento</p>
                  </div>
                  {platformChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={platformChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="platform" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="likes" 
                          fill="hsl(var(--destructive))" 
                          name="Curtidas"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="comments" 
                          fill="hsl(var(--primary))" 
                          name="Comentários"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="shares" 
                          fill="#22c55e" 
                          name="Compartilhamentos"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum dado disponível</p>
                        <p className="text-xs mt-1">Publique posts para ver as métricas</p>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Gráfico Detalhado de Engajamento */}
              <Card className="p-6 glass-card">
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">Detalhamento de Engajamento</h3>
                  <p className="text-sm text-muted-foreground">Curtidas, comentários e compartilhamentos - Últimos 30 dias</p>
                </div>
                {performanceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={performanceChartData}>
                      <defs>
                        <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="likes" 
                        stroke="#ef4444" 
                        fillOpacity={1}
                        fill="url(#colorLikes)"
                        name="Curtidas"
                        stackId="1"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="comments" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1}
                        fill="url(#colorComments)"
                        name="Comentários"
                        stackId="1"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="shares" 
                        stroke="#22c55e" 
                        fillOpacity={1}
                        fill="url(#colorShares)"
                        name="Compartilhamentos"
                        stackId="1"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum dado disponível</p>
                      <p className="text-xs mt-1">Publique posts para ver as métricas</p>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

          </Tabs>

          {/* Modal de Criar/Editar Post */}
          <Dialog open={postModalOpen} onOpenChange={setPostModalOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{selectedPost ? "Editar Post" : "Novo Post"}</DialogTitle>
                <DialogDescription>
                  {selectedPost ? "Atualize o conteúdo do post" : "Crie um novo post para suas redes sociais"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Plataforma</Label>
                  <Select 
                    value={postForm.platform} 
                    onValueChange={(value) => setPostForm({ ...postForm, platform: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo do Post</Label>
                  <Textarea
                    id="content"
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                    placeholder="Digite o conteúdo do post..."
                    rows={6}
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={postForm.status} 
                      onValueChange={(value: any) => setPostForm({ ...postForm, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="scheduled">Agendado</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">
                      {postForm.status === "scheduled" ? "Data e Hora de Publicação" : "Agendar para (opcional)"}
                    </Label>
                    <Input
                      id="scheduledDate"
                      type="datetime-local"
                      value={postForm.scheduledDate}
                      onChange={(e) => setPostForm({ ...postForm, scheduledDate: e.target.value })}
                      disabled={postForm.status !== "scheduled"}
                    />
                  </div>
                </div>
                {/* Upload e Preview de Imagem */}
                <div className="space-y-2">
                  <Label htmlFor="image">Imagem do Post (opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="flex-1"
                    />
                    {imagePreview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImagePreview(null);
                          setSelectedImage(null);
                          setPostForm({ ...postForm, image: false });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="mt-2 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-auto max-h-64 object-contain rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleClosePostModal} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmitPost} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    selectedPost ? "Atualizar" : "Salvar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog de Confirmação de Exclusão */}
          <AlertDialog open={deletePostDialogOpen} onOpenChange={setDeletePostDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja deletar este post? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground">
                  Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Dialog de Salvar Prompt */}
          <Dialog open={savePromptDialogOpen} onOpenChange={setSavePromptDialogOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Salvar Prompt</DialogTitle>
                <DialogDescription>
                  Dê um nome para este prompt e salve para usar depois
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="promptName">Nome do Prompt</Label>
                  <Input
                    id="promptName"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    placeholder="Ex: Dicas de IA para LinkedIn"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && promptName.trim()) {
                        savePrompt();
                      }
                    }}
                  />
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Preview do prompt:</p>
                  <p className="text-sm font-medium mb-1">{generatorForm.platform} - {generatorForm.tone}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{generatorForm.theme}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setSavePromptDialogOpen(false);
                  setPromptName("");
                }}>
                  Cancelar
                </Button>
                <Button onClick={savePrompt} disabled={!promptName.trim()}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de Conexão Manual */}
          <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Conectar {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}</DialogTitle>
                <DialogDescription>
                  Preencha as informações abaixo para conectar sua conta manualmente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">Método Manual</p>
                      <p className="text-xs text-muted-foreground">
                        Se o método automático (OAuth) não estiver configurado, você pode conectar manualmente 
                        inserindo suas credenciais. Para conexão automática, configure as variáveis de ambiente 
                        OAuth no servidor.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Nome da Conta</Label>
                  <Input
                    id="accountName"
                    value={connectionForm.accountName}
                    onChange={(e) => setConnectionForm({ ...connectionForm, accountName: e.target.value })}
                    placeholder="Ex: Minha Empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountId">ID da Conta</Label>
                  <Input
                    id="accountId"
                    value={connectionForm.accountId}
                    onChange={(e) => setConnectionForm({ ...connectionForm, accountId: e.target.value })}
                    placeholder="ID da conta ou página"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Token de Acesso</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={connectionForm.accessToken}
                    onChange={(e) => setConnectionForm({ ...connectionForm, accessToken: e.target.value })}
                    placeholder="Token de acesso OAuth"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConnectModalOpen(false)} disabled={isConnecting}>
                  Cancelar
                </Button>
                <Button 
                  onClick={async () => {
                    if (!connectionForm.accountName || !connectionForm.accountId || !connectionForm.accessToken) {
                      toast({
                        title: "Erro",
                        description: "Preencha todos os campos",
                        variant: "destructive",
                      });
                      return;
                    }

                    try {
                      setIsConnecting(true);
                      await marketingApi.connectSocial({
                        platform: selectedPlatform as any,
                        accountName: connectionForm.accountName,
                        accountId: connectionForm.accountId,
                        accessToken: connectionForm.accessToken,
                      });
                      toast({
                        title: "Sucesso",
                        description: `${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} conectado com sucesso!`,
                      });
                      setConnectModalOpen(false);
                      loadData();
                    } catch (error: any) {
                      toast({
                        title: "Erro",
                        description: error.message || "Erro ao conectar rede social",
                        variant: "destructive",
                      });
                    } finally {
                      setIsConnecting(false);
                    }
                  }}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Conectar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}





