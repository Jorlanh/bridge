import crypto from "crypto";

// Chave de criptografia (deve estar em variável de ambiente)
// IMPORTANTE: Configure ENCRYPTION_KEY no .env com uma string de 64 caracteres hexadecimais
// Exemplo: ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // Para AES, o IV é sempre 16 bytes
const TAG_LENGTH = 16;
const IV_POSITION = 0;
const TAG_POSITION = IV_LENGTH * 2; // Cada byte vira 2 caracteres hex
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH * 2;

// Derivar chave a partir da ENCRYPTION_KEY
let keyInitialized = false;
function getKey(): Buffer | null {
  if (!ENCRYPTION_KEY) {
    if (!keyInitialized) {
      console.warn("⚠️  ENCRYPTION_KEY não configurada. As mensagens não serão criptografadas.");
      console.warn("⚠️  Configure ENCRYPTION_KEY no arquivo server/.env e reinicie o servidor");
      keyInitialized = true;
    }
    return null;
  }
  
  // Log apenas uma vez ao inicializar
  if (!keyInitialized) {
    console.log(`🔐 [Criptografia] ENCRYPTION_KEY configurada - Criptografia ativada`);
    keyInitialized = true;
  }
  
  // Se ENCRYPTION_KEY for uma string hex de 64 caracteres, converter para buffer
  if (ENCRYPTION_KEY.length === 64 && /^[0-9a-fA-F]+$/.test(ENCRYPTION_KEY)) {
    return Buffer.from(ENCRYPTION_KEY, "hex");
  }
  
  // Derivar chave de 32 bytes usando SHA-256
  return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
}

/**
 * Criptografa um texto
 */
export function encrypt(text: string): string {
  if (!text) return text;
  
  const key = getKey();
  if (!key) {
    // Se a chave não estiver configurada, retornar texto original
    console.warn("⚠️  Criptografia desabilitada: ENCRYPTION_KEY não configurada");
    return text;
  }
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const tag = cipher.getAuthTag();
    
    // Combinar: iv (hex) + tag (hex) + encrypted (hex)
    // Formato: [32 chars hex IV][32 chars hex TAG][encrypted hex]
    return iv.toString("hex") + tag.toString("hex") + encrypted;
  } catch (error) {
    console.error("Erro ao criptografar:", error);
    // Se não conseguir criptografar, retornar texto original (para não quebrar o sistema)
    return text;
  }
}

/**
 * Descriptografa um texto
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  // Verificar se já está descriptografado (mensagens antigas)
  // Mensagens criptografadas têm pelo menos IV + TAG (96 caracteres hex = 48 bytes)
  if (encryptedText.length < ENCRYPTED_POSITION) {
    // Provavelmente é uma mensagem antiga não criptografada
    return encryptedText;
  }
  
  const key = getKey();
  if (!key) {
    // Se a chave não estiver configurada, retornar texto como está
    // (pode ser mensagem antiga não criptografada ou mensagem criptografada sem chave)
    return encryptedText;
  }
  
  try {
    // Extrair componentes
    const ivHex = encryptedText.slice(IV_POSITION, TAG_POSITION);
    const tagHex = encryptedText.slice(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = encryptedText.slice(ENCRYPTED_POSITION);
    
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    // Se falhar ao descriptografar, pode ser mensagem antiga não criptografada
    // ou formato diferente - retornar como está
    console.warn("Erro ao descriptografar (pode ser mensagem antiga):", error);
    return encryptedText;
  }
}

