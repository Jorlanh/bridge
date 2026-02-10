import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api, paymentApi, type Subscription } from "@/lib/api";
import { auth } from "@/lib/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import {
  Mail,
  User,
  Building2,
  Save,
  LogOut,
  Calendar,
  Shield,
  Edit3,
  X,
  Camera,
  Phone,
  CreditCard,
  Crown,
  Zap,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  FormFieldWrapper,
  InputWithIcon,
  FormError,
} from "@/components/auth";
import { motion } from "framer-motion";
import { format } from "date-fns";

// Funções de máscara
const maskCPF = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return value;
};

const maskPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 11) {
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }
  return value;
};

const maskCNPJ = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 14) {
    return numbers
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
  return value;
};

const profileSchema = z.object({
  name: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "O nome deve conter apenas letras e espaços"),
  company: z.string().max(200, "O nome da empresa deve ter no máximo 200 caracteres").optional(),
  companyCNPJ: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$|^$/, "CNPJ inválido. Use o formato XX.XXX.XXX/XXXX-XX")
    .optional()
    .or(z.literal("")),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$|^$/, "CPF inválido. Use o formato XXX.XXX.XXX-XX")
    .optional()
    .or(z.literal("")),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Data de nascimento inválida. Use o formato YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^[\d\s()-]+$|^$/, "Telefone inválido")
    .optional()
    .or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Função para obter iniciais do nome
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// 10 opções de avatares diferentes - dinheiro, empresa, gatinho, pessoas e outros
const AVATAR_OPTIONS = [
  // Ícone de dinheiro - Emoji de dinheiro feliz
  "https://emojicdn.elk.sh/💰?style=google",
  // Ícone de empresa - Emoji de prédio/escritório
  "https://emojicdn.elk.sh/🏢?style=google",
  // Gatinho feliz - Emoji de gato sorrindo
  "https://emojicdn.elk.sh/😸?style=google",
  // Pessoa feliz - Emoji de rosto sorrindo
  "https://emojicdn.elk.sh/😊?style=google",
  // Dinheiro voando - Emoji de dinheiro com asas
  "https://emojicdn.elk.sh/💸?style=google",
  // Gráfico subindo - Emoji de gráfico de crescimento
  "https://emojicdn.elk.sh/📈?style=google",
  // Troféu - Emoji de troféu/sucesso
  "https://emojicdn.elk.sh/🏆?style=google",
  // Estrela - Emoji de estrela brilhante
  "https://emojicdn.elk.sh/⭐?style=google",
  // Foguete - Emoji de foguete/crescimento
  "https://emojicdn.elk.sh/🚀?style=google",
  // Coração - Emoji de coração feliz
  "https://emojicdn.elk.sh/❤️?style=google",
];

export default function Profile() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      company: "",
      companyCNPJ: "",
      cpf: "",
      birthDate: "",
      phone: "",
    },
  });

  // Carregar dados do perfil
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await api.getProfile();
        if (response.success && response.user) {
          setUserData(response.user);
          // Se o avatar for uma URL relativa, construir a URL completa
          const avatarUrl = response.user.avatar 
            ? response.user.avatar.startsWith("http") 
              ? response.user.avatar 
              : `${API_URL}${response.user.avatar}`
            : null;
          setAvatarPreview(avatarUrl);
          
          // Formatar data de nascimento se existir
          const formattedBirthDate = response.user.birthDate 
            ? format(new Date(response.user.birthDate), "yyyy-MM-dd")
            : "";

          // Formatar CPF se existir
          const formattedCPF = response.user.cpf 
            ? maskCPF(response.user.cpf.replace(/\D/g, ""))
            : "";

          // Formatar telefone se existir
          const formattedPhone = response.user.phone 
            ? maskPhone(response.user.phone.replace(/\D/g, ""))
            : "";

          // Formatar CNPJ se existir
          const formattedCNPJ = response.user.companyCNPJ 
            ? maskCNPJ(response.user.companyCNPJ.replace(/\D/g, ""))
            : "";

          form.reset({
            name: response.user.name,
            company: response.user.company || "",
            companyCNPJ: formattedCNPJ,
            cpf: formattedCPF,
            birthDate: formattedBirthDate,
            phone: formattedPhone,
          });
          auth.setUser(response.user);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao carregar perfil";
        setError(errorMessage);
        toast.error(errorMessage);
        if (errorMessage.includes("Token") || errorMessage.includes("autentic")) {
          auth.logout();
          navigate("/login");
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
    loadSubscription();
  }, [form, navigate]);

  // Carregar assinatura do usuário
  const loadSubscription = async () => {
    setLoadingSubscription(true);
    try {
      const response = await paymentApi.getCurrentSubscription();
      if (response.success) {
        setSubscription(response.subscription);
      }
    } catch (error: any) {
      // Não mostrar erro se não houver assinatura
      if (!error.message?.includes("não encontrada")) {
        console.error("Erro ao carregar assinatura:", error);
      }
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    const avatarUrl = userData?.avatar 
      ? userData.avatar.startsWith("http") 
        ? userData.avatar 
        : `${API_URL}${userData.avatar}`
      : null;
    setAvatarPreview(avatarUrl);
    setSelectedAvatarUrl(null);
    
    // Formatar dados para reset
    const formattedBirthDate = userData?.birthDate 
      ? format(new Date(userData.birthDate), "yyyy-MM-dd")
      : "";

    const formattedCPF = userData?.cpf 
      ? maskCPF(userData.cpf.replace(/\D/g, ""))
      : "";

    const formattedPhone = userData?.phone 
      ? maskPhone(userData.phone.replace(/\D/g, ""))
      : "";

    const formattedCNPJ = userData?.companyCNPJ 
      ? maskCNPJ(userData.companyCNPJ.replace(/\D/g, ""))
      : "";

    form.reset({
      name: userData?.name || "",
      company: userData?.company || "",
      companyCNPJ: formattedCNPJ,
      cpf: formattedCPF,
      birthDate: formattedBirthDate,
      phone: formattedPhone,
    });
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatarUrl(avatarUrl);
    setAvatarPreview(avatarUrl);
    setShowAvatarDialog(false);
    toast.success("Avatar selecionado! Clique em 'Salvar' para confirmar.");
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Formatar CPF (remover máscara)
      const cpfFormatted = data.cpf ? data.cpf.replace(/\D/g, "") : undefined;
      
      // Formatar CNPJ (remover máscara)
      const cnpjFormatted = data.companyCNPJ ? data.companyCNPJ.replace(/\D/g, "") : undefined;
      
      // Formatar telefone (remover máscara)
      const phoneFormatted = data.phone ? data.phone.replace(/\D/g, "") : undefined;

      // Atualizar perfil (incluindo avatar se selecionado)
      const response = await api.updateProfile({
        name: data.name,
        company: data.company || undefined,
        companyCNPJ: cnpjFormatted || undefined,
        cpf: cpfFormatted || undefined,
        birthDate: data.birthDate || undefined,
        phone: phoneFormatted || undefined,
        avatar: selectedAvatarUrl || undefined,
      });

      if (response.success && response.user) {
        setUserData(response.user);
        const avatarUrl = response.user.avatar 
          ? response.user.avatar.startsWith("http") 
            ? response.user.avatar 
            : `${API_URL}${response.user.avatar}`
          : null;
        setAvatarPreview(avatarUrl);
        setSelectedAvatarUrl(null);
        auth.setUser(response.user);
        setIsEditing(false);
        toast.success("Perfil atualizado com sucesso!");
      }
    } catch (err: any) {
      // Tratar erros específicos de campo (como CPF duplicado)
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const fieldErrors = err.errors as Array<{ field: string; message: string }>;
        const cpfError = fieldErrors.find(e => e.field === "cpf");
        
        if (cpfError) {
          // Definir erro no campo CPF do formulário
          form.setError("cpf", {
            type: "manual",
            message: cpfError.message,
          });
          setError(cpfError.message);
          toast.error(cpfError.message);
        } else {
          const errorMessage = err.message || "Erro ao atualizar perfil";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar perfil";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
    toast.success("Logout realizado com sucesso!");
    navigate("/login");
  };

  const user = auth.getUser();

  if (isLoadingProfile) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar 
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader 
          title="Meu Perfil" 
          subtitle="Gerencie suas informações pessoais"
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Sidebar - Informações do Usuário */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="glass-card border-border">
                    <CardContent className="pt-4 sm:pt-6">
                      <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                        {/* Avatar com seleção */}
                        <div className="relative group">
                          <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-primary/20">
                        {avatarPreview ? (
                          <AvatarImage src={avatarPreview} alt={user?.name} />
                        ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xl sm:text-2xl font-bold text-primary">
                              {user?.name ? getInitials(user.name) : "U"}
                            </AvatarFallback>
                          </Avatar>
                          {isEditing && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              onClick={() => setShowAvatarDialog(true)}
                              className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                            >
                              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                            </motion.button>
                          )}
                        </div>
                        <div>
                          <h2 className="font-display text-lg sm:text-xl font-bold">{user?.name || "Usuário"}</h2>
                          <p className="text-xs sm:text-sm text-muted-foreground break-all">{user?.email}</p>
                          {user?.company && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {user.company}
                            </p>
                          )}
                        </div>
                      </div>

                      <Separator className="my-4 sm:my-6" />

                        {/* Informações adicionais */}
                        <div className="space-y-2 sm:space-y-3 w-full">
                          {userData?.createdAt && (
                            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-muted-foreground text-xs">Membro desde</p>
                                <p className="font-medium text-xs sm:text-sm truncate">
                                  {format(new Date(userData.createdAt), "dd/MM/yyyy")}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                            </div>
                            <div className="flex-1">
                              <p className="text-muted-foreground text-xs">Status da conta</p>
                              <p className="font-medium text-success text-xs sm:text-sm">Ativa</p>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-4 sm:my-6" />

                        {/* Plano e Assinatura */}
                        <div className="space-y-2 sm:space-y-3 w-full">
                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              {loadingSubscription ? (
                                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary animate-spin" />
                              ) : subscription?.planId === "profissional" ? (
                                <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                              ) : (
                                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-muted-foreground text-xs">Plano Atual</p>
                              {loadingSubscription ? (
                                <p className="font-medium text-xs sm:text-sm">Carregando...</p>
                              ) : subscription ? (
                                <>
                                  <p className="font-medium text-xs sm:text-sm truncate">
                                    {subscription.planName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {subscription.status === "active" && "Ativo"}
                                    {subscription.status === "pending" && "Aguardando pagamento"}
                                    {subscription.status === "cancelled" && "Cancelado"}
                                    {subscription.status === "expired" && "Expirado"}
                                    {subscription.status === "trial" && "Período de teste"}
                                  </p>
                                  {subscription.nextBillingDate && subscription.status === "active" && (
                                    <p className="text-xs text-muted-foreground">
                                      Próxima cobrança: {format(new Date(subscription.nextBillingDate), "dd/MM/yyyy")}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="font-medium text-xs sm:text-sm text-muted-foreground">
                                  Sem assinatura
                                </p>
                              )}
                            </div>
                          </div>
                          {subscription && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate("/dashboard/settings")}
                              className="w-full text-xs sm:text-sm"
                            >
                              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Gerenciar Assinatura
                            </Button>
                          )}
                          {!subscription && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => navigate("/plans")}
                              className="w-full text-xs sm:text-sm"
                            >
                              <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Ver Planos
                            </Button>
                          )}
                        </div>

                        <Separator className="my-4 sm:my-6" />

                        <Button
                          variant="outline"
                          onClick={() => setShowLogoutDialog(true)}
                          className="w-full group text-xs sm:text-sm"
                        >
                          <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-2 transition-transform group-hover:translate-x-1" />
                          Sair da conta
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

              {/* Main Form */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card className="glass-card border-border">
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                            <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="font-display text-lg sm:text-xl">Informações do Perfil</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                              {isEditing
                                ? "Edite suas informações pessoais"
                                : "Visualize suas informações pessoais"}
                            </CardDescription>
                          </div>
                        </div>
                        {!isEditing ? (
                          <Button onClick={handleEdit} variant="default" className="gap-2 text-xs sm:text-sm w-full sm:w-auto">
                            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                            Editar
                          </Button>
                        ) : (
                          <Button onClick={handleCancel} variant="outline" className="gap-2 text-xs sm:text-sm w-full sm:w-auto">
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                          {/* Email (somente leitura) */}
                          <div className="space-y-2">
                            <label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                              <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                              Email
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                              <input
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="w-full pl-9 sm:pl-11 pr-4 h-10 sm:h-12 text-xs sm:text-sm bg-muted/50 border border-input rounded-lg cursor-not-allowed opacity-60"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              O email não pode ser alterado
                            </p>
                          </div>

                          <Separator />

                      <FormFieldWrapper control={form.control} name="name" label="Nome completo">
                        {(field) => (
                          <InputWithIcon
                            icon={User}
                            type="text"
                            placeholder="Seu nome completo"
                            disabled={!isEditing}
                            readOnly={!isEditing}
                            className={!isEditing ? "bg-muted/50 cursor-not-allowed" : ""}
                            {...field}
                          />
                        )}
                      </FormFieldWrapper>

                      <FormFieldWrapper
                        control={form.control}
                        name="company"
                        label="Empresa (opcional)"
                      >
                        {(field) => (
                          <InputWithIcon
                            icon={Building2}
                            type="text"
                            placeholder="Nome da empresa"
                            disabled={!isEditing}
                            readOnly={!isEditing}
                            className={!isEditing ? "bg-muted/50 cursor-not-allowed" : ""}
                            {...field}
                          />
                        )}
                      </FormFieldWrapper>

                      <FormFieldWrapper
                        control={form.control}
                        name="companyCNPJ"
                        label="CNPJ da Empresa (opcional)"
                      >
                        {(field) => (
                          <InputWithIcon
                            icon={Building2}
                            type="text"
                            placeholder="00.000.000/0000-00"
                            disabled={!isEditing}
                            readOnly={!isEditing}
                            className={!isEditing ? "bg-muted/50 cursor-not-allowed" : ""}
                            maxLength={18}
                            {...field}
                            onChange={(e) => {
                              const masked = maskCNPJ(e.target.value);
                              field.onChange(masked);
                            }}
                          />
                        )}
                      </FormFieldWrapper>

                      <Separator />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <FormFieldWrapper
                          control={form.control}
                          name="cpf"
                          label="CPF (opcional)"
                        >
                          {(field) => (
                            <InputWithIcon
                              icon={CreditCard}
                              type="text"
                              placeholder="000.000.000-00"
                              disabled={!isEditing}
                              readOnly={!isEditing}
                              className={!isEditing ? "bg-muted/50 cursor-not-allowed" : ""}
                              maxLength={14}
                              {...field}
                              onChange={(e) => {
                                const masked = maskCPF(e.target.value);
                                field.onChange(masked);
                              }}
                            />
                          )}
                        </FormFieldWrapper>

                        <FormFieldWrapper
                          control={form.control}
                          name="birthDate"
                          label="Data de nascimento (opcional)"
                        >
                          {(field) => (
                            <InputWithIcon
                              icon={Calendar}
                              type="date"
                              placeholder="DD/MM/AAAA"
                              disabled={!isEditing}
                              readOnly={!isEditing}
                              className={!isEditing ? "bg-muted/50 cursor-not-allowed" : ""}
                              max={format(new Date(), "yyyy-MM-dd")}
                              {...field}
                            />
                          )}
                        </FormFieldWrapper>
                      </div>

                      <FormFieldWrapper
                        control={form.control}
                        name="phone"
                        label="Telefone (opcional)"
                      >
                        {(field) => (
                          <InputWithIcon
                            icon={Phone}
                            type="text"
                            placeholder="(00) 00000-0000"
                            disabled={!isEditing}
                            readOnly={!isEditing}
                            className={!isEditing ? "bg-muted/50 cursor-not-allowed" : ""}
                            maxLength={15}
                            {...field}
                            onChange={(e) => {
                              const masked = maskPhone(e.target.value);
                              field.onChange(masked);
                            }}
                          />
                        )}
                      </FormFieldWrapper>

                      <FormError message={error || ""} />

                          {isEditing && (
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                              <Button
                                type="submit"
                                className="flex-1 h-10 sm:h-12 font-semibold group text-xs sm:text-sm"
                                variant="hero"
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                                    Salvando...
                                  </>
                                ) : (
                                  <>
                                    Salvar alterações
                                    <Save className="w-3 h-3 sm:w-4 sm:h-4 ml-2 transition-transform group-hover:scale-110" />
                                  </>
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                className="h-10 sm:h-12 text-xs sm:text-sm"
                                disabled={isLoading}
                              >
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Dialog de Seleção de Avatar */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Escolher Avatar
            </DialogTitle>
            <DialogDescription>
              Selecione um avatar da galeria abaixo
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6 py-4">
            {AVATAR_OPTIONS.map((avatarUrl, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => handleAvatarSelect(avatarUrl)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-110 ${
                  selectedAvatarUrl === avatarUrl || avatarPreview === avatarUrl
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <img
                  src={avatarUrl}
                  alt={`Avatar ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {(selectedAvatarUrl === avatarUrl || avatarPreview === avatarUrl) && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-primary-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Logout */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-destructive" />
              Confirmar saída
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente para acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, sair da conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
