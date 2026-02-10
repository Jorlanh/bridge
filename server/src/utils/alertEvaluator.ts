import { AlertRule } from "../models/AlertRule.js";
import { createNotification } from "./notifications.js";

/**
 * Avalia se uma regra de alerta deve ser acionada baseado nos dados fornecidos
 */
export async function evaluateAlertRule(
  rule: any,
  data: Record<string, any>
): Promise<boolean> {
  if (!rule.enabled) {
    return false;
  }

  // Verificar frequência de trigger
  if (rule.triggerFrequency === "once" && rule.triggerCount > 0) {
    return false;
  }

  if (rule.triggerFrequency === "daily" && rule.lastTriggered) {
    const lastTriggered = new Date(rule.lastTriggered);
    const now = new Date();
    const diffHours = (now.getTime() - lastTriggered.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      return false;
    }
  }

  if (rule.triggerFrequency === "weekly" && rule.lastTriggered) {
    const lastTriggered = new Date(rule.lastTriggered);
    const now = new Date();
    const diffDays = (now.getTime() - lastTriggered.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 7) {
      return false;
    }
  }

  // Avaliar condição
  const fieldValue = getNestedValue(data, rule.condition.field);
  const shouldTrigger = evaluateCondition(
    fieldValue,
    rule.condition.operator,
    rule.condition.value
  );

  if (shouldTrigger) {
    // Atualizar regra
    rule.lastTriggered = new Date();
    rule.triggerCount += 1;
    await rule.save();

    // Enviar notificações
    await sendAlertNotifications(rule, data);

    return true;
  }

  return false;
}

/**
 * Obtém valor aninhado de um objeto usando notação de ponto (ex: "campaign.conversion")
 */
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, prop) => {
    return current && current[prop] !== undefined ? current[prop] : undefined;
  }, obj);
}

/**
 * Avalia uma condição
 */
function evaluateCondition(
  fieldValue: any,
  operator: string,
  expectedValue?: any
): boolean {
  switch (operator) {
    case "equals":
      return fieldValue === expectedValue;
    case "greater_than":
      return typeof fieldValue === "number" && typeof expectedValue === "number" && fieldValue > expectedValue;
    case "less_than":
      return typeof fieldValue === "number" && typeof expectedValue === "number" && fieldValue < expectedValue;
    case "contains":
      return typeof fieldValue === "string" && fieldValue.includes(expectedValue);
    case "changed":
      return fieldValue !== undefined;
    case "reached":
      return typeof fieldValue === "number" && typeof expectedValue === "number" && fieldValue >= expectedValue;
    default:
      return false;
  }
}

/**
 * Envia notificações baseado nos canais configurados
 */
async function sendAlertNotifications(rule: any, data: Record<string, any>): Promise<void> {
  const title = `Alerta: ${rule.name}`;
  const message = formatAlertMessage(rule, data);

  // Notificação in-app
  if (rule.notificationChannels.inApp) {
    await createNotification({
      userId: rule.userId,
      title,
      message,
      type: "warning",
      sendPush: rule.notificationChannels.push,
    });
  }

  // Email - agora implementado
  if (rule.notificationChannels.email) {
    await createNotification({
      userId: rule.userId,
      title,
      message,
      type: "warning",
      sendPush: false, // Já enviado acima se necessário
      sendEmail: true, // Enviar por email
      sendWhatsApp: false,
    });
  }
}

/**
 * Formata mensagem do alerta
 */
function formatAlertMessage(rule: any, data: Record<string, any>): string {
  const fieldValue = getNestedValue(data, rule.condition.field);
  const operatorMap: Record<string, string> = {
    equals: "é igual a",
    greater_than: "é maior que",
    less_than: "é menor que",
    contains: "contém",
    changed: "foi alterado",
    reached: "atingiu",
  };
  const operatorText = operatorMap[rule.condition.operator] || rule.condition.operator;

  if (rule.condition.operator === "changed") {
    return `${rule.condition.field} foi alterado para: ${JSON.stringify(fieldValue)}`;
  }

  return `${rule.condition.field} ${operatorText} ${rule.condition.value}. Valor atual: ${fieldValue}`;
}

/**
 * Avalia todas as regras de alerta ativas para um módulo e dados específicos
 */
export async function evaluateModuleAlerts(
  userId: string,
  module: string,
  data: Record<string, any>
): Promise<void> {
  try {
    const rules = await AlertRule.find({
      userId,
      module,
      enabled: true,
    });

    for (const rule of rules) {
      await evaluateAlertRule(rule, data);
    }
  } catch (error) {
    console.error("Erro ao avaliar alertas do módulo:", error);
  }
}





