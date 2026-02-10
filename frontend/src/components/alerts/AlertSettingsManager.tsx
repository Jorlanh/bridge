import { useState, useEffect } from "react";
import { alertsApi, AlertRule } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, Bell, BellOff, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function AlertSettingsManager() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    module: string;
    condition: {
      field: string;
      operator: "changed" | "contains" | "equals" | "greater_than" | "less_than" | "reached";
      value?: string;
    };
    triggerFrequency: "always" | "daily" | "once" | "weekly";
    enabled: boolean;
    notificationChannels: {
      inApp: boolean;
      push: boolean;
      email: boolean;
    };
  }>({
    name: "",
    description: "",
    module: "marketing",
    condition: {
      field: "",
      operator: "greater_than",
      value: "",
    },
    triggerFrequency: "always",
    enabled: true,
    notificationChannels: {
      inApp: true,
      push: true,
      email: false,
    },
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAlertRules();
  }, []);

  const loadAlertRules = async () => {
    try {
      setLoading(true);
      const result = await alertsApi.getAlertRules();
      setAlertRules(result.alertRules);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao carregar alertas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCreate = () => {
    setFormData({
      name: "",
      description: "",
      module: "marketing",
      condition: { field: "", operator: "greater_than", value: "" },
      triggerFrequency: "always",
      enabled: true,
      notificationChannels: { inApp: true, push: true, email: false },
    });
    setIsCreating(true);
    setEditingId(null);
    setExpandedId("new");
  };

  const handleStartEdit = (rule: AlertRule) => {
    setFormData({
      name: rule.name,
      description: rule.description || "",
      module: rule.module,
      condition: rule.condition,
      triggerFrequency: rule.triggerFrequency,
      enabled: rule.enabled,
      notificationChannels: rule.notificationChannels,
    });
    setEditingId(rule.id);
    setIsCreating(false);
    setExpandedId(rule.id);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setExpandedId(null);
    setFormData({
      name: "",
      description: "",
      module: "marketing",
      condition: { field: "", operator: "greater_than", value: "" },
      triggerFrequency: "always",
      enabled: true,
      notificationChannels: { inApp: true, push: true, email: false },
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim() || !formData.condition.field.trim()) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      const value = formData.condition.operator === "changed" ? undefined : formData.condition.value;

      if (editingId) {
        await alertsApi.updateAlertRule(editingId, {
          ...formData,
          condition: { ...formData.condition, value },
        });
        toast({ title: "Sucesso", description: "Alerta atualizado com sucesso" });
      } else {
        await alertsApi.createAlertRule({
          ...formData,
          condition: { ...formData.condition, value },
        });
        toast({ title: "Sucesso", description: "Alerta criado com sucesso" });
      }

      handleCancel();
      loadAlertRules();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar alerta",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este alerta?")) return;

    try {
      await alertsApi.deleteAlertRule(id);
      toast({ title: "Sucesso", description: "Alerta deletado com sucesso" });
      loadAlertRules();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao deletar alerta",
        variant: "destructive",
      });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await alertsApi.toggleAlertRule(id);
      loadAlertRules();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao alternar estado",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  const renderForm = (isEdit = false) => (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{isEdit ? "Editar Alerta" : "Novo Alerta"}</h3>
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome do Alerta *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Conversão acima de 50%"
            />
          </div>

          <div className="space-y-2">
            <Label>Módulo *</Label>
            <Select
              value={formData.module}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, module: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="sales">Vendas</SelectItem>
                <SelectItem value="support">Suporte</SelectItem>
                <SelectItem value="social">Redes Sociais</SelectItem>
                <SelectItem value="processes">Processos</SelectItem>
                <SelectItem value="academy">Academia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição opcional do alerta"
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Condição do Alerta</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Campo a Monitorar *</Label>
              <Input
                value={formData.condition.field}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    condition: { ...prev.condition, field: e.target.value },
                  }))
                }
                placeholder="Ex: campaign.conversion"
              />
            </div>

            <div className="space-y-2">
              <Label>Operador *</Label>
              <Select
                value={formData.condition.operator}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({
                    ...prev,
                    condition: { ...prev.condition, operator: value },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Igual a</SelectItem>
                  <SelectItem value="greater_than">Maior que</SelectItem>
                  <SelectItem value="less_than">Menor que</SelectItem>
                  <SelectItem value="contains">Contém</SelectItem>
                  <SelectItem value="reached">Atingiu</SelectItem>
                  <SelectItem value="changed">Mudou</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.condition.operator !== "changed" && (
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type={formData.condition.operator.includes("than") || formData.condition.operator === "reached" ? "number" : "text"}
                  value={formData.condition.value}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      condition: { ...prev.condition, value: e.target.value },
                    }))
                  }
                  placeholder="Valor de comparação"
                />
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Configurações</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequência de Trigger</Label>
              <Select
                value={formData.triggerFrequency}
                onValueChange={(value: any) => setFormData((prev) => ({ ...prev, triggerFrequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Sempre</SelectItem>
                  <SelectItem value="once">Uma vez</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Alerta ativo</span>
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, enabled: checked }))}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Canais de Notificação</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label className="text-sm font-medium">Notificação no App</Label>
                <p className="text-xs text-muted-foreground">Receber notificações dentro do sistema</p>
              </div>
              <Switch
                checked={formData.notificationChannels.inApp}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    notificationChannels: { ...prev.notificationChannels, inApp: checked },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label className="text-sm font-medium">Push Notification</Label>
                <p className="text-xs text-muted-foreground">Receber notificações push no navegador</p>
              </div>
              <Switch
                checked={formData.notificationChannels.push}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    notificationChannels: { ...prev.notificationChannels, push: checked },
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-xs text-muted-foreground">Receber alertas por email</p>
              </div>
              <Switch
                checked={formData.notificationChannels.email}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    notificationChannels: { ...prev.notificationChannels, email: checked },
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? "Atualizar" : "Criar"} Alerta
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl mb-2">Alertas Configuráveis</h2>
          <p className="text-muted-foreground">
            Configure alertas personalizados que serão acionados quando condições específicas forem atendidas
          </p>
        </div>
        {!isCreating && (
          <Button onClick={handleStartCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Alerta
          </Button>
        )}
      </div>

      {/* Formulário de criação/edição */}
      {(isCreating || editingId) && renderForm(!!editingId)}

      {/* Lista de alertas */}
      {!isCreating && (
        <div className="space-y-4">
          {alertRules.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold text-lg mb-2">Nenhum alerta configurado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro alerta para ser notificado sobre eventos importantes
              </p>
              <Button onClick={handleStartCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Alerta
              </Button>
            </Card>
          ) : (
            alertRules.map((rule) => (
              <Card key={rule.id} className="p-6">
                {expandedId === rule.id && editingId === rule.id ? (
                  // Modo edição
                  renderForm(true)
                ) : (
                  // Modo visualização
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{rule.name}</h3>
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? "Ativo" : "Inativo"}
                          </Badge>
                          <Badge variant="outline" className="capitalize">{rule.module}</Badge>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 rounded-lg bg-muted/30">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Condição</p>
                            <p className="text-sm font-medium">
                              {rule.condition.field}{" "}
                              {rule.condition.operator === "greater_than" ? ">" : 
                               rule.condition.operator === "less_than" ? "<" : 
                               rule.condition.operator === "equals" ? "=" : 
                               rule.condition.operator === "contains" ? "contém" :
                               rule.condition.operator === "reached" ? "atingiu" : "mudou"}{" "}
                              {rule.condition.value !== undefined && rule.condition.value !== null && rule.condition.operator !== "changed" && (
                                <span>{rule.condition.value}</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Frequência</p>
                            <p className="text-sm font-medium capitalize">
                              {rule.triggerFrequency === "always" ? "Sempre" :
                               rule.triggerFrequency === "once" ? "Uma vez" :
                               rule.triggerFrequency === "daily" ? "Diário" : "Semanal"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Canais</p>
                            <div className="flex gap-2 flex-wrap">
                              {rule.notificationChannels.inApp && (
                                <Badge variant="outline" className="text-xs">App</Badge>
                              )}
                              {rule.notificationChannels.push && (
                                <Badge variant="outline" className="text-xs">Push</Badge>
                              )}
                              {rule.notificationChannels.email && (
                                <Badge variant="outline" className="text-xs">Email</Badge>
                              )}
                            </div>
                          </div>
                          {rule.triggerCount > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Histórico</p>
                              <p className="text-sm font-medium">
                                Acionado {rule.triggerCount} vez{rule.triggerCount > 1 ? "es" : ""}
                                {rule.lastTriggered && (
                                  <span className="text-muted-foreground ml-2">
                                    ({new Date(rule.lastTriggered).toLocaleDateString("pt-BR")})
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(rule.id)}
                      >
                        {rule.enabled ? (
                          <>
                            <BellOff className="w-4 h-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Bell className="w-4 h-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEdit(rule)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
