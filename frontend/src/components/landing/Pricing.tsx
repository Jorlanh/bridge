import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { openWhatsApp } from "@/lib/utils";
import { paymentApi, type Plan, type CreateSubscriptionData } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { auth } from "@/lib/auth";

const plans = [
  {
    name: "Essencial",
    description: "Acesso completo a todas as ferramentas de automação e IA da plataforma",
    price: "497",
    period: "/mês",
    icon: Zap,
    popular: false,
    features: [
      "Automações ilimitadas",
      "Mensagens ilimitadas de chatbot",
      "WhatsApp + Instagram + Facebook",
      "CRM inteligente integrado",
      "Acesso completo à Academy",
      "Gestão de Redes Sociais",
      "Gerador de Assistente Virtual",
      "Relatórios avançados com IA",
      "Suporte prioritário via WhatsApp",
    ],
    cta: "Começar agora",
  },
  {
    name: "Profissional",
    description: "Tudo do Essencial + mentoria em grupo para acelerar seus resultados",
    price: "797",
    period: "/mês",
    icon: Crown,
    popular: true,
    features: [
      "Tudo do plano Essencial",
      "2 horas de mentoria semanal em grupo",
      "Automações ilimitadas",
      "Mensagens ilimitadas de chatbot",
      "WhatsApp + Instagram + Facebook",
      "CRM inteligente integrado",
      "Acesso completo à Academy",
      "Gestão de Redes Sociais",
      "Gerador de Assistente Virtual",
      "Relatórios avançados com IA",
      "Suporte prioritário via WhatsApp",
    ],
    cta: "Escolher Profissional",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

export function Pricing() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"essencial" | "profissional" | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "debit_card" | "pix" | "boleto">("pix");
  const [creditCardData, setCreditCardData] = useState({
    holderName: "",
    number: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: "",
  });
  const [billingAddress, setBillingAddress] = useState({
    postalCode: "",
    address: "",
    addressNumber: "",
    addressComplement: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const result = await paymentApi.getPlans();
      setPlans(result.plans);
    } catch (error: any) {
      console.error("Erro ao carregar planos:", error);
    }
  };

  const handlePlanClick = (planId: "essencial" | "profissional") => {
    if (!auth.isAuthenticated()) {
      toast.error("Por favor, faça login para assinar um plano");
      return;
    }
    setSelectedPlan(planId);
    setCheckoutOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      const subscriptionData: CreateSubscriptionData = {
        planId: selectedPlan,
        paymentMethod,
        ...(paymentMethod === "credit_card" && {
          creditCard: creditCardData,
          billingAddress,
        }),
        ...(paymentMethod === "debit_card" && {
          billingAddress,
        }),
      };

      const result = await paymentApi.createSubscription(subscriptionData);

      if (result.payment) {
        // Pagamento PIX ou Boleto
        if (result.payment.pixQrCode) {
          toast.success("Assinatura criada! Escaneie o QR Code PIX para pagar.");
          // Aqui você pode abrir um modal com o QR Code
        } else if (result.payment.invoiceUrl) {
          toast.success("Assinatura criada! Acesse o boleto para pagar.");
          window.open(result.payment.invoiceUrl, "_blank");
        }
      } else {
        toast.success("Assinatura criada com sucesso!");
      }

      setCheckoutOpen(false);
      setSelectedPlan(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar assinatura");
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiryMonth = (value: string) => {
    const num = value.replace(/\D/g, "");
    if (num.length > 2) return num.slice(0, 2);
    return num;
  };

  const formatExpiryYear = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 4);
  };

  const formatCCV = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 4);
  };

  const formatCEP = (value: string) => {
    const num = value.replace(/\D/g, "");
    if (num.length > 5) return `${num.slice(0, 5)}-${num.slice(5, 8)}`;
    return num;
  };

  const planData = [
    {
      id: "essencial" as const,
      name: "Essencial",
      description: "Acesso completo a todas as ferramentas de automação e IA da plataforma",
      price: plans.find((p) => p.id === "essencial")?.price || 497,
      period: "/mês",
      icon: Zap,
      popular: false,
      features: [
        "Automações ilimitadas",
        "Mensagens ilimitadas de chatbot",
        "WhatsApp + Instagram + Facebook",
        "CRM inteligente integrado",
        "Acesso completo à Academy",
        "Gestão de Redes Sociais",
        "Gerador de Assistente Virtual",
        "Relatórios avançados com IA",
        "Suporte prioritário via WhatsApp",
      ],
      cta: "Começar agora",
    },
    {
      id: "profissional" as const,
      name: "Profissional",
      description: "Tudo do Essencial + mentoria em grupo para acelerar seus resultados",
      price: plans.find((p) => p.id === "profissional")?.price || 797,
      period: "/mês",
      icon: Crown,
      popular: true,
      features: [
        "Tudo do plano Essencial",
        "2 horas de mentoria semanal em grupo",
        "Automações ilimitadas",
        "Mensagens ilimitadas de chatbot",
        "WhatsApp + Instagram + Facebook",
        "CRM inteligente integrado",
        "Acesso completo à Academy",
        "Gestão de Redes Sociais",
        "Gerador de Assistente Virtual",
        "Relatórios avançados com IA",
        "Suporte prioritário via WhatsApp",
      ],
      cta: "Escolher Profissional",
    },
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Planos & Preços</span>
          </motion.div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Invista no <span className="text-gradient">presente e no futuro</span> da sua empresa
          </h2>
          <p className="text-xl text-muted-foreground">
            Escolha o plano ideal para transformar sua operação com inteligência artificial.
            Sem contratos longos, cancele quando quiser.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div 
          className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {planData.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? "bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary shadow-2xl shadow-primary/20"
                    : "bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50"
                }`}
                variants={cardVariants}
                whileHover={{ 
                  y: -12,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <motion.div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
                  >
                    Mais Popular
                  </motion.div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <motion.div 
                    className={`inline-flex p-3 rounded-xl mb-4 ${
                      plan.popular ? "bg-primary/20" : "bg-muted"
                    }`}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Icon className={`w-8 h-8 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                  </motion.div>
                  <h3 className="font-display text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <motion.div 
                  className="text-center mb-8"
                  initial={{ scale: 0.9 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-muted-foreground">R$</span>
                    <motion.span 
                      className={`font-display text-5xl font-bold ${plan.popular ? "text-primary" : ""}`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {plan.price}
                    </motion.span>
                    <span className="text-muted-foreground mb-2">{plan.period}</span>
                  </div>
                </motion.div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.li 
                      key={feature} 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: featureIndex * 0.05 }}
                    >
                      <motion.div 
                        className={`p-0.5 rounded-full mt-0.5 ${plan.popular ? "bg-primary" : "bg-muted-foreground"}`}
                        whileHover={{ scale: 1.3 }}
                      >
                        <Check className="w-3 h-3 text-background" />
                      </motion.div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    onClick={() => handlePlanClick(plan.id)}
                  >
                    {plan.cta}
                  </Button>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom Note */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-muted-foreground">
            Precisa de algo personalizado?{" "}
            <motion.a 
              href="#" 
              className="text-primary hover:underline"
              whileHover={{ scale: 1.05 }}
              onClick={(e) => {
                e.preventDefault();
                openWhatsApp("+5519995555280", "Olá! Preciso de uma solução personalizada da BridgeAI Hub.");
              }}
            >
              Fale com nossa equipe
            </motion.a>
          </p>
        </motion.div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Assinatura</DialogTitle>
            <DialogDescription>
              Escolha o método de pagamento para o plano {selectedPlan === "essencial" ? "Essencial" : "Profissional"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Método de Pagamento */}
            <div className="space-y-3">
              <Label>Método de Pagamento</Label>
              <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix" className="cursor-pointer">PIX (Aprovação imediata)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit_card" id="credit_card" />
                  <Label htmlFor="credit_card" className="cursor-pointer">Cartão de Crédito</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="debit_card" id="debit_card" />
                  <Label htmlFor="debit_card" className="cursor-pointer">Cartão de Débito</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="boleto" id="boleto" />
                  <Label htmlFor="boleto" className="cursor-pointer">Boleto Bancário</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Dados do Cartão */}
            {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
              <div className="space-y-4 border p-4 rounded-lg">
                <h3 className="font-semibold">Dados do Cartão</h3>
                <div className="space-y-2">
                  <Label htmlFor="holderName">Nome no Cartão *</Label>
                  <Input
                    id="holderName"
                    value={creditCardData.holderName}
                    onChange={(e) => setCreditCardData({ ...creditCardData, holderName: e.target.value })}
                    placeholder="Nome como está no cartão"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número do Cartão *</Label>
                  <Input
                    id="cardNumber"
                    value={creditCardData.number}
                    onChange={(e) => setCreditCardData({ ...creditCardData, number: formatCardNumber(e.target.value) })}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryMonth">Mês *</Label>
                    <Input
                      id="expiryMonth"
                      value={creditCardData.expiryMonth}
                      onChange={(e) => setCreditCardData({ ...creditCardData, expiryMonth: formatExpiryMonth(e.target.value) })}
                      placeholder="MM"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryYear">Ano *</Label>
                    <Input
                      id="expiryYear"
                      value={creditCardData.expiryYear}
                      onChange={(e) => setCreditCardData({ ...creditCardData, expiryYear: formatExpiryYear(e.target.value) })}
                      placeholder="AAAA"
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ccv">CVV *</Label>
                    <Input
                      id="ccv"
                      value={creditCardData.ccv}
                      onChange={(e) => setCreditCardData({ ...creditCardData, ccv: formatCCV(e.target.value) })}
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Endereço de Cobrança */}
            {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
              <div className="space-y-4 border p-4 rounded-lg">
                <h3 className="font-semibold">Endereço de Cobrança</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">CEP *</Label>
                    <Input
                      id="postalCode"
                      value={billingAddress.postalCode}
                      onChange={(e) => setBillingAddress({ ...billingAddress, postalCode: formatCEP(e.target.value) })}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressNumber">Número *</Label>
                    <Input
                      id="addressNumber"
                      value={billingAddress.addressNumber}
                      onChange={(e) => setBillingAddress({ ...billingAddress, addressNumber: e.target.value })}
                      placeholder="123"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço *</Label>
                  <Input
                    id="address"
                    value={billingAddress.address}
                    onChange={(e) => setBillingAddress({ ...billingAddress, address: e.target.value })}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressComplement">Complemento</Label>
                  <Input
                    id="addressComplement"
                    value={billingAddress.addressComplement}
                    onChange={(e) => setBillingAddress({ ...billingAddress, addressComplement: e.target.value })}
                    placeholder="Apto, Bloco, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={billingAddress.city}
                      onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      value={billingAddress.state}
                      onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value.toUpperCase() })}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resumo */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-2xl font-bold">
                  R$ {planData.find((p) => p.id === selectedPlan)?.price.toFixed(2) || "0,00"}
                </span>
              </div>
            </div>

            {/* Botão de Finalizar */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckout}
              disabled={loading || (paymentMethod === "credit_card" && (!creditCardData.holderName || !creditCardData.number || !creditCardData.expiryMonth || !creditCardData.expiryYear || !creditCardData.ccv))}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Finalizar Assinatura"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
