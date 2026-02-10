import html2canvas from "html2canvas";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Função para obter headers de autenticação
const getAuthHeaders = () => {
  const token = sessionStorage.getItem("bridgeai_token");
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Função para fazer requisições com tratamento de erro de autenticação
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, options);
  
  // Se receber 401 (não autorizado), significa que o token está inválido ou expirado
  if (response.status === 401) {
    // Limpar token e redirecionar para login
    sessionStorage.removeItem("bridgeai_token");
    sessionStorage.removeItem("user");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Sessão expirada. Por favor, faça login novamente.");
  }
  
  return response;
};

/**
 * Converte HTML do certificado em imagem e faz download
 */
export async function downloadCertificateAsImage(htmlContent: string, filename: string = "certificado"): Promise<void> {
  // Criar um iframe temporário para renderizar o HTML completo
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "297mm"; // A4 landscape width
  iframe.style.height = "210mm"; // A4 landscape height
  iframe.style.border = "none";
  
  document.body.appendChild(iframe);

  return new Promise((resolve, reject) => {
    iframe.onload = async () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (!iframeDoc) {
          throw new Error("Não foi possível acessar o documento do iframe");
        }

        // Escrever o HTML no iframe
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // Aguardar um pouco para garantir que o HTML foi renderizado e recursos carregados
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Encontrar o elemento do certificado dentro do HTML
        const certificateElement = iframeDoc.querySelector(".certificate") || iframeDoc.querySelector(".page") || iframeDoc.body;

        if (!certificateElement) {
          throw new Error("Elemento do certificado não encontrado");
        }

        // Converter para canvas usando html2canvas
        const canvas = await html2canvas(certificateElement as HTMLElement, {
          scale: 2, // Alta qualidade
          useCORS: true,
          logging: false,
          backgroundColor: "#fbf7ef",
          width: (certificateElement as HTMLElement).scrollWidth || 1123, // A4 landscape width em pixels
          height: (certificateElement as HTMLElement).scrollHeight || 794, // A4 landscape height em pixels
          windowWidth: 1123,
          windowHeight: 794,
        });

        // Converter canvas para blob
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error("Erro ao gerar imagem do certificado");
          }

          // Criar link de download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${filename}-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          // Remover iframe
          document.body.removeChild(iframe);
          resolve();
        }, "image/png", 0.95); // Qualidade 95%

      } catch (error) {
        document.body.removeChild(iframe);
        reject(error);
      }
    };

    // Se o iframe já estiver carregado
    if (iframe.contentDocument?.readyState === "complete") {
      iframe.onload = null;
      iframe.onload(new Event("load"));
    }
  });
}

/**
 * Busca o HTML do certificado e faz download como imagem
 */
export async function downloadCertificateFromApi(courseId: string, courseTitle?: string): Promise<void> {
  const token = sessionStorage.getItem("bridgeai_token");

  if (!token) {
    throw new Error("Usuário não autenticado. Por favor, faça login novamente.");
  }

  // Buscar HTML do certificado usando fetchWithAuth para tratamento de erros
  const response = await fetchWithAuth(`${API_URL}/api/academy/certificate/${courseId}/download`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    // Tentar obter mensagem de erro do JSON
    try {
      const error = await response.json();
      throw new Error(error.message || "Erro ao baixar certificado");
    } catch {
      throw new Error("Erro ao baixar certificado");
    }
  }

  const htmlContent = await response.text();
  const filename = courseTitle 
    ? `certificado-${courseTitle.replace(/\s+/g, "-").toLowerCase()}`
    : `certificado-${courseId}`;

  // Converter e fazer download como imagem
  await downloadCertificateAsImage(htmlContent, filename);
}

