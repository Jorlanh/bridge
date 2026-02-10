import cron from "node-cron";
import { ScheduledReport, IScheduledReport } from "../models/ScheduledReport.js";
import { generateReport } from "./reportGenerator.js";
import { sendEmail, generateReportEmailHTML } from "./emailService.js";
import { join } from "path";
import { readFile } from "fs/promises";

/**
 * Calcula a próxima execução baseada no schedule
 */
export function calculateNextRun(schedule: IScheduledReport["schedule"]): Date {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(":").map(Number);
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  switch (schedule.frequency) {
    case "daily":
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case "weekly":
      if (schedule.dayOfWeek !== undefined) {
        const currentDay = now.getDay();
        const targetDay = schedule.dayOfWeek;
        let daysUntilTarget = targetDay - currentDay;
        
        if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
          daysUntilTarget += 7;
        }
        
        nextRun.setDate(now.getDate() + daysUntilTarget);
      }
      break;

    case "monthly":
      if (schedule.dayOfMonth !== undefined) {
        nextRun.setDate(schedule.dayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
      }
      break;

    case "custom":
      // Para custom, usar cronExpression se disponível
      // Por enquanto, tratar como daily
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
  }

  return nextRun;
}

/**
 * Converte schedule para expressão cron
 */
export function scheduleToCron(schedule: IScheduledReport["schedule"]): string {
  const [hours, minutes] = schedule.time.split(":").map(Number);

  switch (schedule.frequency) {
    case "daily":
      return `${minutes} ${hours} * * *`; // Todo dia no horário especificado

    case "weekly":
      if (schedule.dayOfWeek !== undefined) {
        return `${minutes} ${hours} * * ${schedule.dayOfWeek}`; // Dia da semana específico
      }
      return `${minutes} ${hours} * * *`;

    case "monthly":
      if (schedule.dayOfMonth !== undefined) {
        return `${minutes} ${hours} ${schedule.dayOfMonth} * *`; // Dia do mês específico
      }
      return `${minutes} ${hours} 1 * *`; // Primeiro dia do mês

    case "custom":
      return schedule.cronExpression || `${minutes} ${hours} * * *`;

    default:
      return `${minutes} ${hours} * * *`;
  }
}

/**
 * Executa um relatório agendado
 */
export async function executeScheduledReport(scheduledReport: any): Promise<boolean> {
  try {
    console.log(`📊 Executando relatório agendado: ${scheduledReport.name} (ID: ${scheduledReport._id})`);

    // Preparar opções do relatório
    const reportOptions = {
      module: scheduledReport.module,
      format: scheduledReport.format,
      userId: scheduledReport.userId.toString(),
      templateId: scheduledReport.templateId?.toString(),
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias por padrão
        end: new Date(),
      },
    };

    // Gerar relatório
    const filePath = await generateReport(reportOptions);
    const fullPath = join(process.cwd(), filePath);

    // Ler arquivo para anexo
    const fileBuffer = await readFile(fullPath);
    const filename = filePath.split("/").pop() || `relatorio.${scheduledReport.format}`;
    const baseUrl = process.env.FRONTEND_URL || process.env.API_URL || "http://localhost:3001";
    const downloadUrl = `${baseUrl}/api/reports/download${filePath}`;

    // Enviar por email
    const emailSent = await sendEmail({
      to: scheduledReport.emailRecipients,
      subject: `Relatório: ${scheduledReport.name}`,
      html: generateReportEmailHTML(
        scheduledReport.name,
        scheduledReport.module,
        scheduledReport.format,
        downloadUrl
      ),
      attachments: [
        {
          filename,
          path: fullPath,
          contentType: 
            scheduledReport.format === "pdf" ? "application/pdf" :
            scheduledReport.format === "excel" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" :
            "text/csv",
        },
      ],
    });

    if (!emailSent) {
      console.error(`❌ Erro ao enviar email para relatório ${scheduledReport.name}`);
      return false;
    }

    // Atualizar scheduled report
    scheduledReport.lastRun = new Date();
    scheduledReport.nextRun = calculateNextRun(scheduledReport.schedule);
    scheduledReport.runCount = (scheduledReport.runCount || 0) + 1;
    await scheduledReport.save();

    console.log(`✅ Relatório ${scheduledReport.name} executado e enviado com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao executar relatório agendado ${scheduledReport.name}:`, error);
    return false;
  }
}

/**
 * Inicializa o scheduler de relatórios
 */
export function initializeReportScheduler(): void {
  console.log("📅 Inicializando scheduler de relatórios...");

  // Executar a cada minuto para verificar relatórios agendados
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      
      // Buscar relatórios que devem ser executados agora
      const reportsToRun = await ScheduledReport.find({
        enabled: true,
        $or: [
          { nextRun: { $lte: now } },
          { nextRun: { $exists: false } },
        ],
      });

      for (const report of reportsToRun) {
        // Calcular nextRun se não existir
        if (!report.nextRun) {
          report.nextRun = calculateNextRun(report.schedule);
          await report.save();
        }

        // Executar se for hora
        if (report.nextRun <= now) {
          await executeScheduledReport(report);
        }
      }
    } catch (error) {
      console.error("Erro no scheduler de relatórios:", error);
    }
  });

  console.log("✅ Scheduler de relatórios inicializado");
}

