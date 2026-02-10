/**
 * Serviço de envio de emails
 * Por enquanto, implementação básica que pode ser expandida com SendGrid, Nodemailer, etc.
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path: string;
    contentType?: string;
  }>;
}

/**
 * Envia um email
 * TODO: Integrar com serviço real de email (SendGrid, Nodemailer, etc.)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Por enquanto, apenas log
    // Em produção, integrar com SendGrid, Nodemailer, AWS SES, etc.
    console.log("📧 Email enviado:", {
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      hasAttachments: options.attachments && options.attachments.length > 0,
    });

    // Se houver variável de ambiente para email service, usar
    if (process.env.EMAIL_SERVICE === "console") {
      // Apenas log para desenvolvimento
      return true;
    }

    // Aqui você pode integrar com:
    // - SendGrid: const sgMail = require('@sendgrid/mail');
    // - Nodemailer: const nodemailer = require('nodemailer');
    // - AWS SES: const AWS = require('aws-sdk');
    // - Outros serviços

    // Exemplo com Nodemailer (descomente e configure):
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@bridgeaihub.com',
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    };

    await transporter.sendMail(mailOptions);
    */

    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}

/**
 * Gera HTML para email de notificação
 */
export function generateNotificationEmailHTML(
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error" | "course" | "certificate" = "info",
  link?: string
): string {
  // Cores baseadas no tipo de notificação
  const typeColors: Record<string, { bg: string; border: string; icon: string }> = {
    info: { bg: "#3B82F6", border: "#2563EB", icon: "ℹ️" },
    success: { bg: "#10B981", border: "#059669", icon: "✅" },
    warning: { bg: "#F59E0B", border: "#D97706", icon: "⚠️" },
    error: { bg: "#EF4444", border: "#DC2626", icon: "❌" },
    course: { bg: "#8B5CF6", border: "#7C3AED", icon: "📚" },
    certificate: { bg: "#EC4899", border: "#DB2777", icon: "🎓" },
  };

  const colors = typeColors[type] || typeColors.info;
  const baseUrl = process.env.FRONTEND_URL || process.env.API_URL || "http://localhost:8080";
  const notificationUrl = link ? link : `${baseUrl}/dashboard/notifications`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.border} 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
      background-color: #ffffff;
    }
    .message {
      font-size: 16px;
      color: #4B5563;
      margin-bottom: 20px;
      white-space: pre-wrap;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.border} 100%);
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      text-align: center;
      color: #9CA3AF;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
    }
    .link-text {
      word-break: break-all;
      color: ${colors.bg};
      font-size: 14px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">${colors.icon}</div>
      <h1>${title}</h1>
    </div>
    <div class="content">
      <div class="message">${message}</div>
      ${link ? `
      <div class="button-container">
        <a href="${link}" class="button">Ver Detalhes</a>
      </div>
      <p class="link-text">Ou acesse: ${link}</p>
      ` : `
      <div class="button-container">
        <a href="${notificationUrl}" class="button">Ver Notificações</a>
      </div>
      `}
    </div>
    <div class="footer">
      <p><strong>BridgeAI Hub</strong> - Sistema de Gestão</p>
      <p>Este é um email automático de notificação. Você pode gerenciar suas preferências na plataforma.</p>
      <p style="margin-top: 10px;">
        <a href="${baseUrl}/dashboard/settings" style="color: ${colors.bg}; text-decoration: none;">Gerenciar Preferências</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Gera HTML para email de relatório
 */
export function generateReportEmailHTML(
  reportName: string,
  module: string,
  format: string,
  downloadUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2E7D32;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 20px;
      border: 1px solid #ddd;
      border-top: none;
    }
    .button {
      display: inline-block;
      background-color: #2E7D32;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Relatório Gerado</h1>
  </div>
  <div class="content">
    <p>Olá,</p>
    <p>Seu relatório <strong>${reportName}</strong> foi gerado com sucesso!</p>
    <p><strong>Módulo:</strong> ${module}</p>
    <p><strong>Formato:</strong> ${format.toUpperCase()}</p>
    <p style="text-align: center;">
      <a href="${downloadUrl}" class="button">Baixar Relatório</a>
    </p>
    <p>Ou copie e cole este link no seu navegador:</p>
    <p style="word-break: break-all; color: #2E7D32;">${downloadUrl}</p>
  </div>
  <div class="footer">
    <p>BridgeAI Hub - Sistema de Gestão</p>
    <p>Este é um email automático, por favor não responda.</p>
  </div>
</body>
</html>
  `;
}


