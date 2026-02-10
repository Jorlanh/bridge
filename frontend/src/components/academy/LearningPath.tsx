import { CheckCircle2, Circle, Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PathStep {
  title: string;
  status: "completed" | "current" | "locked";
  courseId?: string;
}

interface LearningPathProps {
  title: string;
  description: string;
  steps: PathStep[];
  progress: number;
}

export function LearningPath({ title, description, steps, progress }: LearningPathProps) {
  const navigate = useNavigate();

  const handleStepClick = (step: PathStep) => {
    if (step.status === "locked") {
      return; // Não faz nada se estiver bloqueado
    }
    
    if (step.courseId) {
      navigate(`/academy/course/${step.courseId}`);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-lg mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-secondary">{progress}%</div>
          <div className="text-xs text-muted-foreground">
            {steps.filter(s => s.status === "completed").length} de {steps.length}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            onClick={() => handleStepClick(step)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-colors",
              step.status === "current" && "bg-secondary/10 border border-secondary/30 cursor-pointer hover:bg-secondary/20",
              step.status === "completed" && "cursor-pointer hover:bg-muted/50",
              step.status === "locked" && "opacity-50 cursor-not-allowed"
            )}
          >
            {step.status === "completed" && (
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
            )}
            {step.status === "current" && (
              <Circle className="w-5 h-5 text-secondary flex-shrink-0 fill-secondary/20" />
            )}
            {step.status === "locked" && (
              <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            )}
            <span className={cn(
              "text-sm font-medium flex-1",
              step.status === "completed" && "text-muted-foreground",
              step.status === "current" && "text-secondary",
              step.status === "locked" && "text-muted-foreground"
            )}>
              {index + 1}. {step.title}
            </span>
            {(step.status === "current" || step.status === "completed") && (
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Progresso da Trilha</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
