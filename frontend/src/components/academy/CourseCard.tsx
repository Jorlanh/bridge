import { Play, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface CourseCardProps {
  title: string;
  description: string;
  category: string;
  duration: string;
  lessons: number;
  progress?: number;
  thumbnail?: string;
  featured?: boolean;
}

export function CourseCard({
  title,
  description,
  category,
  duration,
  lessons,
  progress = 0,
  thumbnail,
  featured = false,
}: CourseCardProps) {
  return (
    <div
      className={cn(
        "group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300",
        "bg-card border border-border hover:border-secondary/50",
        "hover:shadow-xl hover:shadow-secondary/10 hover:-translate-y-1",
        featured && "md:col-span-2 md:row-span-2"
      )}
    >
      {/* Thumbnail */}
      <div className={cn(
        "relative overflow-hidden bg-gradient-to-br from-secondary/20 to-primary/20",
        featured ? "h-64" : "h-40"
      )}>
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-secondary/50" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center shadow-lg shadow-secondary/50">
            <Play className="w-6 h-6 text-secondary-foreground ml-1" />
          </div>
        </div>

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium">
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className={cn(
          "font-display font-semibold mb-2 group-hover:text-secondary transition-colors",
          featured ? "text-xl" : "text-lg"
        )}>
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </p>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {duration}
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {lessons} aulas
          </div>
        </div>

        {/* Progress */}
        {progress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-secondary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );
}
