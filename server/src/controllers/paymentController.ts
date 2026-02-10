import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Subscription } from "../models/Subscription.js";
import { Payment } from "../models/Payment.js";
import { asaasService, AsaasCustomer, AsaasSubscription, AsaasPayment } from "../services/asaasService.js";
import { createNotification } from "../utils/notifications.js";

// Planos disponíveis
const PLANS = {
  essencial: {
    id: "essencial",
    name: "Essencial",
    price: 49700, // R$ 497,00 em centavos
  },
  profissional: {
    id: "profissional",
    name: "Profissional",
    price: 79700, // R$ 797,00 em centavos
  },
};

// Schema de validação para criar assinatura
const createSubscriptionSchema = z.object({
  planId: z.enum(["essencial", "profissional"]),
  paymentMethod: z.enum(["credit_card", "debit_card", "pix", "boleto"]),
  creditCard: z
    .object({
      holderName: z.string().min(3),
      number: z.string().regex(/^\d{13,19}$/),
      expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/),
      expiryYear: z.string().regex(/^\d{4}$/),
      ccv: z.string().regex(/^\d{3,4}$/),
    })
    .optional(),
  billingAddress: z
    .object({
      postalCode: z.string().regex(/^\d{5}-?\d{3}$/),
      address: z.string().min(5),
      addressNumber: z.string(),
      addressComplement: z.string().optional(),
      province: z.string().optional(),
      city: z.string().min(2),
      state: z.string().length(2),
    })
    .optional(),
});

/**
 * Lista os planos disponíveis
 */
export const getPlans = async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      plans: Object.values(PLANS).map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price / 100, // Converter centavos para reais
        priceInCents: plan.price,
      })),
    });
  } catch (error: any) {
    console.error("Erro ao buscar planos:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar planos",
    });
  }
};

/**
 * Cria uma nova assinatura
 */
export const createSubscription = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const validation = createSubscriptionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: validation.error.errors,
      });
    }

    const { planId, paymentMethod, creditCard, billingAddress } = validation.data;
    const plan = PLANS[planId];

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Plano inválido",
      });
    }

    // Verificar se o usuário já tem uma assinatura ativa
    const existingSubscription = await Subscription.findOne({
      userId: req.user._id,
      status: "active",
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "Você já possui uma assinatura ativa",
      });
    }

    // Buscar dados do usuário
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    // Criar ou atualizar cliente no Asaas
    const customerData: AsaasCustomer = {
      name: user.name,
      email: user.email,
      cpfCnpj: user.cpf || user.companyCNPJ || undefined,
      phone: user.phone || undefined,
      ...(billingAddress && {
        postalCode: billingAddress.postalCode.replace(/\D/g, ""),
        address: billingAddress.address,
        addressNumber: billingAddress.addressNumber,
        complement: billingAddress.addressComplement,
        province: billingAddress.province,
        city: billingAddress.city,
        state: billingAddress.state,
      }),
    };

    let asaasCustomerId: string;
    try {
      // Verificar se já existe um customerId salvo (poderia estar no User)
      const customerResult = await asaasService.createOrUpdateCustomer(customerData);
      asaasCustomerId = customerResult.id;
    } catch (error: any) {
      console.error("Erro ao criar cliente no Asaas:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao processar dados do cliente",
      });
    }

    // Mapear método de pagamento
    const asaasBillingType =
      paymentMethod === "credit_card"
        ? "CREDIT_CARD"
        : paymentMethod === "debit_card"
        ? "DEBIT_CARD"
        : paymentMethod === "pix"
        ? "PIX"
        : "BOLETO";

    // Calcular data de vencimento (próximo mês)
    const nextDueDate = new Date();
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    // Criar assinatura no Asaas
    const subscriptionData: AsaasSubscription = {
      customer: asaasCustomerId,
      billingType: asaasBillingType,
      value: plan.price / 100, // Converter centavos para reais
      nextDueDate: nextDueDate.toISOString().split("T")[0],
      cycle: "MONTHLY",
      description: `Assinatura ${plan.name} - BridgeAI Hub`,
      externalReference: `sub_${req.user._id}_${Date.now()}`,
      ...(creditCard && {
        creditCard: {
          holderName: creditCard.holderName,
          number: creditCard.number,
          expiryMonth: creditCard.expiryMonth,
          expiryYear: creditCard.expiryYear,
          ccv: creditCard.ccv,
        },
        creditCardHolderInfo: billingAddress
          ? {
              name: user.name,
              email: user.email,
              cpfCnpj: user.cpf || user.companyCNPJ || "",
              postalCode: billingAddress.postalCode.replace(/\D/g, ""),
              addressNumber: billingAddress.addressNumber,
              addressComplement: billingAddress.addressComplement,
              phone: user.phone || "",
            }
          : undefined,
      }),
    };

    let asaasSubscriptionId: string;
    try {
      const subscriptionResult = await asaasService.createSubscription(subscriptionData);
      asaasSubscriptionId = subscriptionResult.id;
    } catch (error: any) {
      console.error("Erro ao criar assinatura no Asaas:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao criar assinatura",
      });
    }

    // Criar assinatura no banco de dados
    const subscription = new Subscription({
      userId: req.user._id,
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      status: paymentMethod === "pix" || paymentMethod === "boleto" ? "pending" : "active",
      asaasSubscriptionId,
      asaasCustomerId,
      startDate: new Date(),
      nextBillingDate: nextDueDate,
      metadata: {
        billingCycle: "monthly",
      },
    });

    await subscription.save();

    // Se for PIX ou Boleto, criar pagamento pendente
    if (paymentMethod === "pix" || paymentMethod === "boleto") {
      const paymentData: AsaasPayment = {
        customer: asaasCustomerId,
        billingType: asaasBillingType,
        value: plan.price / 100,
        dueDate: new Date().toISOString().split("T")[0],
        description: `Pagamento inicial - Assinatura ${plan.name}`,
        externalReference: `pay_${req.user._id}_${Date.now()}`,
      };

      try {
        const paymentResult = await asaasService.createPayment(paymentData);
        const payment = new Payment({
          userId: req.user._id,
          subscriptionId: subscription._id,
          asaasPaymentId: paymentResult.id,
          amount: plan.price,
          status: "pending",
          paymentMethod: paymentMethod,
          description: `Pagamento inicial - Assinatura ${plan.name}`,
          dueDate: new Date(paymentResult.dueDate || new Date()),
          invoiceUrl: paymentResult.invoiceUrl,
          pixQrCode: paymentResult.pixQrCode,
          pixQrCodeUrl: paymentResult.pixQrCodeUrl,
        });

        await payment.save();

        // Criar notificação
        await createNotification(req.user._id.toString(), {
          title: "Assinatura criada",
          message: `Sua assinatura ${plan.name} foi criada. Aguardando pagamento.`,
          type: "system",
        });

        return res.json({
          success: true,
          subscription: {
            id: subscription._id,
            planId: subscription.planId,
            planName: subscription.planName,
            status: subscription.status,
            nextBillingDate: subscription.nextBillingDate,
          },
          payment: {
            id: payment._id,
            amount: payment.amount / 100,
            status: payment.status,
            paymentMethod: payment.paymentMethod,
            invoiceUrl: payment.invoiceUrl,
            pixQrCode: payment.pixQrCode,
            pixQrCodeUrl: payment.pixQrCodeUrl,
            dueDate: payment.dueDate,
          },
        });
      } catch (error: any) {
        console.error("Erro ao criar pagamento:", error);
        // Continuar mesmo se o pagamento falhar
      }
    }

    // Criar notificação
    await createNotification(req.user._id.toString(), {
      title: "Assinatura ativada",
      message: `Sua assinatura ${plan.name} foi ativada com sucesso!`,
      type: "system",
    });

    res.json({
      success: true,
      subscription: {
        id: subscription._id,
        planId: subscription.planId,
        planName: subscription.planName,
        status: subscription.status,
        nextBillingDate: subscription.nextBillingDate,
      },
    });
  } catch (error: any) {
    console.error("Erro ao criar assinatura:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar assinatura",
    });
  }
};

/**
 * Busca a assinatura atual do usuário
 */
export const getCurrentSubscription = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: { $in: ["active", "pending", "trial"] },
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.json({
        success: true,
        subscription: null,
      });
    }

    res.json({
      success: true,
      subscription: {
        id: subscription._id,
        planId: subscription.planId,
        planName: subscription.planName,
        price: subscription.price / 100,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
        cancelledAt: subscription.cancelledAt,
      },
    });
  } catch (error: any) {
    console.error("Erro ao buscar assinatura:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar assinatura",
    });
  }
};

/**
 * Cancela uma assinatura
 */
export const cancelSubscription = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: "active",
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Assinatura não encontrada",
      });
    }

    // Cancelar no Asaas
    if (subscription.asaasSubscriptionId) {
      try {
        await asaasService.cancelSubscription(subscription.asaasSubscriptionId);
      } catch (error: any) {
        console.error("Erro ao cancelar assinatura no Asaas:", error);
        // Continuar mesmo se falhar no Asaas
      }
    }

    // Atualizar no banco
    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = req.body.reason || "Cancelado pelo usuário";
    await subscription.save();

    // Criar notificação
    await createNotification(req.user._id.toString(), {
      title: "Assinatura cancelada",
      message: `Sua assinatura ${subscription.planName} foi cancelada.`,
      type: "system",
    });

    res.json({
      success: true,
      message: "Assinatura cancelada com sucesso",
      subscription: {
        id: subscription._id,
        status: subscription.status,
        cancelledAt: subscription.cancelledAt,
      },
    });
  } catch (error: any) {
    console.error("Erro ao cancelar assinatura:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao cancelar assinatura",
    });
  }
};

/**
 * Lista pagamentos do usuário
 */
export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    const payments = await Payment.find({
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      payments: payments.map((payment) => ({
        id: payment._id,
        amount: payment.amount / 100,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        description: payment.description,
        dueDate: payment.dueDate,
        paymentDate: payment.paymentDate,
        invoiceUrl: payment.invoiceUrl,
        pixQrCode: payment.pixQrCode,
        pixQrCodeUrl: payment.pixQrCodeUrl,
        createdAt: payment.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Erro ao buscar pagamentos:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar pagamentos",
    });
  }
};

/**
 * Webhook handler para notificações do Asaas
 */
export const handleAsaasWebhook = async (req: any, res: Response) => {
  try {
    const event = req.body.event;
    const payment = req.body.payment;

    if (!event || !payment) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
      });
    }

    // Buscar pagamento pelo ID do Asaas
    const dbPayment = await Payment.findOne({
      asaasPaymentId: payment.id,
    });

    if (!dbPayment) {
      console.log(`Pagamento não encontrado: ${payment.id}`);
      return res.status(404).json({
        success: false,
        message: "Pagamento não encontrado",
      });
    }

    // Atualizar status do pagamento
    const statusMap: Record<string, string> = {
      CONFIRMED: "confirmed",
      RECEIVED: "received",
      OVERDUE: "overdue",
      REFUNDED: "refunded",
      CANCELLED: "cancelled",
      PENDING: "pending",
    };

    const newStatus = statusMap[payment.status] || "pending";
    dbPayment.status = newStatus as any;

    if (payment.paymentDate) {
      dbPayment.paymentDate = new Date(payment.paymentDate);
    }

    await dbPayment.save();

    // Se o pagamento foi confirmado, ativar assinatura
    if (newStatus === "confirmed" || newStatus === "received") {
      const subscription = await Subscription.findById(dbPayment.subscriptionId);
      if (subscription && subscription.status === "pending") {
        subscription.status = "active";
        subscription.startDate = new Date();
        
        // Calcular próxima data de cobrança
        const nextBilling = new Date();
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        subscription.nextBillingDate = nextBilling;
        
        await subscription.save();

        // Criar notificação
        await createNotification(dbPayment.userId.toString(), {
          title: "Pagamento confirmado",
          message: `Seu pagamento foi confirmado e sua assinatura ${subscription.planName} está ativa!`,
          type: "system",
        });
      }
    }

    res.json({
      success: true,
      message: "Webhook processado",
    });
  } catch (error: any) {
    console.error("Erro ao processar webhook do Asaas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao processar webhook",
    });
  }
};

