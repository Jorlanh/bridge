import { CheckCircle2, MessageSquare, Mail, Users, Zap, GraduationCap, Calendar, Video, BookOpen, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Activity {
  icon: typeof Zap;
  title: string;
  description: string;
  time: string;
  type: "automation" | "lead" | "support" | "meeting";
}

interface ActivityFeedProps {
  activities?: Activity[];
}

export function ActivityFeed({ activities = [] }: ActivityFeedProps) {
  const navigate = useNavigate();

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-lg">Atividade Recente</h3>
          <p className="text-sm text-muted-foreground">Últimas ações automatizadas</p>
        </div>
        <button 
          onClick={() => navigate("/dashboard/security")}
          className="text-sm text-primary hover:underline"
        >
          Ver tudo
        </button>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma atividade recente</p>
          </div>
        ) : (
          activities.map((activity, index) => (
          <div 
            key={index}
            className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              activity.type === "automation" && "bg-primary/20",
              activity.type === "lead" && "bg-success/20",
              activity.type === "support" && "bg-secondary/20",
              activity.type === "meeting" && "bg-warning/20",
            )}>
              <activity.icon className={cn(
                "w-5 h-5",
                activity.type === "automation" && "text-primary",
                activity.type === "lead" && "text-success",
                activity.type === "support" && "text-secondary",
                activity.type === "meeting" && "text-warning",
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{activity.title}</p>
              <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
          </div>
          ))
        )}
      </div>
    </div>
  );
}
