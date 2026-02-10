import dotenv from "dotenv";

dotenv.config();

const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || "";

interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
}

interface AsaasSubscription {
  id?: string;
  customer: string; // ID do cliente
  billingType: "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "BOLETO";
  value: number; // Valor em reais
  nextDueDate: string; // YYYY-MM-DD
  cycle: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY";
  description?: string;
  externalReference?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
    mobilePhone?: string;
  };
}

interface AsaasPayment {
  id?: string;
  customer: string;
  billingType: "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "BOLETO";
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    addressComplement?: string;
    phone: string;
    mobilePhone?: string;
  };
}

class AsaasService {
  private async makeRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${ASAAS_API_URL}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "access_token": ASAAS_API_KEY,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.errors?.[0]?.description || result.message || "Erro na API Asaas"
        );
      }

      return result;
    } catch (error: any) {
      console.error("Erro na requisição Asaas:", error);
      throw new Error(error.message || "Erro ao comunicar com Asaas");
    }
  }

  /**
   * Cria ou atualiza um cliente no Asaas
   */
  async createOrUpdateCustomer(customerData: AsaasCustomer): Promise<{ id: string }> {
    if (customerData.id) {
      // Atualizar cliente existente
      return this.makeRequest<{ id: string }>("PUT", `/customers/${customerData.id}`, customerData);
    } else {
      // Criar novo cliente
      return this.makeRequest<{ id: string }>("POST", "/customers", customerData);
    }
  }

  /**
   * Busca um cliente no Asaas
   */
  async getCustomer(customerId: string): Promise<AsaasCustomer & { id: string }> {
    return this.makeRequest<AsaasCustomer & { id: string }>("GET", `/customers/${customerId}`);
  }

  /**
   * Cria uma assinatura no Asaas
   */
  async createSubscription(subscriptionData: AsaasSubscription): Promise<{ id: string }> {
    return this.makeRequest<{ id: string }>("POST", "/subscriptions", subscriptionData);
  }

  /**
   * Busca uma assinatura no Asaas
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    return this.makeRequest("GET", `/subscriptions/${subscriptionId}`);
  }

  /**
   * Cancela uma assinatura no Asaas
   */
  async cancelSubscription(subscriptionId: string): Promise<{ id: string }> {
    return this.makeRequest<{ id: string }>("DELETE", `/subscriptions/${subscriptionId}`);
  }

  /**
   * Cria um pagamento único no Asaas
   */
  async createPayment(paymentData: AsaasPayment): Promise<any> {
    return this.makeRequest("POST", "/payments", paymentData);
  }

  /**
   * Busca um pagamento no Asaas
   */
  async getPayment(paymentId: string): Promise<any> {
    return this.makeRequest("GET", `/payments/${paymentId}`);
  }

  /**
   * Gera QR Code PIX para um pagamento
   */
  async getPixQrCode(paymentId: string): Promise<{
    encodedImage: string;
    payload: string;
    expirationDate: string;
  }> {
    return this.makeRequest("GET", `/payments/${paymentId}/pixQrCode`);
  }

  /**
   * Webhook handler - valida e processa notificações do Asaas
   */
  async validateWebhook(event: string, payment: any): Promise<boolean> {
    // Validação básica - em produção, deve validar assinatura do webhook
    return true;
  }
}

export const asaasService = new AsaasService();
export type { AsaasCustomer, AsaasSubscription, AsaasPayment };

