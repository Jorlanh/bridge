import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Plugin do Vite para injetar variáveis de ambiente no service worker do Firebase
 */
export function firebaseServiceWorkerPlugin(): Plugin {
  return {
    name: 'firebase-service-worker',
    apply: 'build',
    buildStart() {
      // Ler o template
      const templatePath = resolve(__dirname, 'public/firebase-messaging-sw.template.js');
      const outputPath = resolve(__dirname, 'public/firebase-messaging-sw.js');
      
      try {
        let content = readFileSync(templatePath, 'utf-8');
        
        // Substituir placeholders pelas variáveis de ambiente
        const envVars = {
          VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || '',
          VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
          VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || '',
          VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
          VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
          VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || '',
          VITE_FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID || '',
        };
        
        // Substituir cada placeholder
        Object.entries(envVars).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          if (!value) {
            console.warn(`⚠️ Variável de ambiente ${key} não encontrada`);
          }
          content = content.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        });
        
        // Escrever o arquivo final
        writeFileSync(outputPath, content, 'utf-8');
      } catch (error) {
        console.error('❌ Erro ao gerar service worker do Firebase:', error);
      }
    },
  };
}

