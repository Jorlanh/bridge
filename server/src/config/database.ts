import mongoose from "mongoose";

/**
 * Normaliza a URL do MongoDB, garantindo que tenha o nome do banco e parâmetros corretos
 */
const normalizeMongoURI = (uri: string): string => {
  let normalized = uri;
  
  // Verifica se tem nome do banco após mongodb.net/
  // Padrão: mongodb.net/ ou mongodb.net/?param=value
  const hasDatabaseName = /mongodb\.net\/[^?]+/.test(normalized);
  
  if (!hasDatabaseName) {
    // Adiciona o nome do banco 'bridgeai-hub' antes dos parâmetros
    if (normalized.includes('?')) {
      normalized = normalized.replace(/mongodb\.net\/\?/, 'mongodb.net/bridgeai-hub?');
    } else {
      normalized = normalized.replace(/mongodb\.net\/$/, 'mongodb.net/bridgeai-hub');
      // Se não tinha parâmetros, adiciona os recomendados
      normalized += '?retryWrites=true&w=majority';
      return normalized;
    }
  }
  
  // Processa parâmetros de query
  const [base, queryString] = normalized.split('?');
  const params = new URLSearchParams(queryString || '');
  
  // Adiciona parâmetros recomendados se não existirem
  if (!params.has('retryWrites')) {
    params.set('retryWrites', 'true');
  }
  if (!params.has('w')) {
    params.set('w', 'majority');
  }
  // Remove appName se existir (não é necessário)
  params.delete('appName');
  
  return `${base}?${params.toString()}`;
};

export const connectDatabase = async () => {
  try {
    let mongoURI = process.env.DATABASE_URL;
    
    if (!mongoURI) {
      throw new Error("DATABASE_URL não está definida no .env");
    }

    // Normaliza a URL antes de conectar
    mongoURI = normalizeMongoURI(mongoURI);

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000, // Timeout após 30 segundos
      socketTimeoutMS: 45000, // Timeout de socket
      connectTimeoutMS: 30000, // Timeout de conexão
      // Retry de conexão
      retryWrites: true,
      retryReads: true,
    });
    
    console.log("✅ MongoDB conectado com sucesso");
  } catch (error: any) {
    console.error("❌ Erro ao conectar com MongoDB:", error);
    
    // Mensagens de ajuda mais específicas
    if (error.message?.includes("whitelist") || error.message?.includes("IP")) {
      console.error("\n💡 SOLUÇÃO:");
      console.error("1. Acesse: https://www.mongodb.com/cloud/atlas");
      console.error("2. Vá em 'Network Access' (ou 'IP Access List')");
      console.error("3. Adicione seu IP atual ou use '0.0.0.0/0' para permitir todos os IPs (apenas para desenvolvimento)");
      console.error("4. Aguarde alguns minutos para a mudança ser aplicada");
    } else if (error.message?.includes("SSL") || error.message?.includes("TLS")) {
      console.error("\n💡 SOLUÇÃO:");
      console.error("1. Verifique se a string de conexão está correta");
      console.error("2. Certifique-se de que está usando a versão mais recente do MongoDB Atlas");
      console.error("3. Tente regenerar a string de conexão no MongoDB Atlas");
    } else if (error.message?.includes("authentication")) {
      console.error("\n💡 SOLUÇÃO:");
      console.error("1. Verifique se o usuário e senha estão corretos na DATABASE_URL");
      console.error("2. Certifique-se de que o usuário tem as permissões necessárias");
    }
    
    console.error("⚠️  Servidor continuará rodando, mas operações de banco falharão");
    // Não encerra o processo, permite que o servidor inicie mesmo sem MongoDB
  }
};

// Tratamento de erros de conexão
mongoose.connection.on("error", (err) => {
  console.error("❌ Erro na conexão MongoDB:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB desconectado");
});

