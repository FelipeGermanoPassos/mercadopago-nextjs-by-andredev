# 🚀 Exemplo Prático - API de Assinaturas Dinâmicas

## 📋 Cenário Real: Integração Multi-Projeto

Aqui estão exemplos práticos de como integrar a nova API dinâmica em diferentes tipos de projeto:

## 🔹 1. E-commerce de Roupas

```javascript
// components/SubscriptionPlans.tsx
import { useState } from "react";

const plans = [
  {
    name: "Premium Mensal",
    amount: 49.9,
    period: "monthly",
    benefits: ["Frete grátis", "15% desconto", "Acesso prioritário"],
  },
  {
    name: "Premium Anual",
    amount: 399.9,
    period: "annual",
    benefits: [
      "Frete grátis",
      "25% desconto",
      "Acesso prioritário",
      "Brinde exclusivo",
    ],
  },
];

export function SubscriptionPlans({ userEmail, userId }) {
  const [loading, setLoading] = useState(null);

  const handleSubscribe = async (plan) => {
    setLoading(plan.period);

    try {
      const response = await fetch("/api/mercado-pago/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_BACKEND_API_KEY,
        },
        body: JSON.stringify({
          amount: plan.amount,
          period: plan.period,
          userEmail,
          userId,
          title: plan.name,
          description: `Assinatura ${plan.name} - ${plan.benefits.join(", ")}`,
          backUrl: `${window.location.origin}/subscription/success`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redireciona para checkout do Mercado Pago
        window.location.href = data.initPoint;
      } else {
        alert("Erro: " + data.error);
      }
    } catch (error) {
      alert("Erro ao processar assinatura");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {plans.map((plan) => (
        <div key={plan.period} className="border rounded-lg p-6">
          <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
          <p className="text-3xl font-bold text-green-600 mb-4">
            R$ {plan.amount.toFixed(2)}/
            {plan.period === "monthly" ? "mês" : "ano"}
          </p>

          <ul className="mb-6 space-y-2">
            {plan.benefits.map((benefit) => (
              <li key={benefit} className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                {benefit}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleSubscribe(plan)}
            disabled={loading === plan.period}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === plan.period ? "Processando..." : "Assinar Agora"}
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 🔹 2. SaaS de Gestão Empresarial

```javascript
// pages/pricing.tsx
import { useState } from "react";
import { useRouter } from "next/router";

const PRICING_TIERS = {
  starter: {
    name: "Starter",
    monthly: { amount: 99.9, period: "monthly" },
    annual: { amount: 999.9, period: "annual" },
    features: ["Até 5 usuários", "Relatórios básicos", "Suporte email"],
  },
  business: {
    name: "Business",
    monthly: { amount: 299.9, period: "monthly" },
    annual: { amount: 2999.9, period: "annual" },
    features: [
      "Até 50 usuários",
      "Relatórios avançados",
      "Suporte prioritário",
      "API Access",
    ],
  },
  enterprise: {
    name: "Enterprise",
    monthly: { amount: 999.9, period: "monthly" },
    annual: { amount: 9999.9, period: "annual" },
    features: [
      "Usuários ilimitados",
      "Relatórios customizados",
      "Suporte 24/7",
      "API + Webhooks",
    ],
  },
};

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [loading, setLoading] = useState(null);
  const router = useRouter();

  const createSubscription = async (tier, plan) => {
    setLoading(tier);

    try {
      const response = await fetch("/api/mercado-pago/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_BACKEND_API_KEY,
        },
        body: JSON.stringify({
          amount: plan.amount,
          period: plan.period,
          userEmail: "usuario@empresa.com", // Vem da sessão
          userId: "user_12345", // Vem da sessão
          title: `Plano ${PRICING_TIERS[tier].name} ${
            billingPeriod === "annual" ? "Anual" : "Mensal"
          }`,
          description: `Acesso completo ao plano ${PRICING_TIERS[tier].name}`,
          backUrl: `${window.location.origin}/dashboard?plan=${tier}&period=${plan.period}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Salva detalhes da assinatura no localStorage para tracking
        localStorage.setItem(
          "pendingSubscription",
          JSON.stringify({
            subscriptionId: data.subscriptionId,
            plan: tier,
            period: plan.period,
            amount: plan.amount,
          })
        );

        window.location.href = data.initPoint;
      } else {
        alert("Erro: " + data.error);
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao processar assinatura");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>

        {/* Toggle Mensal/Anual */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-md ${
                billingPeriod === "monthly" ? "bg-white shadow" : ""
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-4 py-2 rounded-md ${
                billingPeriod === "annual" ? "bg-white shadow" : ""
              }`}
            >
              Anual <span className="text-green-600 text-sm">(20% desc.)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Object.entries(PRICING_TIERS).map(([tier, config]) => {
          const plan = config[billingPeriod];
          const monthlyPrice =
            billingPeriod === "annual" ? plan.amount / 12 : plan.amount;

          return (
            <div key={tier} className="border rounded-lg p-6 relative">
              {tier === "business" && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                    Mais Popular
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{config.name}</h3>

              <div className="mb-4">
                <span className="text-4xl font-bold">
                  R$ {monthlyPrice.toFixed(2)}
                </span>
                <span className="text-gray-600">/mês</span>
                {billingPeriod === "annual" && (
                  <p className="text-sm text-green-600">
                    Cobrado anualmente: R$ {plan.amount.toFixed(2)}
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {config.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => createSubscription(tier, plan)}
                disabled={loading === tier}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading === tier ? "Processando..." : "Começar Agora"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## 🔹 3. Plataforma de Cursos Online

```javascript
// hooks/useSubscription.js
import { useState } from "react";

export function useSubscription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSubscription = async (subscriptionData) => {
    setLoading(true);
    setError(null);

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
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createSubscription, loading, error };
}

// components/CourseSubscription.tsx
import { useSubscription } from "../hooks/useSubscription";

export function CourseSubscription({ course, user }) {
  const { createSubscription, loading, error } = useSubscription();

  const subscriptionOptions = [
    {
      period: "monthly",
      amount: 79.9,
      label: "Mensal",
      description: "Acesso completo por 1 mês",
    },
    {
      period: "quarterly",
      amount: 199.9,
      label: "Trimestral",
      description: "Acesso completo por 3 meses",
      savings: "Economize R$ 39,80",
    },
    {
      period: "annual",
      amount: 599.9,
      label: "Anual",
      description: "Acesso completo por 1 ano",
      savings: "Economize R$ 358,90",
    },
  ];

  const handleSubscribe = async (option) => {
    try {
      const result = await createSubscription({
        amount: option.amount,
        period: option.period,
        userEmail: user.email,
        userId: user.id,
        title: `${course.title} - ${option.label}`,
        description: `Acesso ao curso "${course.title}" - ${option.description}`,
        backUrl: `${window.location.origin}/courses/${course.id}/success`,
      });

      // Redireciona para o checkout
      window.location.href = result.initPoint;
    } catch (err) {
      console.error("Erro ao criar assinatura:", err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Escolha seu Plano</h2>
      <p className="text-gray-600 mb-6">
        Tenha acesso completo ao curso "{course.title}" e todo material
        complementar
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {subscriptionOptions.map((option) => (
          <div
            key={option.period}
            className="border rounded-lg p-4 hover:border-blue-500 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{option.label}</h3>
                <p className="text-sm text-gray-600">{option.description}</p>
                {option.savings && (
                  <p className="text-sm text-green-600 font-medium">
                    {option.savings}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  R$ {option.amount.toFixed(2)}
                </p>
                <button
                  onClick={() => handleSubscribe(option)}
                  disabled={loading}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Processando..." : "Assinar"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>Pagamento processado com segurança pelo Mercado Pago</p>
        <p>Cancele a qualquer momento</p>
      </div>
    </div>
  );
}
```

## 🔹 4. App de Fitness

```javascript
// utils/fitness-plans.js
export const FITNESS_PLANS = {
  basic: {
    name: "Básico",
    features: ["Treinos básicos", "Suporte por email"],
    prices: {
      weekly: 19.9,
      monthly: 49.9,
      quarterly: 129.9,
    },
  },
  premium: {
    name: "Premium",
    features: [
      "Treinos personalizados",
      "Acompanhamento nutricional",
      "Suporte prioritário",
    ],
    prices: {
      weekly: 39.9,
      monthly: 99.9,
      quarterly: 249.9,
      annual: 799.9,
    },
  },
};

// components/FitnessSubscription.tsx
import { FITNESS_PLANS } from "../utils/fitness-plans";
import { useSubscription } from "../hooks/useSubscription";

export function FitnessSubscription({ selectedPlan, user }) {
  const { createSubscription, loading } = useSubscription();
  const plan = FITNESS_PLANS[selectedPlan];

  const handleSubscribe = async (period, amount) => {
    try {
      const result = await createSubscription({
        amount,
        period,
        userEmail: user.email,
        userId: user.id,
        title: `FitApp ${plan.name} - ${getPeriodLabel(period)}`,
        description: `Acesso ao plano ${plan.name} com ${plan.features.join(
          ", "
        )}`,
        backUrl: `${window.location.origin}/app/welcome`,
      });

      window.location.href = result.initPoint;
    } catch (error) {
      alert("Erro ao processar assinatura: " + error.message);
    }
  };

  const getPeriodLabel = (period) => {
    const labels = {
      weekly: "Semanal",
      monthly: "Mensal",
      quarterly: "Trimestral",
      annual: "Anual",
    };
    return labels[period];
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-4">Plano {plan.name}</h2>

      <ul className="space-y-2 mb-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <div className="space-y-3">
        {Object.entries(plan.prices).map(([period, amount]) => (
          <button
            key={period}
            onClick={() => handleSubscribe(period, amount)}
            disabled={loading}
            className="w-full flex justify-between items-center p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50"
          >
            <span>{getPeriodLabel(period)}</span>
            <span className="font-bold">R$ {amount.toFixed(2)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

## 📱 5. Função Utilitária Reutilizável

```javascript
// lib/subscription-api.js
class SubscriptionAPI {
  constructor(apiKey, baseUrl = "") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async create({
    amount,
    period,
    userEmail,
    userId = null,
    title = null,
    description = null,
    currency = "BRL",
    backUrl = null,
  }) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/mercado-pago/create-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": this.apiKey,
          },
          body: JSON.stringify({
            amount,
            period,
            userEmail,
            userId,
            title,
            description,
            currency,
            backUrl,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Erro ao criar assinatura");
      }

      return data;
    } catch (error) {
      console.error("Subscription API Error:", error);
      throw error;
    }
  }

  // Método helper para criar assinatura e redirecionar
  async createAndRedirect(subscriptionData) {
    const result = await this.create(subscriptionData);
    window.location.href = result.initPoint;
    return result;
  }
}

// Instância global
export const subscriptionAPI = new SubscriptionAPI(
  process.env.NEXT_PUBLIC_BACKEND_API_KEY
);

// Hook React para uso fácil
export function useSubscriptionAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSubscription = async (data) => {
    setLoading(true);
    setError(null);

    try {
      const result = await subscriptionAPI.create(data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createAndRedirect = async (data) => {
    setLoading(true);
    setError(null);

    try {
      await subscriptionAPI.createAndRedirect(data);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createSubscription,
    createAndRedirect,
    loading,
    error,
  };
}
```

## 🎯 Casos de Uso Resumidos

| **Período**  | **Uso Ideal**                  | **Exemplo de Valor** |
| ------------ | ------------------------------ | -------------------- |
| `daily`      | Testes, promoções              | R$ 2,99/dia          |
| `weekly`     | Apps fitness, conteúdo semanal | R$ 9,90/semana       |
| `monthly`    | SaaS, streaming, e-commerce    | R$ 29,90/mês         |
| `quarterly`  | Cursos, consultorias           | R$ 199,90/trimestre  |
| `semiannual` | Software empresarial           | R$ 599,90/semestre   |
| `annual`     | Planos premium com desconto    | R$ 999,90/ano        |

## ✅ Principais Vantagens

1. **Flexibilidade Total**: Qualquer valor, qualquer período
2. **Reutilização**: Uma API para múltiplos projetos
3. **Tipagem Forte**: TypeScript completo
4. **Validação Robusta**: Erros claros e específicos
5. **Segurança**: API Key obrigatória e middleware proteção
6. **Monitoramento**: Logs integrados para análise
7. **Testes Completos**: Cobertura de todos os cenários

A nova API está pronta para escalar com qualquer modelo de negócio! 🚀
