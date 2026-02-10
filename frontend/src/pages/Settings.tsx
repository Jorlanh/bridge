import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Lock, 
  Trash2, 
  Eye, 
  EyeOff,
  AlertTriangle,
  Shield,
  Key,
  Smartphone,
  Mail,
  Clock,
  Moon,
  Sun,
  Monitor,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("security");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    enabled: true,
    channels: {
      inApp: true,
      push: true,
      email: false,
    },
    types: {
      marketing: true,
      sales: true,
      support: true,
      social: true,
      processes: true,
      academy: true,
      system: true,
    },
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00",
    },
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [autoSave, setAutoSave] = useState(() => {
    const saved = localStorage.getItem("autoSave");
    return saved ? JSON.parse(saved) : true;
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === "notifications") {
      loadNotificationPreferences();
    }
  }, [activeTab]);

  const loadNotificationPreferences = async () => {
    try {
      setPreferencesLoading(true);
      const result = await api.getNotificationPreferences();
      if (result.success) {
        setNotificationPreferences(result.preferences);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar preferências",
        variant: "destructive",
      });
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      const result = await api.updateNotificationPreferences(notificationPreferences);
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Preferências de notificações salvas com sucesso",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar preferências",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter no mínimo 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        toast({
          title: "Sucesso",
          description: "Senha alterada com sucesso",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao alterar senha",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "EXCLUIR") {
      toast({
        title: "Erro",
        description: 'Digite "EXCLUIR" para confirmar',
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.deleteAccount();

      if (response.success) {
        toast({
          title: "Conta excluída",
          description: "Sua conta foi excluída com sucesso",
        });
        auth.logout();
        navigate("/login");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir conta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          title="Configurações" 
          subtitle="Gerencie suas configurações e preferências"
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Configurações Gerais */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <SettingsIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl">Configurações Gerais</h2>
                <p className="text-sm text-muted-foreground">Personalize a aparência e comportamento do sistema</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Tema */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 flex-1">
                  {theme === "dark" ? (
                    <Moon className="w-5 h-5 text-primary" />
                  ) : theme === "light" ? (
                    <Sun className="w-5 h-5 text-primary" />
                  ) : (
                    <Monitor className="w-5 h-5 text-primary" />
                  )}
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Tema do Sistema</Label>
                    <p className="text-xs text-muted-foreground">
                      Escolha entre modo claro, escuro ou seguir as preferências do sistema
                    </p>
                  </div>
                </div>
                <Select value={theme || "system"} onValueChange={(value) => setTheme(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        <span>Claro</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        <span>Escuro</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        <span>Sistema</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Salvamento Automático */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 flex-1">
                  <Save className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Salvamento Automático</Label>
                    <p className="text-xs text-muted-foreground">
                      Salvar automaticamente alterações em formulários e configurações
                    </p>
                  </div>
                </div>
                <Switch
                  checked={autoSave}
                  onCheckedChange={(checked) => {
                    setAutoSave(checked);
                    localStorage.setItem("autoSave", JSON.stringify(checked));
                    toast({
                      title: "Configuração salva",
                      description: `Salvamento automático ${checked ? "ativado" : "desativado"}`,
                    });
                  }}
                />
              </div>
            </div>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="security">
                <Shield className="w-4 h-4 mr-2" />
                Segurança
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="w-4 h-4 mr-2" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="danger">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Zona de Risco
              </TabsTrigger>
            </TabsList>

            {/* Segurança */}
            <TabsContent value="security" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl">Segurança e Privacidade</h2>
                    <p className="text-sm text-muted-foreground">Gerencie sua senha e configurações de segurança</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">Alterar Senha</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Altere sua senha regularmente para manter sua conta segura
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Senha Atual *</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                            }
                            placeholder="Digite sua senha atual"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova Senha *</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                            }
                            placeholder="Digite a nova senha"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                            }
                            placeholder="Confirme a nova senha"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleChangePassword} disabled={loading} className="w-full md:w-auto">
                      {loading ? "Alterando..." : "Alterar Senha"}
                    </Button>
                  </div>

                  <Separator />

                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-500 mb-2">Dicas de Segurança</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Use uma senha forte com pelo menos 8 caracteres</li>
                          <li>• Combine letras maiúsculas, minúsculas, números e símbolos</li>
                          <li>• Não compartilhe sua senha com ninguém</li>
                          <li>• Altere sua senha regularmente</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Configurações de Notificações */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl">Configurações de Notificações</h2>
                    <p className="text-sm text-muted-foreground">Configure como e quando você deseja receber notificações</p>
                  </div>
                </div>

                {preferencesLoading ? (
                  <div className="space-y-4">
                    <div className="h-20 bg-muted animate-pulse rounded-xl" />
                    <div className="h-20 bg-muted animate-pulse rounded-xl" />
                    <div className="h-20 bg-muted animate-pulse rounded-xl" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Ativar/Desativar Notificações */}
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">Receber Notificações</h3>
                          <p className="text-sm text-muted-foreground">
                            Ative ou desative todas as notificações do sistema
                          </p>
                        </div>
                        <Switch
                          checked={notificationPreferences.enabled}
                          onCheckedChange={(checked) =>
                            setNotificationPreferences((prev) => ({ ...prev, enabled: checked }))
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Canais de Notificação */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Canais de Notificação</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Escolha como deseja receber suas notificações
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                          <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-primary" />
                            <div>
                              <Label className="text-sm font-medium">Notificações no App</Label>
                              <p className="text-xs text-muted-foreground">
                                Receber notificações dentro do sistema
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={notificationPreferences.channels.inApp}
                            onCheckedChange={(checked) =>
                              setNotificationPreferences((prev) => ({
                                ...prev,
                                channels: { ...prev.channels, inApp: checked },
                              }))
                            }
                            disabled={!notificationPreferences.enabled}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                          <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-primary" />
                            <div>
                              <Label className="text-sm font-medium">Push Notifications</Label>
                              <p className="text-xs text-muted-foreground">
                                Receber notificações push no navegador
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={notificationPreferences.channels.push}
                            onCheckedChange={(checked) =>
                              setNotificationPreferences((prev) => ({
                                ...prev,
                                channels: { ...prev.channels, push: checked },
                              }))
                            }
                            disabled={!notificationPreferences.enabled}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-primary" />
                            <div>
                              <Label className="text-sm font-medium">Notificações por Email</Label>
                              <p className="text-xs text-muted-foreground">
                                Receber notificações importantes por email
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={notificationPreferences.channels.email}
                            onCheckedChange={(checked) =>
                              setNotificationPreferences((prev) => ({
                                ...prev,
                                channels: { ...prev.channels, email: checked },
                              }))
                            }
                            disabled={!notificationPreferences.enabled}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Tipos de Notificações */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Tipos de Notificações</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Selecione quais tipos de eventos você deseja ser notificado
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries({
                          marketing: "Marketing",
                          sales: "Vendas",
                          support: "Suporte",
                          social: "Redes Sociais",
                          processes: "Processos",
                          academy: "Academia",
                          system: "Sistema",
                        }).map(([key, label]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                          >
                            <Label className="text-sm font-medium capitalize">{label}</Label>
                            <Switch
                              checked={notificationPreferences.types[key as keyof typeof notificationPreferences.types]}
                              onCheckedChange={(checked) =>
                                setNotificationPreferences((prev) => ({
                                  ...prev,
                                  types: { ...prev.types, [key]: checked },
                                }))
                              }
                              disabled={!notificationPreferences.enabled}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Horário Silencioso */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Horário Silencioso
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Configure um período onde não deseja receber notificações
                          </p>
                        </div>
                        <Switch
                          checked={notificationPreferences.quietHours.enabled}
                          onCheckedChange={(checked) =>
                            setNotificationPreferences((prev) => ({
                              ...prev,
                              quietHours: { ...prev.quietHours, enabled: checked },
                            }))
                          }
                          disabled={!notificationPreferences.enabled}
                        />
                      </div>

                      {notificationPreferences.quietHours.enabled && (
                        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/50 border border-border">
                          <div className="space-y-2">
                            <Label>Início</Label>
                            <Input
                              type="time"
                              value={notificationPreferences.quietHours.start}
                              onChange={(e) =>
                                setNotificationPreferences((prev) => ({
                                  ...prev,
                                  quietHours: { ...prev.quietHours, start: e.target.value },
                                }))
                              }
                              disabled={!notificationPreferences.enabled}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Fim</Label>
                            <Input
                              type="time"
                              value={notificationPreferences.quietHours.end}
                              onChange={(e) =>
                                setNotificationPreferences((prev) => ({
                                  ...prev,
                                  quietHours: { ...prev.quietHours, end: e.target.value },
                                }))
                              }
                              disabled={!notificationPreferences.enabled}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSavePreferences} disabled={loading}>
                        {loading ? "Salvando..." : "Salvar Configurações"}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Zona de Risco */}
            <TabsContent value="danger" className="space-y-6">
              <Card className="p-6 border-destructive/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl text-destructive">Zona de Risco</h2>
                    <p className="text-sm text-muted-foreground">Ações irreversíveis que afetam sua conta</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-destructive" />
                      <h3 className="font-semibold text-lg text-destructive">Excluir Conta Permanentemente</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Esta ação é permanente e não pode ser desfeita. Todos os seus dados serão removidos,
                      incluindo campanhas, oportunidades, tickets e histórico de atividades.
                    </p>

                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="deleteConfirm">
                          Para confirmar, digite <strong className="text-foreground">EXCLUIR</strong> no campo abaixo:
                        </Label>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Digite EXCLUIR"
                          className={cn(
                            deleteConfirmText && deleteConfirmText !== "EXCLUIR" && "border-destructive"
                          )}
                        />
                      </div>

                      <div className="space-y-2 text-sm">
                        <p className="font-semibold text-foreground">O que será excluído:</p>
                        <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                          <li>Todos os seus dados pessoais</li>
                          <li>Campanhas de marketing</li>
                          <li>Oportunidades de vendas</li>
                          <li>Tickets de suporte</li>
                          <li>Posts de redes sociais</li>
                          <li>Processos e workflows</li>
                          <li>Histórico de atividades</li>
                          <li>Certificados e cursos</li>
                          <li>Alertas e regras configuradas</li>
                        </ul>
                      </div>

                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={loading || deleteConfirmText !== "EXCLUIR"}
                        className="w-full"
                      >
                        {loading ? "Excluindo..." : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir Conta Permanentemente
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

