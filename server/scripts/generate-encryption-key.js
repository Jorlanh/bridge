#!/usr/bin/env node

/**
 * Script para gerar uma chave de criptografia segura para ENCRYPTION_KEY
 * 
 * Uso:
 *   node scripts/generate-encryption-key.js
 * 
 * Isso gerará uma chave hexadecimal de 64 caracteres (32 bytes)
 * que deve ser adicionada ao arquivo .env como:
 *   ENCRYPTION_KEY=<chave_gerada>
 */

import crypto from "crypto";

// Gerar chave de 32 bytes (256 bits) para AES-256
const key = crypto.randomBytes(32);

// Converter para hexadecimal (64 caracteres)
const keyHex = key.toString("hex");

console.log("\n🔐 Chave de Criptografia Gerada\n");
console.log("=" .repeat(60));
console.log("Adicione esta linha ao seu arquivo server/.env:\n");
console.log(`ENCRYPTION_KEY=${keyHex}\n`);
console.log("=" .repeat(60));
console.log("\n⚠️  IMPORTANTE:");
console.log("   - Mantenha esta chave em SEGREDO");
console.log("   - NÃO compartilhe ou commite no Git");
console.log("   - Se perder esta chave, não será possível descriptografar mensagens antigas");
console.log("   - Faça backup seguro desta chave\n");

