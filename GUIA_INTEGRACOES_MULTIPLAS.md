# Guia de Integração Multi-Sistema

Este documento mostra como diferentes sistemas podem integrar com a API do Mercado Pago.

## 🌐 Integrações Possíveis

### 1. **App Mobile (React Native)**

```javascript
// App.js - React Native
const criarAssinatura = async () => {
  const response = await fetch(
    "https://seudominio.com/api/mercado-pago/create-subscription",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planType: "monthly",
        userEmail: "usuario@exemplo.com",
        userId: "user123",
      }),
    }
  );

  const data = await response.json();
  // Abrir checkout no WebView
  Linking.openURL(data.init_point);
};
```

### 2. **Sistema PHP (WordPress/Laravel)**

```php
<?php
// integração.php
function criarPagamento($produto, $preco, $email) {
    $data = [
        'produto' => $produto,
        'preco' => $preco,
        'email' => $email,
        'order_id' => 'WP_' . time()
    ];

    $response = wp_remote_post('https://seudominio.com/api/mercado-pago/create-checkout', [
        'headers' => ['Content-Type' => 'application/json'],
        'body' => json_encode($data)
    ]);

    return json_decode(wp_remote_retrieve_body($response), true);
}
?>
```

### 3. **Python (Django/Flask)**

```python
# integração.py
import requests
import json

def criar_assinatura(email, plano='monthly'):
    url = 'https://seudominio.com/api/mercado-pago/create-subscription'
    data = {
        'planType': plano,
        'userEmail': email,
        'userId': f'PY_{int(time.time())}'
    }

    response = requests.post(url, json=data)
    return response.json()

# Usar no Django
def view_assinatura(request):
    result = criar_assinatura(request.user.email)
    return redirect(result['init_point'])
```

### 4. **Sistema Java (Spring Boot)**

```java
// PagamentoService.java
@Service
public class PagamentoService {

    @Value("${api.mercadopago.url}")
    private String baseUrl;

    public CheckoutResponse criarCheckout(ProdutoDto produto) {
        RestTemplate restTemplate = new RestTemplate();

        Map<String, Object> request = Map.of(
            "produto", produto.getNome(),
            "preco", produto.getPreco(),
            "email", produto.getEmailCliente(),
            "order_id", "JAVA_" + System.currentTimeMillis()
        );

        return restTemplate.postForObject(
            baseUrl + "/api/mercado-pago/create-checkout",
            request,
            CheckoutResponse.class
        );
    }
}
```

### 5. **E-commerce (WooCommerce)**

```php
<?php
// wc-mercadopago-integration.php
class WC_MercadoPago_Integration {

    public function process_payment($order_id) {
        $order = wc_get_order($order_id);

        $data = [
            'produto' => 'Pedido #' . $order_id,
            'preco' => $order->get_total(),
            'email' => $order->get_billing_email(),
            'order_id' => 'WC_' . $order_id
        ];

        $response = $this->call_api('/create-checkout', $data);

        return [
            'result' => 'success',
            'redirect' => $response['init_point']
        ];
    }

    private function call_api($endpoint, $data) {
        // Chamada para sua API
        $response = wp_remote_post('https://seudominio.com/api/mercado-pago' . $endpoint, [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => json_encode($data)
        ]);

        return json_decode(wp_remote_retrieve_body($response), true);
    }
}
?>
```

## 🔔 Webhook - Notificações Centralizadas

### Recebimento de Notificações

Seu webhook central recebe notificações e pode distribuir para múltiplos sistemas:

```javascript
// webhook/route.ts - Distribuição para múltiplos sistemas
export async function POST(request: Request) {
  // ... verificação de assinatura ...

  const { type, data } = body;

  switch (type) {
    case "payment":
      await handlePayment(paymentData);

      // Notificar múltiplos sistemas
      await Promise.all([
        notifyWordPress(paymentData),
        notifyMobileApp(paymentData),
        notifyErpSystem(paymentData),
        notifyEmailService(paymentData),
      ]);
      break;

    case "subscription_preapproval":
      await handleSubscription(subscriptionData);

      // Distribuir notificação
      await distributeSubscriptionUpdate(subscriptionData);
      break;
  }
}

// Funções de notificação para cada sistema
async function notifyWordPress(data) {
  fetch("https://meuwordpress.com/wp-json/mercadopago/v1/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

async function notifyMobileApp(data) {
  // Push notification ou webhook para app mobile
  await sendPushNotification(data.payer.email, "Pagamento confirmado!");
}
```

## 🏗️ Arquiteturas Possíveis

### 1. **Microserviço Centralizado**

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  App Mobile │───▶│  Sua API Next.js │───▶│  Mercado Pago   │
└─────────────┘    │                  │    └─────────────────┘
┌─────────────┐───▶│  - Checkout      │
│  WordPress  │    │  - Subscription  │    ┌─────────────────┐
└─────────────┘    │  - Webhook       │◀───│    Webhook      │
┌─────────────┐───▶│                  │    └─────────────────┘
│   Sistema   │    └──────────────────┘
│   Java      │
└─────────────┘
```

### 2. **Hub de Pagamentos**

```
┌─────────────┐    ┌──────────────────┐
│   E-commerce│───▶│                  │
└─────────────┘    │                  │
┌─────────────┐───▶│   Sua API        │
│     CRM     │    │  (Payment Hub)   │
└─────────────┘    │                  │
┌─────────────┐───▶│                  │
│   ERP       │    └──────────────────┘
└─────────────┘              │
                             ▼
                    ┌─────────────────┐
                    │  Mercado Pago   │
                    │  + Outros Gates │
                    └─────────────────┘
```

## 🔧 Configurações Multi-Tenant

### Suporte a Múltiplos Clientes

Você pode expandir para suportar múltiplos clientes/empresas:

```javascript
// .env
MERCADO_PAGO_CLIENT_A_TOKEN = TOKEN_A;
MERCADO_PAGO_CLIENT_B_TOKEN = TOKEN_B;

// lib/mercado-pago-multi.ts
export function getClientConfig(clientId: string) {
  switch (clientId) {
    case "client-a":
      return new MercadoPagoConfig({
        accessToken: process.env.MERCADO_PAGO_CLIENT_A_TOKEN,
      });
    case "client-b":
      return new MercadoPagoConfig({
        accessToken: process.env.MERCADO_PAGO_CLIENT_B_TOKEN,
      });
    default:
      throw new Error("Cliente não configurado");
  }
}

// Uso na API
export async function POST(request: Request) {
  const { clientId, ...paymentData } = await request.json();
  const mpClient = getClientConfig(clientId);

  // Processar com configuração específica do cliente
}
```

## 📊 Vantagens da Integração Multi-Sistema

### ✅ **Centralizadas**

- ✅ Um ponto único para lógica de pagamento
- ✅ Webhook centralizado para todas as notificações
- ✅ Logs e monitoramento unificados
- ✅ Atualizações em um local afetam todos os sistemas

### ✅ **Flexíveis**

- ✅ Cada sistema chama apenas os endpoints necessários
- ✅ Suporte a diferentes linguagens e frameworks
- ✅ Escalabilidade independente
- ✅ Fácil manutenção e debugging

### ✅ **Seguras**

- ✅ Verificação HMAC centralizada
- ✅ Rate limiting aplicado globalmente
- ✅ Logs de auditoria centralizados
- ✅ Controle de acesso por API key (se implementado)

## 🚀 Próximos Passos

Para expandir para múltiplos sistemas:

1. **Adicionar autenticação** (API Keys)
2. **Implementar rate limiting**
3. **Criar SDKs** para linguagens populares
4. **Documentar API** com OpenAPI/Swagger
5. **Monitoramento** e alertas
6. **Cache** para melhor performance

Seu projeto atual já está preparado para essas integrações! 🎉
