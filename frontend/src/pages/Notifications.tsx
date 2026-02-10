import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { notificationApi, Notification } from "@/lib/api";
import { toast } from "sonner";
import { Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, AlertCircle, BookOpen, Award, Inbox, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertSettingsManager } from "@/components/alerts/AlertSettingsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterType = "all" | "unread" | "read";

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return CheckCircle2;
    case "warning":
      return AlertTriangle;
    case "error":
      return AlertCircle;
    case "course":
      return BookOpen;
    case "certificate":
      return Award;
    default:
      return Info;
  }
};

const getNotificationColor = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return "text-success bg-success/10 border-success/30";
    case "warning":
      return "text-warning bg-warning/10 border-warning/30";
    case "error":
      return "text-destructive bg-destructive/10 border-destructive/30";
    case "course":
      return "text-primary bg-primary/10 border-primary/30";
    case "certificate":
      return "text-secondary bg-secondary/10 border-secondary/30";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    // Atualizar contador a cada 30 segundos
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await notificationApi.getNotifications(false);
      if (result.success) {
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      }
    } catch (error) {
      toast.error("Erro ao carregar notificações");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const result = await notificationApi.getUnreadCount();
      if (result.success) {
        setUnreadCount(result.unreadCount);
      }
    } catch (error) {
      // Silencioso, não precisa mostrar erro
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Erro ao marcar notificação como lida");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      setUnreadCount(0);
      toast.success("Todas as notificações foram marcadas como lidas");
    } catch (error) {
      toast.error("Erro ao marcar todas como lidas");
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      const deleted = notifications.find((n) => n.id === notificationId);
      if (deleted && !deleted.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      toast.success("Notificação removida");
    } catch (error) {
      toast.error("Erro ao deletar notificação");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const filteredNotifications = filter === "all"
    ? notifications
    : filter === "unread"
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.read);

  const readCount = notifications.filter(n => n.read).length;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar mobileOpen={false} onMobileOpenChange={() => {}} />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader 
          title="Notificações" 
          subtitle="Suas notificações e atualizações"
          onMenuClick={() => {}}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList>
              <TabsTrigger value="notifications">Notificações</TabsTrigger>
              <TabsTrigger value="alerts">Alertas Configuráveis</TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{notifications.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
            <div className="glass-card p-5 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Info className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{unreadCount}</div>
                  <div className="text-sm text-muted-foreground">Não lidas</div>
                </div>
              </div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{readCount}</div>
                  <div className="text-sm text-muted-foreground">Lidas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filtrar:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    filter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:bg-accent"
                  )}
                >
                  Todas ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    filter === "unread"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:bg-accent"
                  )}
                >
                  Não lidas ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter("read")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    filter === "read"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:bg-accent"
                  )}
                >
                  Lidas ({readCount})
                </button>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted" />
                    <div className="flex-1">
                      <div className="h-5 w-3/4 bg-muted rounded mb-2" />
                      <div className="h-4 w-full bg-muted rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Inbox className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-xl mb-2">
                {filter === "all"
                  ? "Nenhuma notificação"
                  : filter === "unread"
                  ? "Nenhuma notificação não lida"
                  : "Nenhuma notificação lida"}
              </h3>
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "Você não tem notificações no momento."
                  : filter === "unread"
                  ? "Todas as suas notificações foram lidas!"
                  : "Você ainda não leu nenhuma notificação."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "glass-card p-5 transition-all",
                      !notification.read && "border-primary/30 bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border",
                        colorClass
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className={cn(
                            "font-semibold text-base",
                            !notification.read && "font-bold"
                          )}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-8 w-8"
                            title="Marcar como lida"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(notification.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </TabsContent>

            <TabsContent value="alerts">
              <AlertSettingsManager />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

