#!/usr/bin/env node

/**
 * Script para testar se a criptografia está funcionando
 */

import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, "../.env") });

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const TAG_POSITION = IV_LENGTH * 2;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH * 2;

function getKey() {
  if (!ENCRYPTION_KEY) {
    console.error("❌ ENCRYPTION_KEY não encontrada no .env");
    console.error("   Execute: node scripts/generate-encryption-key.js");
    process.exit(1);
  }
  
  if (ENCRYPTION_KEY.length === 64 && /^[0-9a-fA-F]+$/.test(ENCRYPTION_KEY)) {
    return Buffer.from(ENCRYPTION_KEY, "hex");
  }
  
  return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
}

function encrypt(text) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag();
  
  return iv.toString("hex") + tag.toString("hex") + encrypted;
}

function decrypt(encryptedText) {
  if (encryptedText.length < ENCRYPTED_POSITION) {
    return encryptedText;
  }
  
  const key = getKey();
  const ivHex = encryptedText.slice(0, TAG_POSITION);
  const tagHex = encryptedText.slice(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = encryptedText.slice(ENCRYPTED_POSITION);
  
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

console.log("\n🧪 Teste de Criptografia\n");
console.log("=" .repeat(60));

// Teste 1: Verificar se ENCRYPTION_KEY está configurada
console.log("\n1️⃣ Verificando ENCRYPTION_KEY...");
if (ENCRYPTION_KEY) {
  console.log(`   ✅ ENCRYPTION_KEY encontrada (${ENCRYPTION_KEY.length} caracteres)`);
  if (ENCRYPTION_KEY.length === 64 && /^[0-9a-fA-F]+$/.test(ENCRYPTION_KEY)) {
    console.log(`   ✅ Formato correto (hexadecimal de 64 caracteres)`);
  } else {
    console.log(`   ⚠️  Formato não é hex de 64 chars, será derivado com SHA-256`);
  }
} else {
  console.log(`   ❌ ENCRYPTION_KEY NÃO encontrada!`);
  console.log(`   💡 Adicione ENCRYPTION_KEY ao arquivo server/.env`);
  process.exit(1);
}

// Teste 2: Testar criptografia e descriptografia
console.log("\n2️⃣ Testando criptografia e descriptografia...");
const testMessage = "Nós vai assim que der bb";
console.log(`   📝 Mensagem original: "${testMessage}"`);

try {
  const encrypted = encrypt(testMessage);
  console.log(`   🔐 Mensagem criptografada: ${encrypted.substring(0, 50)}... (${encrypted.length} chars)`);
  
  const decrypted = decrypt(encrypted);
  console.log(`   🔓 Mensagem descriptografada: "${decrypted}"`);
  
  if (decrypted === testMessage) {
    console.log(`   ✅ Teste PASSOU! Criptografia funcionando corretamente.`);
  } else {
    console.log(`   ❌ Teste FALHOU! Mensagem descriptografada não corresponde à original.`);
    process.exit(1);
  }
} catch (error) {
  console.error(`   ❌ Erro durante teste:`, error);
  process.exit(1);
}

// Teste 3: Verificar se mensagem antiga (não criptografada) é detectada
console.log("\n3️⃣ Testando detecção de mensagens antigas...");
const oldMessage = "Mensagem antiga não criptografada";
const decryptedOld = decrypt(oldMessage);
if (decryptedOld === oldMessage) {
  console.log(`   ✅ Mensagens antigas são detectadas corretamente (não descriptografadas)`);
} else {
  console.log(`   ⚠️  Mensagens antigas podem ser processadas incorretamente`);
}

console.log("\n" + "=" .repeat(60));
console.log("\n✅ Todos os testes passaram! A criptografia está configurada corretamente.\n");
console.log("💡 Se as mensagens ainda não estão sendo criptografadas:");
console.log("   1. Verifique se o servidor foi reiniciado após adicionar ENCRYPTION_KEY");
console.log("   2. Verifique os logs do servidor ao salvar uma mensagem");
console.log("   3. Certifique-se de que o arquivo .env está no diretório server/\n");

