# 📋 Guia de Uso da API de Assinaturas Dinâmicas

## 🚀 Overview

A API foi modernizada para aceitar **valores e periodicidades dinâmicas**, tornando-a flexível para integração em múltiplos projetos.

## 📡 Endpoint

```
POST /api/mercado-pago/create-subscription
```

## 🔐 Autenticação

```http
X-API-Key: genio-geladeira-backend-secreto-2024-xyz
```

## 📋 Parâmetros da Requisição

### ✅ Obrigatórios

| Campo       | Tipo     | Descrição                          |
| ----------- | -------- | ---------------------------------- |
| `amount`    | `number` | Valor da assinatura (ex: 29.90)    |
| `period`    | `string` | Periodicidade (veja opções abaixo) |
| `userEmail` | `string` | Email válido do usuário            |

### 📅 Períodos Disponíveis

| Valor        | Descrição  | Frequência      |
| ------------ | ---------- | --------------- |
| `daily`      | Diário     | A cada 1 dia    |
| `weekly`     | Semanal    | A cada 7 dias   |
| `monthly`    | Mensal     | A cada 1 mês    |
| `quarterly`  | Trimestral | A cada 3 meses  |
| `semiannual` | Semestral  | A cada 6 meses  |
| `annual`     | Anual      | A cada 12 meses |

### ⚙️ Opcionais

| Campo         | Tipo     | Padrão                      | Descrição               |
| ------------- | -------- | --------------------------- | ----------------------- |
| `userId`      | `string` | `user_{timestamp}_{period}` | ID único do usuário     |
| `title`       | `string` | `Assinatura {Período}`      | Título da assinatura    |
| `description` | `string` | Auto-gerada                 | Descrição personalizada |
| `currency`    | `string` | `BRL`                       | Moeda (BRL, USD, etc.)  |
| `backUrl`     | `string` | `https://www.google.com`    | URL de retorno          |

## 💡 Exemplos de Uso

### 🔹 Assinatura Mensal Básica

```javascript
const response = await fetch("/api/mercado-pago/create-subscription", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "genio-geladeira-backend-secreto-2024-xyz",
  },
  body: JSON.stringify({
    amount: 29.9,
    period: "monthly",
    userEmail: "cliente@exemplo.com",
  }),
});
```

### 🔹 Assinatura Anual com Detalhes Personalizados

```javascript
const response = await fetch("/api/mercado-pago/create-subscription", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "genio-geladeira-backend-secreto-2024-xyz",
  },
  body: JSON.stringify({
    amount: 299.9,
    period: "annual",
    userEmail: "vip@exemplo.com",
    userId: "user_123456",
    title: "Plano Premium Anual",
    description: "Acesso completo com desconto anual",
    backUrl: "https://meusite.com/sucesso",
  }),
});
```

### 🔹 Assinatura Semanal para SaaS

```javascript
const response = await fetch("/api/mercado-pago/create-subscription", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "genio-geladeira-backend-secreto-2024-xyz",
  },
  body: JSON.stringify({
    amount: 9.9,
    period: "weekly",
    userEmail: "startup@exemplo.com",
    title: "Plano Starter Semanal",
    description: "Ideal para testes e projetos pequenos",
  }),
});
```

## 📤 Resposta de Sucesso

```json
{
  "success": true,
  "subscriptionId": "2c93808485fc2f7a0186001234567890",
  "initPoint": "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=2c93808485fc2f7a0186001234567890",
  "planDetails": {
    "period": "monthly",
    "periodLabel": "Mensal",
    "amount": 29.9,
    "currency": "BRL",
    "frequency": 1,
    "frequencyType": "months",
    "title": "Assinatura Mensal",
    "description": "Cobrança mensal de R$ 29.90"
  },
  "userEmail": "cliente@exemplo.com",
  "externalReference": "user_1699123456789_monthly"
}
```

## ❌ Resposta de Erro

```json
{
  "success": false,
  "error": "Valor deve ser um número positivo",
  "timestamp": "2024-11-13T10:30:00.000Z"
}
```

## 🌐 Integração Multi-Projeto

### 🔹 E-commerce

```javascript
// Produto premium mensal
createSubscription({
  amount: 49.9,
  period: "monthly",
  userEmail: user.email,
  title: "Premium E-commerce",
  description: "Acesso a funcionalidades avançadas",
});
```

### 🔹 SaaS B2B

```javascript
// Plano empresarial anual
createSubscription({
  amount: 1200.0,
  period: "annual",
  userEmail: company.email,
  title: "Plano Empresarial",
  description: "Licenças ilimitadas + suporte premium",
});
```

### 🔹 Conteúdo Digital

```javascript
// Curso com pagamento trimestral
createSubscription({
  amount: 120.0,
  period: "quarterly",
  userEmail: student.email,
  title: "Curso Avançado",
  description: "Acesso trimestral ao conteúdo",
});
```

## 🔧 Função Helper para Frontend

```javascript
// utils/mercadopago.js
export async function createSubscription(subscriptionData) {
  try {
    const response = await fetch("/api/mercado-pago/create-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_BACKEND_API_KEY,
      },
      body: JSON.stringify(subscriptionData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Erro ao criar assinatura");
    }

    return data;
  } catch (error) {
    console.error("Erro na criação da assinatura:", error);
    throw error;
  }
}

// Hook React
export function useSubscription() {
  const [loading, setLoading] = useState(false);

  const create = async (subscriptionData) => {
    setLoading(true);
    try {
      const result = await createSubscription(subscriptionData);
      return result;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading };
}
```

## ✅ Casos de Uso Reais

### 📱 **App de Fitness**

- **Mensal**: R$ 19,90 - Acesso básico
- **Trimestral**: R$ 49,90 - Desconto + nutricionista
- **Anual**: R$ 149,90 - Desconto máximo + personal trainer

### 🎓 **Plataforma de Cursos**

- **Semanal**: R$ 15,90 - Teste de 1 semana
- **Mensal**: R$ 49,90 - Acesso padrão
- **Semestral**: R$ 199,90 - Desconto + certificados

### 💼 **Software B2B**

- **Mensal**: R$ 299,90 - Até 10 usuários
- **Trimestral**: R$ 799,90 - Até 50 usuários
- **Anual**: R$ 2.999,90 - Usuários ilimitados

## 🛡️ Validações Automáticas

- ✅ Valor deve ser número positivo
- ✅ Email deve ser válido (contém @)
- ✅ Período deve estar na lista permitida
- ✅ Comparação segura de API Keys
- ✅ Logs detalhados para debugging

## 🚀 Vantagens da Nova API

1. **Flexibilidade Total**: Qualquer valor, qualquer período
2. **Multi-Projeto**: Reutilizável em diversos sistemas
3. **Segurança**: Validações robustas e API Key
4. **Monitoramento**: Logs detalhados integrados
5. **TypeScript**: Tipagem completa para melhor DX
6. **Documentação**: Exemplos claros e práticos

A API agora está pronta para escalar com qualquer tipo de negócio! 🎯
