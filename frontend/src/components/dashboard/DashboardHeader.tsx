import { Bell, Search, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { notificationApi } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onSearch?: (searchTerm: string) => void;
  searchPlaceholder?: string;
}

export function DashboardHeader({ title, subtitle, onMenuClick, onSearch, searchPlaceholder = "Buscar..." }: DashboardHeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { unreadCount } = useSocket();

  // Escutar atualizações de contador em tempo real
  useEffect(() => {
    const handleUnreadCountUpdate = (event: CustomEvent) => {
      // O contador já é atualizado pelo hook useSocket
    };

    window.addEventListener("unread-count-update", handleUnreadCountUpdate as EventListener);
    
    return () => {
      window.removeEventListener("unread-count-update", handleUnreadCountUpdate as EventListener);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Menu Mobile Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display font-bold text-lg sm:text-xl">{title}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            className="w-48 xl:w-64 h-10 pl-10 pr-4 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1.5 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
          <NotificationDropdown 
            isOpen={notificationsOpen} 
            onClose={() => {
              setNotificationsOpen(false);
            }} 
          />
        </div>

        {/* User - Link para perfil */}
        <Link to="/perfil">
          <Button variant="ghost" size="icon" className="hover:bg-muted/50 transition-colors">
            <User className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
