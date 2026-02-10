import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { paymentApi, type Plan, type CreateSubscriptionData } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Zap,
  Crown,
  Check,
  Loader2,
  CreditCard,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Lock,
  Shield,
  Sparkles,
  MessageSquare,
  Share2,
  Brain,
  BarChart3,
  Users,
  GraduationCap,
  Clock,
  Star,
} from "lucide-react";
import { format } from "date-fns";

export default function Plans() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<"essencial" | "profissional" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card" | "debit_card" | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [step, setStep] = useState<"plans" | "payment" | "summary">("plans");
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
  const [subscriptionResult, setSubscriptionResult] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const result = await paymentApi.getPlans();
      setPlans(result.plans);
    } catch (error: any) {
      toast.error("Erro ao carregar planos");
      console.error(error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSelectPlan = (planId: "essencial" | "profissional") => {
    setSelectedPlan(planId);
    setStep("payment");
  };

  const handleBackToPlans = () => {
    setStep("plans");
    setPaymentMethod(null);
    setCreditCardData({
      holderName: "",
      number: "",
      expiryMonth: "",
      expiryYear: "",
      ccv: "",
    });
    setBillingAddress({
      postalCode: "",
      address: "",
      addressNumber: "",
      addressComplement: "",
      city: "",
      state: "",
    });
  };

  const handlePaymentMethodSelect = (method: "pix" | "credit_card" | "debit_card") => {
    setPaymentMethod(method);
  };

  // Buscar endereço pelo CEP usando ViaCEP
  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setBillingAddress((prev) => ({
          ...prev,
          address: data.logradouro || "",
          city: data.localidade || "",
          state: data.uf || "",
          province: data.bairro || "",
        }));
        toast.success("Endereço encontrado!");
      } else {
        toast.error("CEP não encontrado");
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP");
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setLoadingCep(false);
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

  const handleCheckout = async () => {
    if (!selectedPlan || !paymentMethod) return;

    setLoading(true);
    try {
      const subscriptionData: CreateSubscriptionData = {
        planId: selectedPlan,
        paymentMethod: paymentMethod === "credit_card" || paymentMethod === "debit_card" 
          ? paymentMethod 
          : "pix",
        ...((paymentMethod === "credit_card" || paymentMethod === "debit_card") && {
          creditCard: creditCardData,
          billingAddress,
        }),
      };

      const result = await paymentApi.createSubscription(subscriptionData);
      setSubscriptionResult(result);
      setStep("summary");

      if (result.payment) {
        if (result.payment.pixQrCode) {
          toast.success("Assinatura criada! Escaneie o QR Code PIX para pagar.");
        } else if (result.payment.invoiceUrl) {
          toast.success("Assinatura criada! Acesse o boleto para pagar.");
        }
      } else {
        toast.success("Assinatura criada com sucesso!");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar assinatura");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  // Features dos planos
  const planFeatures = {
    essencial: [
      { icon: Sparkles, text: "Automações ilimitadas" },
      { icon: MessageSquare, text: "Mensagens ilimitadas de chatbot" },
      { icon: Share2, text: "WhatsApp + Instagram + Facebook" },
      { icon: Brain, text: "CRM inteligente integrado" },
      { icon: GraduationCap, text: "Acesso completo à Academy" },
      { icon: Share2, text: "Gestão de Redes Sociais" },
      { icon: Brain, text: "Gerador de Assistente Virtual" },
      { icon: BarChart3, text: "Relatórios avançados com IA" },
      { icon: MessageSquare, text: "Suporte prioritário via WhatsApp" },
    ],
    profissional: [
      { icon: Crown, text: "Tudo do plano Essencial" },
      { icon: Users, text: "2 horas de mentoria semanal em grupo" },
      { icon: Sparkles, text: "Automações ilimitadas" },
      { icon: MessageSquare, text: "Mensagens ilimitadas de chatbot" },
      { icon: Share2, text: "WhatsApp + Instagram + Facebook" },
      { icon: Brain, text: "CRM inteligente integrado" },
      { icon: GraduationCap, text: "Acesso completo à Academy" },
      { icon: Share2, text: "Gestão de Redes Sociais" },
      { icon: Brain, text: "Gerador de Assistente Virtual" },
      { icon: BarChart3, text: "Relatórios avançados com IA" },
      { icon: MessageSquare, text: "Suporte prioritário via WhatsApp" },
      { icon: Star, text: "Acesso exclusivo a eventos e workshops" },
    ],
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col w-full md:w-auto">
        <DashboardHeader
          title={step === "plans" ? "Escolha seu Plano" : step === "payment" ? "Pagamento" : "Resumo da Compra"}
          subtitle={
            step === "plans"
              ? "Selecione o plano ideal para você"
              : step === "payment"
              ? "Complete seu pagamento"
              : "Confira os detalhes da sua assinatura"
          }
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {step === "plans" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {loadingPlans ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="text-center space-y-2 pb-6">
                      <h2 className="text-2xl md:text-3xl font-bold">Escolha o plano ideal para você</h2>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Sem contratos longos, cancele quando quiser
                      </p>
                    </div>

                    {/* Planos */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-3 lg:gap-4 max-w-4xl mx-auto">
                      {plans.map((plan) => {
                        const Icon = plan.id === "profissional" ? Crown : Zap;
                        const isPopular = plan.id === "profissional";
                        const features = planFeatures[plan.id as keyof typeof planFeatures] || [];
                        const description =
                          plan.id === "profissional"
                            ? "Tudo do Essencial + mentoria em grupo para acelerar seus resultados"
                            : "Acesso completo a todas as ferramentas de automação e IA da plataforma";

                        return (
                          <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: plan.id === "essencial" ? 0 : 0.1 }}
                            whileHover={{ y: -8 }}
                            className="h-full"
                          >
                            <Card
                              className={`relative h-full transition-all duration-300 ${
                                isPopular
                                  ? "border-2 border-primary shadow-lg shadow-primary/10 bg-gradient-to-b from-primary/10 to-background"
                                  : "border hover:border-primary/50 hover:shadow-md"
                              }`}
                            >
                              {isPopular && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-semibold rounded-full shadow-md whitespace-nowrap"
                                >
                                  ⭐ Mais Popular
                                </motion.div>
                              )}

                              <CardHeader className="pb-3 px-4 pt-4">
                                {/* Icon and Title */}
                                <div className="flex flex-col items-center text-center mb-3">
                                  <motion.div
                                    className={`p-2 rounded-lg mb-2 ${
                                      isPopular
                                        ? "bg-gradient-to-br from-primary/30 to-primary/10"
                                        : "bg-muted"
                                    }`}
                                    whileHover={{ rotate: 10, scale: 1.1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                  >
                                    <Icon
                                      className={`w-5 h-5 ${
                                        isPopular ? "text-primary" : "text-muted-foreground"
                                      }`}
                                    />
                                  </motion.div>
                                  <CardTitle className="text-lg font-bold mb-1">
                                    {plan.name}
                                  </CardTitle>
                                  <CardDescription className="text-[10px] max-w-sm leading-tight">
                                    {description}
                                  </CardDescription>
                                </div>

                                {/* Price */}
                                <div className="flex items-end justify-center gap-1 mb-1">
                                  <span className="text-muted-foreground text-sm">R$</span>
                                  <motion.span
                                    className={`text-3xl md:text-4xl font-bold ${
                                      isPopular ? "text-primary" : ""
                                    }`}
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                  >
                                    {plan.price.toFixed(2)}
                                  </motion.span>
                                  <span className="text-muted-foreground mb-1.5 text-sm">
                                    /mês
                                  </span>
                                </div>
                              </CardHeader>

                              <CardContent className="space-y-3 pt-0 px-4 pb-4">
                                {/* Features */}
                                <div className="space-y-2">
                                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center">
                                    O que está incluído:
                                  </h3>
                                  <ul className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                                    {features.map((feature, index) => {
                                      const FeatureIcon = feature.icon;
                                      return (
                                        <motion.li
                                          key={index}
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: index * 0.02 }}
                                          className="flex items-start gap-1.5 group"
                                        >
                                          <div
                                            className={`p-0.5 rounded mt-0.5 flex-shrink-0 transition-colors ${
                                              isPopular
                                                ? "bg-primary text-primary-foreground group-hover:bg-primary/90"
                                                : "bg-muted-foreground/20 text-muted-foreground group-hover:bg-muted-foreground/30"
                                            }`}
                                          >
                                            <Check className="w-2.5 h-2.5" />
                                          </div>
                                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                            <FeatureIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                            <span className="text-[10px] text-foreground leading-tight">
                                              {feature.text}
                                            </span>
                                          </div>
                                        </motion.li>
                                      );
                                    })}
                                  </ul>
                                </div>

                                <Separator className="my-3" />

                                {/* CTA Button */}
                                <motion.div 
                                  whileHover={{ scale: 1.02 }} 
                                  whileTap={{ scale: 0.98 }}
                                  className="space-y-1.5"
                                >
                                  <Button
                                    className="w-full h-9 text-xs font-semibold shadow-md"
                                    variant={isPopular ? "default" : "outline"}
                                    size="sm"
                                    onClick={() =>
                                      handleSelectPlan(plan.id as "essencial" | "profissional")
                                    }
                                  >
                                    {isPopular ? (
                                      <>
                                        <Crown className="w-3.5 h-3.5 mr-1.5" />
                                        Escolher {plan.name}
                                      </>
                                    ) : (
                                      <>
                                        <Zap className="w-3.5 h-3.5 mr-1.5" />
                                        Escolher {plan.name}
                                      </>
                                    )}
                                  </Button>

                                  {/* Badge de garantia */}
                                  <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
                                    <Shield className="w-2.5 h-2.5" />
                                    <span>Cancele a qualquer momento</span>
                                  </div>
                                </motion.div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Comparação */}
                    <Card className="bg-muted/30 border mt-6">
                      <CardHeader className="text-center pb-3">
                        <CardTitle className="text-lg font-bold mb-1">
                          Por que escolher a BridgeAI Hub?
                        </CardTitle>
                        <CardDescription className="text-sm">
                          Benefícios exclusivos para impulsionar seu negócio
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-2 text-center"
                          >
                            <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-md">
                              <Lock className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm">Segurança</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Seus dados protegidos com criptografia de ponta
                            </p>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-2 text-center"
                          >
                            <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-md">
                              <Clock className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm">Suporte 24/7</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Equipe sempre disponível para ajudar você
                            </p>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-2 text-center"
                          >
                            <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-md">
                              <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm">Atualizações Constantes</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Novos recursos e melhorias regularmente
                            </p>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </motion.div>
            )}

            {step === "payment" && selectedPlanData && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Resumo do Plano */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo do Plano</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selectedPlan === "profissional" ? (
                          <Crown className="w-5 h-5 text-primary" />
                        ) : (
                          <Zap className="w-5 h-5 text-primary" />
                        )}
                        <div>
                          <p className="font-semibold">{selectedPlanData.name}</p>
                          <p className="text-sm text-muted-foreground">Assinatura mensal</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">R$ {selectedPlanData.price.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">/mês</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-xl">R$ {selectedPlanData.price.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Método de Pagamento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Método de Pagamento</CardTitle>
                    <CardDescription>Escolha como deseja pagar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={paymentMethod || ""}
                      onValueChange={(value) =>
                        handlePaymentMethodSelect(value as "pix" | "credit_card" | "debit_card")
                      }
                      className="space-y-4"
                    >
                      <div
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentMethod === "pix"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => handlePaymentMethodSelect("pix")}
                      >
                        <RadioGroupItem value="pix" id="pix" />
                        <Label
                          htmlFor="pix"
                          className="flex-1 cursor-pointer flex items-center gap-3"
                        >
                          <QrCode className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-semibold">PIX</p>
                            <p className="text-sm text-muted-foreground">
                              Aprovação imediata
                            </p>
                          </div>
                        </Label>
                      </div>

                      <div
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentMethod === "credit_card"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => handlePaymentMethodSelect("credit_card")}
                      >
                        <RadioGroupItem value="credit_card" id="credit_card" />
                        <Label
                          htmlFor="credit_card"
                          className="flex-1 cursor-pointer flex items-center gap-3"
                        >
                          <CreditCard className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-semibold">Cartão de Crédito</p>
                            <p className="text-sm text-muted-foreground">
                              Débito automático mensal
                            </p>
                          </div>
                        </Label>
                      </div>

                      <div
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentMethod === "debit_card"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => handlePaymentMethodSelect("debit_card")}
                      >
                        <RadioGroupItem value="debit_card" id="debit_card" />
                        <Label
                          htmlFor="debit_card"
                          className="flex-1 cursor-pointer flex items-center gap-3"
                        >
                          <CreditCard className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-semibold">Cartão de Débito</p>
                            <p className="text-sm text-muted-foreground">
                              Débito automático mensal
                            </p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Dados do Cartão */}
                {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Dados do Cartão</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="holderName">Nome no Cartão *</Label>
                          <Input
                            id="holderName"
                            value={creditCardData.holderName}
                            onChange={(e) =>
                              setCreditCardData({
                                ...creditCardData,
                                holderName: e.target.value,
                              })
                            }
                            placeholder="Nome como está no cartão"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Número do Cartão *</Label>
                          <Input
                            id="cardNumber"
                            value={creditCardData.number}
                            onChange={(e) =>
                              setCreditCardData({
                                ...creditCardData,
                                number: formatCardNumber(e.target.value),
                              })
                            }
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
                              onChange={(e) =>
                                setCreditCardData({
                                  ...creditCardData,
                                  expiryMonth: formatExpiryMonth(e.target.value),
                                })
                              }
                              placeholder="MM"
                              maxLength={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="expiryYear">Ano *</Label>
                            <Input
                              id="expiryYear"
                              value={creditCardData.expiryYear}
                              onChange={(e) =>
                                setCreditCardData({
                                  ...creditCardData,
                                  expiryYear: formatExpiryYear(e.target.value),
                                })
                              }
                              placeholder="AAAA"
                              maxLength={4}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ccv">CVV *</Label>
                            <Input
                              id="ccv"
                              value={creditCardData.ccv}
                              onChange={(e) =>
                                setCreditCardData({
                                  ...creditCardData,
                                  ccv: formatCCV(e.target.value),
                                })
                              }
                              placeholder="123"
                              maxLength={4}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Endereço de Cobrança</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="postalCode">CEP *</Label>
                            <div className="relative">
                              <Input
                                id="postalCode"
                                value={billingAddress.postalCode}
                                onChange={(e) => {
                                  const formatted = formatCEP(e.target.value);
                                  setBillingAddress({
                                    ...billingAddress,
                                    postalCode: formatted,
                                  });
                                  // Buscar endereço quando CEP estiver completo
                                  if (formatted.replace(/\D/g, "").length === 8) {
                                    fetchAddressByCep(formatted);
                                  }
                                }}
                                placeholder="00000-000"
                                maxLength={9}
                                disabled={loadingCep}
                              />
                              {loadingCep && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="addressNumber">Número *</Label>
                            <Input
                              id="addressNumber"
                              value={billingAddress.addressNumber}
                              onChange={(e) =>
                                setBillingAddress({
                                  ...billingAddress,
                                  addressNumber: e.target.value,
                                })
                              }
                              placeholder="123"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Endereço *</Label>
                          <Input
                            id="address"
                            value={billingAddress.address}
                            onChange={(e) =>
                              setBillingAddress({
                                ...billingAddress,
                                address: e.target.value,
                              })
                            }
                            placeholder="Rua, Avenida, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="addressComplement">Complemento</Label>
                          <Input
                            id="addressComplement"
                            value={billingAddress.addressComplement}
                            onChange={(e) =>
                              setBillingAddress({
                                ...billingAddress,
                                addressComplement: e.target.value,
                              })
                            }
                            placeholder="Apto, Bloco, etc."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">Cidade *</Label>
                            <Input
                              id="city"
                              value={billingAddress.city}
                              onChange={(e) =>
                                setBillingAddress({
                                  ...billingAddress,
                                  city: e.target.value,
                                })
                              }
                              placeholder="Cidade"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">Estado *</Label>
                            <Input
                              id="state"
                              value={billingAddress.state}
                              onChange={(e) =>
                                setBillingAddress({
                                  ...billingAddress,
                                  state: e.target.value.toUpperCase(),
                                })
                              }
                              placeholder="SP"
                              maxLength={2}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Botões de Navegação */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={handleBackToPlans}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    disabled={
                      loading ||
                      !paymentMethod ||
                      ((paymentMethod === "credit_card" || paymentMethod === "debit_card") &&
                        (!creditCardData.holderName ||
                          !creditCardData.number ||
                          !creditCardData.expiryMonth ||
                          !creditCardData.expiryYear ||
                          !creditCardData.ccv ||
                          !billingAddress.postalCode ||
                          !billingAddress.address ||
                          !billingAddress.addressNumber ||
                          !billingAddress.city ||
                          !billingAddress.state))
                    }
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        Finalizar Compra
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "summary" && subscriptionResult && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="border-success">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-success">
                      <Shield className="w-5 h-5" />
                      <CardTitle className="text-lg">Assinatura Criada com Sucesso!</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {subscriptionResult.subscription.planId === "profissional" ? (
                            <Crown className="w-5 h-5 text-primary" />
                          ) : (
                            <Zap className="w-5 h-5 text-primary" />
                          )}
                          <div>
                            <p className="font-semibold">
                              {subscriptionResult.subscription.planName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Status: {subscriptionResult.subscription.status === "active" && "Ativo"}
                              {subscriptionResult.subscription.status === "pending" &&
                                "Aguardando pagamento"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            R$ {subscriptionResult.subscription.price.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">/mês</p>
                        </div>
                      </div>

                      {subscriptionResult.subscription.nextBillingDate && (
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Próxima cobrança:{" "}
                            {format(
                              new Date(subscriptionResult.subscription.nextBillingDate),
                              "dd/MM/yyyy"
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {subscriptionResult.payment && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="font-semibold">Detalhes do Pagamento</h3>
                          {subscriptionResult.payment.pixQrCode && (
                            <div className="space-y-4">
                              <div className="p-4 bg-muted rounded-lg text-center">
                                <p className="text-sm font-semibold mb-2">
                                  Escaneie o QR Code para pagar
                                </p>
                                <div className="flex justify-center">
                                  <img
                                    src={subscriptionResult.payment.pixQrCodeUrl || subscriptionResult.payment.pixQrCode}
                                    alt="QR Code PIX"
                                    className="w-48 h-48 border rounded-lg"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Ou copie o código PIX abaixo
                                </p>
                                <div className="mt-2 p-2 bg-background rounded border text-xs font-mono break-all">
                                  {subscriptionResult.payment.pixQrCode}
                                </div>
                              </div>
                            </div>
                          )}

                          {subscriptionResult.payment.invoiceUrl && (
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm font-semibold mb-2">Boleto Bancário</p>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  window.open(subscriptionResult.payment.invoiceUrl, "_blank")
                                }
                                className="w-full"
                              >
                                Abrir Boleto
                              </Button>
                            </div>
                          )}

                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Valor:</span>
                              <span className="font-semibold">
                                R$ {subscriptionResult.payment.amount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                              <span className="text-muted-foreground">Status:</span>
                              <span
                                className={`font-semibold ${
                                  subscriptionResult.payment.status === "pending"
                                    ? "text-warning"
                                    : subscriptionResult.payment.status === "confirmed" ||
                                      subscriptionResult.payment.status === "received"
                                    ? "text-success"
                                    : ""
                                }`}
                              >
                                {subscriptionResult.payment.status === "pending" &&
                                  "Aguardando pagamento"}
                                {subscriptionResult.payment.status === "confirmed" && "Confirmado"}
                                {subscriptionResult.payment.status === "received" && "Recebido"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => navigate("/dashboard")}
                        className="flex-1"
                      >
                        Ir para Dashboard
                      </Button>
                      <Button
                        onClick={() => navigate("/perfil")}
                        className="flex-1"
                      >
                        Ver meu Perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

