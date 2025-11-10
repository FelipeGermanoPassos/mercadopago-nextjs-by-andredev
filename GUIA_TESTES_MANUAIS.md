# Guia de Testes Manuais - Mercado Pago

Este guia contém exemplos práticos de como testar a integração do Mercado Pago usando os dados de teste fornecidos.

## 🧪 Configuração do Ambiente

### 1. Variáveis de Ambiente (.env)

```bash
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_de_teste
MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret
```

### 2. Servidor de Desenvolvimento

```bash
npm run dev
```

## 💳 Testes de Checkout

### Teste com Mastercard (Aprovado)

```bash
curl -X POST http://localhost:3000/api/mercado-pago/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "produto": "Produto Teste Mastercard",
    "preco": 29.90,
    "email": "dionatan.brasil@test.com",
    "order_id": "test-mastercard-001"
  }'
```

### Teste com Visa (Aprovado)

```bash
curl -X POST http://localhost:3000/api/mercado-pago/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "produto": "Produto Teste Visa",
    "preco": 49.90,
    "email": "dionatan.brasil@test.com",
    "order_id": "test-visa-001"
  }'
```

### Teste de Assinatura Mensal

```bash
curl -X POST http://localhost:3000/api/mercado-pago/create-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Plano Premium Mensal",
    "price": 14.90,
    "frequency": 1,
    "frequency_type": "months",
    "email": "dionatan.brasil@test.com",
    "external_reference": "user-2973455888"
  }'
```

## 🔔 Simulação de Webhooks

### Webhook de Pagamento Aprovado

```bash
curl -X POST http://localhost:3000/api/mercado-pago/webhook?data.id=123456789 \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1699617600,v1=hash_simulado" \
  -H "x-request-id: req-test-001" \
  -d '{
    "type": "payment",
    "data": {
      "id": "123456789"
    }
  }'
```

### Webhook de Assinatura Autorizada

```bash
curl -X POST http://localhost:3000/api/mercado-pago/webhook?data.id=sub-456789 \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1699617600,v1=hash_simulado" \
  -H "x-request-id: req-sub-001" \
  -d '{
    "type": "subscription_preapproval",
    "data": {
      "id": "sub-456789"
    }
  }'
```

## 🎯 Casos de Teste Específicos

### 1. Fluxo Completo de Compra com Mastercard

1. **Criar Checkout:** Use o endpoint `/api/mercado-pago/create-checkout`
2. **Acessar Link:** Abra o `init_point` retornado
3. **Preencher Dados:**
   - Cartão: `5031 4332 1540 6351`
   - CVV: `123`
   - Validade: `11/30`
   - Nome: `Dionatan Brasil`
   - CPF: `12345678909`
   - Email: `dionatan.brasil@test.com`
4. **Confirmar Pagamento**
5. **Verificar Webhook:** Aguardar notificação no endpoint

### 2. Teste de Pagamento Rejeitado

Use cartões específicos da documentação do MP para simular rejeições:

```bash
# Cartão para simular saldo insuficiente
# Número: 5031 7557 3453 0604
```

### 3. Teste de Pix

1. **Criar Checkout** com payment_methods configurado para PIX
2. **Simular Pagamento:** Use ferramentas de teste do MP
3. **Verificar Webhook:** Aguardar notificação de pagamento aprovado

## 📊 Monitoramento

### Logs do Webhook

```bash
# Ver logs em tempo real
tail -f logs/webhook.log

# Ou usar console do navegador/terminal
console.log("Webhook recebido:", JSON.stringify(body, null, 2));
```

### Verificar Status de Pagamento

```bash
curl -X GET "https://api.mercadopago.com/v1/payments/PAYMENT_ID" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"
```

## 🛠️ Debugging

### Verificar Assinatura do Webhook

```javascript
// Adicione este log no webhook para debug
console.log("Headers recebidos:", {
  signature: request.headers.get("x-signature"),
  requestId: request.headers.get("x-request-id"),
});
```

### Testar Handlers Isoladamente

```javascript
// Teste direto do handler de pagamento
import { handleMercadoPagoPayment } from "@/app/server/mercado-pago/handle-payment";

const mockPayment = {
  id: "123456789",
  status: "approved",
  transaction_amount: 29.9,
  // ... outros dados
};

await handleMercadoPagoPayment(mockPayment);
```

## ⚠️ Lembretes Importantes

- ✅ **Sempre usar dados de teste** em desenvolvimento
- ✅ **Verificar logs** para debug de problemas
- ✅ **Testar todos os cenários** (aprovado, rejeitado, pendente)
- ✅ **Validar webhooks** com assinaturas reais
- ❌ **Nunca usar cartões reais** em ambiente de teste
- ❌ **Não commitar** tokens de acesso no código

## 📚 Recursos Adicionais

- [Painel do Desenvolvedor](https://www.mercadopago.com.br/developers/panel)
- [Simulador de Webhooks](https://www.mercadopago.com.br/developers/panel/webhooks)
- [Cartões de Teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards)
- [Status de Pagamentos](https://www.mercadopago.com.br/developers/pt/reference/payments/_payments_id/get)
