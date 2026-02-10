import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  lessonTitle: string;
  lessonNumber: number;
  onComplete?: () => void;
  isCompleted?: boolean;
}

export function VideoPlayer({
  isOpen,
  onClose,
  videoUrl,
  lessonTitle,
  lessonNumber,
  onComplete,
  isCompleted = false,
}: VideoPlayerProps) {
  if (!isOpen) return null;

  // Extrair ID do vídeo do YouTube se for uma URL do YouTube
  const getYouTubeEmbedUrl = (url: string): string => {
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    if (url.includes("youtube.com/embed/")) {
      return url.includes("?") ? url : `${url}?autoplay=1&rel=0`;
    }
    return url;
  };

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl mx-4 bg-card rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-display font-semibold text-lg">
              Aula {lessonNumber}: {lessonTitle}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Video Container */}
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={embedUrl}
            title={lessonTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isCompleted ? (
              <span className="text-success">✓ Aula concluída</span>
            ) : (
              "Assista o vídeo completo para marcar como concluída"
            )}
          </div>
          <div className="flex gap-2">
            {!isCompleted && onComplete && (
              <Button
                variant="default"
                onClick={onComplete}
                className="bg-success hover:bg-success/90"
              >
                Marcar como Concluída
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}






