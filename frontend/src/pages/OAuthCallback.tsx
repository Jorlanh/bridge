import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function OAuthCallback() {
  useEffect(() => {
    // Obter parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get("connected");
    const error = urlParams.get("error");


    // Enviar mensagem para o parent window (se estiver em popup)
    if (window.opener && !window.opener.closed) {
      if (connected) {
        window.opener.postMessage(
          {
            type: "OAUTH_SUCCESS",
            platform: connected,
          },
          window.location.origin
        );
      } else if (error) {
        window.opener.postMessage(
          {
            type: "OAUTH_ERROR",
            message: error === "oauth_failed" ? "Erro ao conectar. Tente novamente." : error,
          },
          window.location.origin
        );
      }
      
      // Fechar popup após um pequeno delay para garantir que a mensagem foi enviada
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      // Se não estiver em popup, redirecionar para dashboard
      if (connected) {
        window.location.href = "/dashboard?connected=" + connected;
      } else if (error) {
        window.location.href = "/dashboard?error=" + error;
      } else {
        window.location.href = "/dashboard";
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Processando conexão...</p>
      </div>
    </div>
  );
}

