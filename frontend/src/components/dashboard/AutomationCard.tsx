import { LucideIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomationCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  items: string[];
  status?: "active" | "inactive" | "pending";
  onClick?: () => void;
}

export function AutomationCard({ 
  title, 
  description, 
  icon: Icon, 
  items,
  status = "active",
  onClick 
}: AutomationCardProps) {
  return (
    <div 
      className="glass-card-hover p-6 cursor-pointer group card-shine"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
          <Icon className="w-7 h-7 text-primary-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "w-2 h-2 rounded-full",
            status === "active" && "bg-success animate-pulse",
            status === "inactive" && "bg-muted-foreground",
            status === "pending" && "bg-warning animate-pulse"
          )} />
          <span className="text-xs text-muted-foreground capitalize">{status}</span>
        </div>
      </div>

      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      <ul className="space-y-2 mb-4">
        {items.slice(0, 4).map((item, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>

      <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
        <span>Ver detalhes</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
