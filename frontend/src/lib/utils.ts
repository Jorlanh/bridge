import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Abre o WhatsApp com uma mensagem personalizada
 * @param phoneNumber - Número de telefone no formato internacional (ex: +5519995555280)
 * @param message - Mensagem personalizada a ser enviada
 */
export function openWhatsApp(phoneNumber: string = "+5519995555280", message: string = "Olá! Gostaria de saber mais sobre a BridgeAI Hub.") {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodedMessage}`;
  window.open(whatsappUrl, "_blank");
}
