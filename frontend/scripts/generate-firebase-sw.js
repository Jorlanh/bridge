#!/usr/bin/env node

/**
 * Script para gerar o service worker do Firebase com variáveis de ambiente
 * Usado durante o desenvolvimento (npm run dev)
 * 
 * Nota: As variáveis de ambiente devem estar no arquivo .env na raiz do projeto
 * O Vite carrega automaticamente variáveis que começam com VITE_
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente manualmente (já que não temos dotenv no frontend)
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Remover aspas se houver
          env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return env;
  } catch (error) {
    console.warn('⚠️ Arquivo .env não encontrado, usando variáveis de ambiente do sistema');
    return {};
  }
}

const env = loadEnv();

// Caminhos dos arquivos
const templatePath = resolve(__dirname, '../public/firebase-messaging-sw.template.js');
const outputPath = resolve(__dirname, '../public/firebase-messaging-sw.js');

try {
  // Ler o template
  let content = readFileSync(templatePath, 'utf-8');
  
  // Variáveis de ambiente do Firebase (prioriza process.env, depois arquivo .env)
  const envVars = {
    VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY || '',
    VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || env.VITE_FIREBASE_AUTH_DOMAIN || '',
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || '',
    VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || env.VITE_FIREBASE_STORAGE_BUCKET || '',
    VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || env.VITE_FIREBASE_APP_ID || '',
    VITE_FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID || env.VITE_FIREBASE_MEASUREMENT_ID || '',
  };
  
  // Verificar se todas as variáveis estão definidas
  const missingVars = Object.entries(envVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Variáveis de ambiente do Firebase não encontradas:', missingVars.join(', '));
  }
  
  // Substituir cada placeholder
  Object.entries(envVars).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    content = content.replace(new RegExp(placeholder, 'g'), value);
  });
  
  // Escrever o arquivo final
  writeFileSync(outputPath, content, 'utf-8');
} catch (error) {
  console.error('❌ Erro ao gerar service worker do Firebase:', error);
  process.exit(1);
}

