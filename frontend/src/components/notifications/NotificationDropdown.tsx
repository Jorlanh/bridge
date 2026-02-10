import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, X, Info, CheckCircle2, AlertTriangle, AlertCircle, BookOpen, Award } from "lucide-react";
import { notificationApi, Notification } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/useSocket";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { unreadCount } = useSocket();

  // Carregar notificações quando abrir
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Escutar novas notificações em tempo real
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent<Notification>) => {
      const newNotification = event.detail;
      setNotifications((prev) => [newNotification, ...prev]);
    };

    window.addEventListener("new-notification", handleNewNotification as EventListener);
    
    return () => {
      window.removeEventListener("new-notification", handleNewNotification as EventListener);
    };
  }, []);

  // Calcular posição do dropdown
  useEffect(() => {
    if (isOpen) {
      const header = document.querySelector("header");
      const notificationButton = document.querySelector('[aria-label*="notificações"], button:has(svg.lucide-bell)');
      
      if (header) {
        const headerRect = header.getBoundingClientRect();
        setPosition({
          top: headerRect.bottom + 8,
          right: window.innerWidth - headerRect.right - 16,
        });
      } else if (notificationButton) {
        const buttonRect = notificationButton.getBoundingClientRect();
        setPosition({
          top: buttonRect.bottom + 8,
          right: window.innerWidth - buttonRect.right,
        });
      } else {
        // Fallback: posição padrão
        setPosition({
          top: 80,
          right: 16,
        });
      }
    }
  }, [isOpen]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    try {
      const result = await notificationApi.getNotifications(false);
      if (result.success) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      toast.error("Erro ao marcar notificação como lida");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      toast.success("Todas as notificações foram marcadas como lidas");
    } catch (error) {
      toast.error("Erro ao marcar todas como lidas");
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      toast.success("Notificação removida");
    } catch (error) {
      toast.error("Erro ao deletar notificação");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id, {} as React.MouseEvent);
    }
    
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  if (!isOpen) return null;

  const dropdownContent = (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />

      {/* Dropdown */}
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className="fixed w-96 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl z-[9999] max-h-[600px] flex flex-col"
        style={{ 
          position: 'fixed',
          top: `${position.top}px`,
          right: `${position.right}px`,
          zIndex: 9999
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Marcar todas
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Carregando notificações...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border",
                        colorClass
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={cn(
                            "font-medium text-sm",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                            title="Marcar como lida"
                          >
                            <Check className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border bg-muted/30">
            <Button
              variant="default"
              size="sm"
              className="w-full font-medium"
              onClick={() => {
                navigate("/notificacoes");
                onClose();
              }}
            >
              Ver todas as notificações
            </Button>
          </div>
        )}
      </motion.div>
    </>
  );

  // Renderizar usando portal para garantir que fique acima de tudo
  return typeof window !== 'undefined' && document.body
    ? createPortal(dropdownContent, document.body)
    : null;
}

