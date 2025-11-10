# Dados de Teste - Mercado Pago

Este arquivo contém as credenciais e cartões de teste fornecidos pelo Mercado Pago para desenvolvimento e testes.

## 🧪 Usuário Teste

### Comprador de Teste

- **Nome:** Dionatan Brasil
- **País:** Brasil 🇧🇷
- **User ID:** 2973455888
- **Usuário:** TESTUSER7573...
- **Senha:** QVfCWQNNn4

## 💳 Cartões de Teste

### Mastercard

- **Número:** 5031 4332 1540 6351
- **CVV:** 123
- **Validade:** 11/30

### Visa

- **Número:** 4235 6477 2802 5682
- **CVV:** 123
- **Validade:** 11/30

### American Express

- **Número:** 3753 651535 56885
- **CVV:** 1234
- **Validade:** 11/30

### Elo Débito

- **Número:** 5067 7667 8388 8311
- **CVV:** 123
- **Validade:** 11/30

## 🎯 Como Usar nos Testes

### Para Testes de Pagamento Aprovado

Use qualquer um dos cartões acima com:

- **Titular:** Qualquer nome
- **Documento:** 12345678909
- **Email:** test@example.com

### Para Testes de Pagamento Rejeitado

Use cartões específicos para cada tipo de rejeição (consulte a documentação do MP).

### Exemplo de Teste com cURL

```bash
# Teste de checkout com Mastercard
curl -X POST http://localhost:3000/api/mercado-pago/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "produto": "Produto Teste",
    "preco": 29.90,
    "email": "test@example.com",
    "order_id": "test-order-123"
  }'
```

## ⚠️ Importante

- **NÃO USAR EM PRODUÇÃO:** Estes dados são exclusivamente para ambiente de teste/sandbox
- **Documentação oficial:** https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards
- **Ambiente:** Sandbox/Desenvolvimento apenas

## 📋 Status dos Pagamentos de Teste

- ✅ **Aprovado:** Todos os cartões listados acima
- ❌ **Rejeitado:** Use cartões específicos da documentação
- ⏳ **Pendente:** Use valores específicos para simular
- 🔄 **Em processo:** Use valores específicos para simular

## 🔗 Links Úteis

- [Painel de Desenvolvedores](https://www.mercadopago.com.br/developers/panel)
- [Documentação Cartões de Teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards)
- [Webhooks de Teste](https://www.mercadopago.com.br/developers/panel/webhooks)
