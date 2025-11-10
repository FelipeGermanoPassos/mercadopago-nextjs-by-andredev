# MercadoPago NextJS SDK

SDK JavaScript/TypeScript oficial para integração com a API MercadoPago NextJS. Este SDK fornece uma interface simples e robusta para integrar pagamentos únicos e assinaturas recorrentes em suas aplicações.

## ✨ Características

- 🚀 **TypeScript nativo** - Tipagem completa e IntelliSense
- 🔄 **Retry automático** - Tentativas automáticas em caso de falha
- ⏱️ **Timeout configurável** - Controle de tempo limite das requisições
- 🛡️ **Tratamento de erros** - Erros estruturados com detalhes da API
- 📊 **Rate limiting** - Respeita limites de requisições da API
- 🔐 **Autenticação segura** - Sistema de API Keys
- 🌐 **Multi-ambiente** - Suporte para desenvolvimento e produção

## 📦 Instalação

```bash
npm install @mercadopago-nextjs/sdk
# ou
yarn add @mercadopago-nextjs/sdk
# ou
pnpm add @mercadopago-nextjs/sdk
```

## 🚀 Uso Rápido

### Configuração Básica

```typescript
import { MercadoPagoClient } from "@mercadopago-nextjs/sdk";

const client = new MercadoPagoClient({
  apiKey: "sua-api-key-aqui",
  baseUrl: "https://sua-api.com",
});
```

### Criando um Checkout

```typescript
try {
  const checkout = await client.createCheckout({
    produto: "Produto Premium",
    preco: 99.9,
    email: "cliente@email.com",
    order_id: "order-12345",
  });

  console.log("Checkout criado:", checkout.id);
  console.log("URL de pagamento:", checkout.init_point);
} catch (error) {
  console.error("Erro ao criar checkout:", error.message);
}
```

### Criando uma Assinatura

```typescript
try {
  const subscription = await client.createSubscription({
    planType: "monthly",
    userEmail: "cliente@email.com",
    userId: "user-123",
  });

  console.log("Assinatura criada:", subscription.id);
  console.log("Status:", subscription.status);
} catch (error) {
  console.error("Erro ao criar assinatura:", error.message);
}
```

## 🔧 Configuração Avançada

### Cliente com Todas as Opções

```typescript
const client = new MercadoPagoClient({
  apiKey: "sua-api-key",
  baseUrl: "https://sua-api.com",
  timeout: 30000, // 30 segundos
  retries: 3, // 3 tentativas
});
```

### Clientes Pré-configurados

```typescript
import { createDevClient, createProdClient } from "@mercadopago-nextjs/sdk";

// Cliente para desenvolvimento
const devClient = createDevClient("dev-api-key");

// Cliente para produção
const prodClient = createProdClient("prod-api-key", "https://api.producao.com");
```

## 📚 API Reference

### `MercadoPagoClient`

#### Constructor

```typescript
new MercadoPagoClient(config: ClientConfig)
```

**ClientConfig:**

- `apiKey: string` - Sua chave de API
- `baseUrl: string` - URL base da sua API
- `timeout?: number` - Timeout em ms (padrão: 30000)
- `retries?: number` - Número de tentativas (padrão: 3)

#### Métodos

##### `createCheckout(data: CheckoutRequest): Promise<CheckoutResponse>`

Cria um checkout para pagamento único.

**CheckoutRequest:**

```typescript
{
  produto: string;
  preco: number;
  email?: string;
  order_id: string;
}
```

**CheckoutResponse:**

```typescript
{
  id: string;
  init_point: string;
  client_id?: string;
  api_version?: string;
  created_at?: string;
}
```

##### `createSubscription(data: SubscriptionRequest): Promise<SubscriptionResponse>`

Cria uma assinatura recorrente.

**SubscriptionRequest:**

```typescript
{
  planType: 'monthly' | 'annual';
  userEmail: string;
  userId?: string;
}
```

##### `getPaymentStatus(paymentId: string): Promise<any>`

Consulta o status de um pagamento específico.

##### `listTransactions(filters?: TransactionFilters): Promise<any>`

Lista transações com filtros opcionais.

**TransactionFilters:**

```typescript
{
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
```

##### `cancelSubscription(subscriptionId: string): Promise<any>`

Cancela uma assinatura ativa.

## 🛠️ Tratamento de Erros

O SDK usa a classe `MercadoPagoApiError` para erros estruturados:

```typescript
import { MercadoPagoApiError } from "@mercadopago-nextjs/sdk";

try {
  await client.createCheckout(data);
} catch (error) {
  if (error instanceof MercadoPagoApiError) {
    console.log("Status Code:", error.statusCode);
    console.log("API Error:", error.apiError);
    console.log("Message:", error.message);
  }
}
```

## 📝 Exemplos Práticos

### E-commerce Simples

```typescript
import { createProdClient } from "@mercadopago-nextjs/sdk";

const client = createProdClient(
  process.env.MERCADOPAGO_API_KEY!,
  "https://minha-api.com"
);

async function processarPedido(pedido) {
  try {
    const checkout = await client.createCheckout({
      produto: pedido.nome,
      preco: pedido.valor,
      email: pedido.cliente.email,
      order_id: pedido.id,
    });

    // Redirecionar cliente para checkout.init_point
    return { success: true, checkoutUrl: checkout.init_point };
  } catch (error) {
    console.error("Erro no checkout:", error);
    return { success: false, error: error.message };
  }
}
```

### Sistema de Assinaturas

```typescript
async function criarAssinaturaPremium(usuario) {
  try {
    const subscription = await client.createSubscription({
      planType: "monthly",
      userEmail: usuario.email,
      userId: usuario.id,
    });

    // Salvar ID da assinatura no banco
    await salvarAssinatura(usuario.id, subscription.id);

    return subscription;
  } catch (error) {
    throw new Error(`Falha ao criar assinatura: ${error.message}`);
  }
}
```

## 🔍 Debug e Logs

Para debug, você pode interceptar as requisições:

```typescript
// Interceptar todas as requisições
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  console.log("Request:", url, options);
  const response = await originalFetch(url, options);
  console.log("Response:", response.status);
  return response;
};
```

## 🧪 Testes

O SDK inclui testes abrangentes. Para executar:

```bash
npm test
# ou
npm run test:watch
```

## 📈 Performance

### Configurações Recomendadas

**Para alta frequência de requisições:**

```typescript
const client = new MercadoPagoClient({
  apiKey: "sua-api-key",
  baseUrl: "https://sua-api.com",
  timeout: 15000, // Timeout menor
  retries: 2, // Menos tentativas
});
```

**Para operações críticas:**

```typescript
const client = new MercadoPagoClient({
  apiKey: "sua-api-key",
  baseUrl: "https://sua-api.com",
  timeout: 60000, // Timeout maior
  retries: 5, // Mais tentativas
});
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

MIT © Andre Dev

## 🆘 Suporte

- 📧 Email: suporte@andredev.com
- 🐛 Issues: [GitHub Issues](https://github.com/andredev/mercadopago-nextjs-by-andredev/issues)
- 📖 Docs: [Documentação Completa](https://github.com/andredev/mercadopago-nextjs-by-andredev)

---

**Feito com ❤️ por Andre Dev**
baseUrl: "https://sua-api.com",
});

// Criar checkout
const checkout = await client.createCheckout({
produto: "Produto Teste",
preco: 29.9,
email: "cliente@exemplo.com",
order_id: "order_123",
});

console.log("Link do checkout:", checkout.init_point);

```

```
