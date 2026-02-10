# 📋 Funcionalidades Não Funcionais - BridgeAI Hub

Este documento lista apenas as funcionalidades que estão no código mas não estão funcionais.

---

## Lista de Funcionalidades Não Funcionais

1. **Sistema de Envio de Emails** (`server/src/utils/emailService.ts`, `server/src/utils/queue.ts:127`)
   - Apenas faz log no console, não envia emails reais

2. **Publicação Automática de Posts Agendados** (`server/src/utils/queue.ts:166`)
   - Posts agendados não são publicados automaticamente
   - Falta scheduler/cron job

3. **Processamento de Relatórios na Fila** (`server/src/utils/queue.ts:174`)
   - Processador na fila apenas simula, não processa relatórios

4. **Follow-ups Automáticos** (`server/src/models/FollowUp.ts`, `server/src/controllers/salesController.ts`)
   - Follow-ups podem ser criados mas não são executados automaticamente

5. **Campanhas Automáticas** (`server/src/models/Campaign.ts`)
   - Campanhas podem ser criadas mas não são executadas automaticamente

6. **Publicação de Imagens no LinkedIn**
   - Apenas texto é suportado, imagens não funcionam
