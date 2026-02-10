import { useState, useEffect } from "react";
import { rolesApi, Role, Permission } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function RolesPermissionsManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selectedPermissions: [] as string[],
  });
  const { toast } = useToast();

  // Agrupar permissões por módulo
  const permissionsByModule = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        rolesApi.getRoles(),
        rolesApi.getPermissions(),
      ]);
      setRoles(rolesRes.roles);
      setPermissions(permsRes.permissions);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: "",
      description: "",
      selectedPermissions: [],
    });
    setSelectedRole(null);
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      selectedPermissions: role.permissions.map((p) => p.id),
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: "Erro",
          description: "O nome da role é obrigatório",
          variant: "destructive",
        });
        return;
      }

      if (formData.selectedPermissions.length === 0) {
        toast({
          title: "Erro",
          description: "Selecione pelo menos uma permissão",
          variant: "destructive",
        });
        return;
      }

      if (selectedRole) {
        // Atualizar
        await rolesApi.updateRole(selectedRole.id, {
          name: formData.name,
          description: formData.description,
          permissions: formData.selectedPermissions,
        });
        toast({
          title: "Sucesso",
          description: "Role atualizada com sucesso",
        });
      } else {
        // Criar
        await rolesApi.createRole({
          name: formData.name,
          description: formData.description,
          permissions: formData.selectedPermissions,
        });
        toast({
          title: "Sucesso",
          description: "Role criada com sucesso",
        });
      }

      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedRole(null);
      loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar role",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.isSystem) {
      toast({
        title: "Erro",
        description: "Não é possível deletar uma role do sistema",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar a role "${role.name}"?`)) {
      return;
    }

    try {
      await rolesApi.deleteRole(role.id);
      toast({
        title: "Sucesso",
        description: "Role deletada com sucesso",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao deletar role",
        variant: "destructive",
      });
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permissionId)
        ? prev.selectedPermissions.filter((id) => id !== permissionId)
        : [...prev.selectedPermissions, permissionId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl mb-2">Roles e Permissões</h2>
          <p className="text-muted-foreground">Configure roles e permissões de acesso para diferentes usuários</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Role
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="p-6 glass-card">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{role.name}</h3>
                {role.isSystem && (
                  <Badge variant="outline" className="text-xs">
                    Sistema
                  </Badge>
                )}
              </div>
              {role.description && (
                <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
              )}
              <Badge variant="outline" className="text-xs">
                {role.permissions.length} permissão{role.permissions.length !== 1 ? "ões" : ""}
              </Badge>
            </div>

            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {Object.entries(
                role.permissions.reduce((acc, perm) => {
                  if (!acc[perm.module]) {
                    acc[perm.module] = [];
                  }
                  acc[perm.module].push(perm);
                  return acc;
                }, {} as Record<string, Permission[]>)
              ).map(([module, perms]) => (
                <div key={module} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">{module}</p>
                  {perms.map((perm) => (
                    <div key={perm.id} className="flex items-center gap-2 text-sm ml-2">
                      <CheckCircle className="w-3 h-3 text-success" />
                      <span className="capitalize">{perm.action}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleEdit(role)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              {!role.isSystem && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(role)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Dialog de Criar/Editar Role */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedRole(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRole ? "Editar Role" : "Nova Role"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Role *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Editor, Manager"
                disabled={selectedRole?.isSystem}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva as responsabilidades desta role"
              />
            </div>

            <div className="space-y-4">
              <Label>Permissões *</Label>
              <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module} className="space-y-2">
                    <p className="font-semibold text-sm uppercase text-muted-foreground">
                      {module}
                    </p>
                    <div className="space-y-2 ml-4">
                      {perms.map((perm) => (
                        <div key={perm.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={perm.id}
                            checked={formData.selectedPermissions.includes(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                          <Label
                            htmlFor={perm.id}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            <span className="capitalize">{perm.action}</span>
                            {perm.description && (
                              <span className="text-muted-foreground ml-2">- {perm.description}</span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                setSelectedRole(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {selectedRole ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

