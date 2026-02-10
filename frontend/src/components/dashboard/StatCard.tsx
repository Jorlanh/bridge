import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon,
  iconColor = "text-primary"
}: StatCardProps) {
  return (
    <div className="glass-card-hover p-6 animate-scale-in">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          "bg-gradient-to-br from-primary/20 to-secondary/20"
        )}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
        {change && (
          <span className={cn(
            "text-sm font-medium px-2 py-1 rounded-lg",
            changeType === "positive" && "bg-success/20 text-success",
            changeType === "negative" && "bg-destructive/20 text-destructive",
            changeType === "neutral" && "bg-muted text-muted-foreground"
          )}>
            {change}
          </span>
        )}
      </div>
      <div className="font-display text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
  );
}
