# 📋 Documentação - Integração com Asaas

## 📌 Visão Geral

Este documento descreve a implementação do sistema de pagamentos e assinaturas integrado com a API do Asaas. O sistema permite criar assinaturas mensais, processar pagamentos via PIX, Boleto, Cartão de Crédito e Débito, e gerenciar o ciclo de vida das assinaturas.

---

## ✅ O Que Foi Implementado

### 1. **Modelos de Dados (Backend)**

#### `server/src/models/Subscription.ts`
- **Descrição**: Modelo de assinatura do usuário
- **Campos principais**:
  - `userId`: ID do usuário
  - `planId`: ID do plano ("essencial" ou "profissional")
  - `planName`: Nome do plano
  - `price`: Preço em centavos
  - `status`: Status da assinatura (active, pending, cancelled, expired, trial)
  - `asaasSubscriptionId`: ID da assinatura no Asaas
  - `asaasCustomerId`: ID do cliente no Asaas
  - `startDate`, `endDate`, `nextBillingDate`: Datas importantes
  - `cancelledAt`, `cancellationReason`: Informações de cancelamento
- **Índices**: Índice único para garantir uma assinatura ativa por usuário

#### `server/src/models/Payment.ts`
- **Descrição**: Modelo de pagamento individual
- **Campos principais**:
  - `userId`: ID do usuário
  - `subscriptionId`: ID da assinatura relacionada
  - `asaasPaymentId`: ID do pagamento no Asaas
  - `amount`: Valor em centavos
  - `status`: Status do pagamento (pending, confirmed, received, overdue, refunded, cancelled)
  - `paymentMethod`: Método de pagamento (credit_card, debit_card, pix, boleto, bank_transfer)
  - `dueDate`, `paymentDate`: Datas de vencimento e pagamento
  - `invoiceUrl`: URL do boleto
  - `pixQrCode`, `pixQrCodeUrl`: Dados do PIX
- **Índices**: Índice único no `asaasPaymentId`

### 2. **Serviço de Integração (Backend)**

#### `server/src/services/asaasService.ts`
- **Descrição**: Serviço para comunicação com a API do Asaas
- **Funcionalidades**:
  - `createOrUpdateCustomer()`: Cria ou atualiza cliente no Asaas
  - `getCustomer()`: Busca cliente no Asaas
  - `createSubscription()`: Cria assinatura no Asaas
  - `getSubscription()`: Busca assinatura no Asaas
  - `cancelSubscription()`: Cancela assinatura no Asaas
  - `createPayment()`: Cria pagamento único no Asaas
  - `getPayment()`: Busca pagamento no Asaas
  - `getPixQrCode()`: Gera QR Code PIX para pagamento
  - `validateWebhook()`: Valida notificações do Asaas

### 3. **Controller de Pagamentos (Backend)**

#### `server/src/controllers/paymentController.ts`
- **Descrição**: Controladores para gerenciar pagamentos e assinaturas
- **Endpoints implementados**:
  - `getPlans()`: Lista planos disponíveis
  - `createSubscription()`: Cria nova assinatura
  - `getCurrentSubscription()`: Busca assinatura atual do usuário
  - `cancelSubscription()`: Cancela assinatura
  - `getPayments()`: Lista pagamentos do usuário
  - `handleAsaasWebhook()`: Processa webhooks do Asaas

### 4. **Rotas (Backend)**

#### `server/src/routes/payments.ts`
- **Rotas públicas**:
  - `GET /api/payments/plans`: Listar planos
  - `POST /api/payments/webhooks/asaas`: Webhook do Asaas
- **Rotas autenticadas**:
  - `POST /api/payments/subscriptions`: Criar assinatura
  - `GET /api/payments/subscriptions/current`: Buscar assinatura atual
  - `POST /api/payments/subscriptions/cancel`: Cancelar assinatura
  - `GET /api/payments/payments`: Listar pagamentos

### 5. **API Client (Frontend)**

#### `src/lib/api.ts`
- **Métodos implementados**:
  - `paymentApi.getPlans()`: Buscar planos
  - `paymentApi.createSubscription()`: Criar assinatura
  - `paymentApi.getCurrentSubscription()`: Buscar assinatura atual
  - `paymentApi.cancelSubscription()`: Cancelar assinatura
  - `paymentApi.getPayments()`: Listar pagamentos

### 6. **Interface do Usuário (Frontend)**

#### `src/pages/Plans.tsx`
- **Descrição**: Página completa de planos e checkout
- **Funcionalidades**:
  - Exibição de planos com features
  - Seleção de método de pagamento (PIX, Crédito, Débito)
  - Formulário de dados do cartão
  - Integração com ViaCEP para buscar endereço
  - Resumo da compra
  - Exibição de QR Code PIX e link de boleto

#### `src/components/landing/Pricing.tsx`
- **Descrição**: Componente de preços na landing page
- **Status**: Atualizado para integrar com backend

#### `src/pages/Profile.tsx`
- **Descrição**: Página de perfil do usuário
- **Funcionalidades**: Exibe plano atual e opção para gerenciar assinatura

---

## 📁 Estrutura de Arquivos

```
bridgeai-hub-36/
├── server/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Subscription.ts          ✅ Modelo de assinatura
│   │   │   └── Payment.ts                ✅ Modelo de pagamento
│   │   ├── services/
│   │   │   └── asaasService.ts           ✅ Serviço de integração Asaas
│   │   ├── controllers/
│   │   │   └── paymentController.ts      ✅ Controller de pagamentos
│   │   ├── routes/
│   │   │   └── payments.ts               ✅ Rotas de pagamentos
│   │   └── index.ts                      ✅ Rotas registradas
│   └── .env                              ⚠️ Configuração necessária
│
└── src/
    ├── lib/
    │   └── api.ts                        ✅ API client de pagamentos
    ├── pages/
    │   ├── Plans.tsx                     ✅ Página de planos e checkout
    │   └── Profile.tsx                   ✅ Exibição de plano no perfil
    └── components/
        └── landing/
            └── Pricing.tsx               ✅ Componente de preços
```

---

## ⚙️ Configuração Necessária

### Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `server/.env`:

```env
# URL da API do Asaas
# Sandbox: https://sandbox.asaas.com/api/v3
# Produção: https://www.asaas.com/api/v3
ASAAS_API_URL=https://sandbox.asaas.com/api/v3

# Chave de API do Asaas
# Obtenha em: https://www.asaas.com/api-docs
ASAAS_API_KEY=sua_chave_api_aqui
```

### Como Obter a Chave de API do Asaas

1. Acesse [https://www.asaas.com](https://www.asaas.com)
2. Faça login na sua conta
3. Vá em **Configurações** > **Integrações** > **API**
4. Gere uma nova chave de API ou use uma existente
5. Copie a chave e adicione no arquivo `.env`

---

## 🔧 O Que Falta para Deixar Funcional

### 1. **Configuração da API Key do Asaas** ⚠️ CRÍTICO
- [ ] Adicionar `ASAAS_API_KEY` no arquivo `server/.env`
- [ ] Configurar `ASAAS_API_URL` (sandbox ou produção)
- [ ] Testar conexão com a API do Asaas

### 2. **Webhook do Asaas** ⚠️ IMPORTANTE
- [ ] Configurar URL do webhook no painel do Asaas
- [ ] URL deve ser: `https://seu-dominio.com/api/payments/webhooks/asaas`
- [ ] Configurar eventos a serem recebidos:
  - `PAYMENT_CONFIRMED`
  - `PAYMENT_RECEIVED`
  - `PAYMENT_OVERDUE`
  - `PAYMENT_REFUNDED`
  - `SUBSCRIPTION_CANCELLED`

### 3. **Validação de Webhook** ⚠️ SEGURANÇA
- [ ] Implementar validação de assinatura do webhook (HMAC)
- [ ] Verificar token de autenticação do Asaas
- [ ] Adicionar rate limiting no endpoint de webhook

### 4. **Testes** 📝 RECOMENDADO
- [ ] Testar criação de assinatura com PIX
- [ ] Testar criação de assinatura com Cartão de Crédito
- [ ] Testar criação de assinatura com Cartão de Débito
- [ ] Testar criação de assinatura com Boleto
- [ ] Testar cancelamento de assinatura
- [ ] Testar webhook de confirmação de pagamento
- [ ] Testar busca de assinatura atual
- [ ] Testar listagem de pagamentos

### 5. **Melhorias Opcionais** 💡
- [ ] Adicionar histórico de alterações de assinatura
- [ ] Implementar upgrade/downgrade de planos
- [ ] Adicionar período de trial gratuito
- [ ] Implementar cupons de desconto
- [ ] Adicionar notificações por email sobre pagamentos
- [ ] Criar dashboard de analytics de assinaturas
- [ ] Implementar relatórios financeiros

### 6. **Tratamento de Erros** 🔍
- [ ] Melhorar mensagens de erro para o usuário
- [ ] Adicionar logs detalhados de erros
- [ ] Implementar retry automático para falhas temporárias
- [ ] Adicionar monitoramento de falhas

### 7. **Segurança** 🔒
- [ ] Validar dados de cartão antes de enviar ao Asaas
- [ ] Implementar tokenização de cartões (se necessário)
- [ ] Adicionar validação de CVV
- [ ] Implementar 3D Secure para cartões

---

## 🚀 Como Testar

### 1. Configurar Ambiente

```bash
# No arquivo server/.env
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_API_KEY=sua_chave_sandbox_aqui
```

### 2. Testar Criação de Assinatura

1. Acesse `/plans` no frontend
2. Escolha um plano
3. Selecione método de pagamento (PIX recomendado para teste)
4. Preencha os dados (se cartão)
5. Finalize a compra
6. Verifique no banco de dados se a assinatura foi criada
7. Verifique no painel do Asaas se o cliente e assinatura foram criados

### 3. Testar Webhook

1. Configure o webhook no painel do Asaas
2. Simule um pagamento confirmado
3. Verifique se o status da assinatura foi atualizado no banco

---

## 📊 Fluxo de Funcionamento

### Criação de Assinatura

```
1. Usuário seleciona plano → Frontend
2. Usuário escolhe método de pagamento → Frontend
3. Frontend envia dados → Backend (POST /api/payments/subscriptions)
4. Backend cria/atualiza cliente no Asaas → Asaas API
5. Backend cria assinatura no Asaas → Asaas API
6. Backend salva assinatura no banco → MongoDB
7. Se PIX/Boleto: Backend cria pagamento → Asaas API
8. Backend retorna dados → Frontend
9. Frontend exibe QR Code ou link de boleto
```

### Confirmação de Pagamento

```
1. Pagamento confirmado no Asaas → Asaas
2. Asaas envia webhook → Backend (POST /api/payments/webhooks/asaas)
3. Backend atualiza status do pagamento → MongoDB
4. Backend ativa assinatura (se pendente) → MongoDB
5. Backend cria notificação para usuário → MongoDB
```

---

## 🔍 Troubleshooting

### Erro: "Erro na API Asaas"
- Verifique se a `ASAAS_API_KEY` está correta
- Verifique se a `ASAAS_API_URL` está correta
- Verifique se a conta do Asaas está ativa

### Erro: "Cliente não encontrado"
- O cliente é criado automaticamente, verifique os logs
- Verifique se os dados do usuário estão completos (CPF/CNPJ)

### Webhook não funciona
- Verifique se a URL está acessível publicamente
- Verifique se o webhook está configurado no painel do Asaas
- Verifique os logs do servidor

### Pagamento não confirma
- Verifique se o webhook está recebendo os eventos
- Verifique se o status está sendo atualizado no banco
- Verifique os logs de erro

---

## 📚 Referências

- [Documentação da API Asaas](https://asaas.com/api-docs/)
- [Webhooks do Asaas](https://asaas.com/api-docs/#tag/Webhook)
- [Assinaturas no Asaas](https://asaas.com/api-docs/#tag/Assinatura)

---

## 📝 Notas Importantes

1. **Sandbox vs Produção**: Use o sandbox para testes e produção apenas quando estiver pronto
2. **Webhooks**: Os webhooks são essenciais para atualizar o status dos pagamentos
3. **Segurança**: Nunca exponha a API key no frontend
4. **Validação**: Sempre valide os dados antes de enviar ao Asaas
5. **Logs**: Mantenha logs detalhados para facilitar o debug

---

## ✅ Checklist de Implementação

- [x] Modelos de dados criados
- [x] Serviço de integração implementado
- [x] Controller de pagamentos criado
- [x] Rotas configuradas
- [x] API client no frontend
- [x] Interface de planos criada
- [x] Interface de checkout criada
- [x] Integração com ViaCEP
- [x] Exibição de plano no perfil
- [ ] Configurar API key do Asaas
- [ ] Configurar webhook no Asaas
- [ ] Implementar validação de webhook
- [ ] Testes completos
- [ ] Deploy em produção

---

**Última atualização**: 2026
**Status**: Implementação completa, aguardando configuração da API key e webhook

