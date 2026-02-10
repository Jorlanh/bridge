import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import cron from "node-cron";

const execAsync = promisify(exec);

interface BackupConfig {
  mongodbUri: string;
  backupDir: string;
  retentionDays: number;
}

/**
 * Cria backup do MongoDB
 */
export async function createMongoBackup(config: BackupConfig): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    // Criar diretório de backup se não existir
    await fs.mkdir(config.backupDir, { recursive: true });

    // Nome do arquivo de backup com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `backup-${timestamp}.gz`;
    const backupPath = path.join(config.backupDir, backupFileName);

    // Extrair informações da URI do MongoDB
    const uri = new URL(config.mongodbUri);
    const dbName = uri.pathname.slice(1); // Remove a barra inicial

    // Comando mongodump
    const command = `mongodump --uri="${config.mongodbUri}" --archive="${backupPath}" --gzip`;

    await execAsync(command);

    // Verificar se o arquivo foi criado
    const stats = await fs.stat(backupPath);
    if (stats.size === 0) {
      return {
        success: false,
        error: "Backup criado mas está vazio",
      };
    }


    // Limpar backups antigos
    await cleanOldBackups(config.backupDir, config.retentionDays);

    return {
      success: true,
      filePath: backupPath,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Erro desconhecido ao criar backup",
    };
  }
}

/**
 * Limpa backups antigos
 */
async function cleanOldBackups(backupDir: string, retentionDays: number): Promise<void> {
  try {
    const files = await fs.readdir(backupDir);
    const now = Date.now();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (!file.startsWith("backup-") || !file.endsWith(".gz")) continue;

      const filePath = path.join(backupDir, file);
      const stats = await fs.stat(filePath);
      const fileAge = now - stats.mtimeMs;

      if (fileAge > retentionMs) {
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
  }
}

/**
 * Restaura backup do MongoDB
 */
export async function restoreMongoBackup(
  backupPath: string,
  mongodbUri: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se o arquivo existe
    await fs.access(backupPath);

    const command = `mongorestore --uri="${mongodbUri}" --archive="${backupPath}" --gzip --drop`;

    await execAsync(command);

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Erro desconhecido ao restaurar backup",
    };
  }
}

/**
 * Lista backups disponíveis
 */
export async function listBackups(backupDir: string): Promise<Array<{ name: string; size: number; date: Date }>> {
  try {
    const files = await fs.readdir(backupDir);
    const backups = [];

    for (const file of files) {
      if (!file.startsWith("backup-") || !file.endsWith(".gz")) continue;

      const filePath = path.join(backupDir, file);
      const stats = await fs.stat(filePath);
      backups.push({
        name: file,
        size: stats.size,
        date: stats.mtime,
      });
    }

    return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    return [];
  }
}

/**
 * Inicializa backup automático
 */
export function initializeAutoBackup(config: BackupConfig, schedule: string = "0 2 * * *"): void {
  // Agendar backup diário às 2h da manhã por padrão
  cron.schedule(schedule, async () => {
    await createMongoBackup(config);
  });
}

