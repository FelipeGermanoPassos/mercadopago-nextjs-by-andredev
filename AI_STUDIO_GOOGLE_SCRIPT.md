# 🤖 Script AI Studio Google - Integração com API de Assinaturas

## 📋 Overview

Este script permite que o **Google AI Studio** integre dinamicamente com nossa API de assinaturas do Mercado Pago, criando assinaturas personalizadas baseadas em conversas com usuários.

## 🚀 Script Principal para AI Studio

```javascript
/**
 * 🎯 MERCADO PAGO SUBSCRIPTION API INTEGRATION
 * Script para Google AI Studio - Criação dinâmica de assinaturas
 *
 * Funcionalidades:
 * - Análise de intenção do usuário
 * - Sugestão de planos personalizados
 * - Criação automática de assinaturas
 * - Integração com backend Next.js
 */

// ===============================
// 🔧 CONFIGURAÇÕES DA API
// ===============================

const API_CONFIG = {
  baseUrl: "https://seu-backend.vercel.app", // 🔄 ALTERE PARA SUA URL
  apiKey: "genio-geladeira-backend-secreto-2024-xyz", // 🔑 SUA API KEY
  endpoints: {
    createSubscription: "/api/mercado-pago/create-subscription",
  },
};

// ===============================
// 📋 PLANOS DISPONÍVEIS
// ===============================

const SUBSCRIPTION_PLANS = {
  // 💼 SaaS/Software
  saas: {
    basic: { amount: 29.9, period: "monthly", name: "SaaS Básico" },
    pro: { amount: 79.9, period: "monthly", name: "SaaS Pro" },
    enterprise: { amount: 199.9, period: "monthly", name: "SaaS Enterprise" },
  },

  // 🎓 Educação/Cursos
  education: {
    course: { amount: 49.9, period: "monthly", name: "Curso Online" },
    masterclass: { amount: 149.9, period: "quarterly", name: "Masterclass" },
    mentorship: { amount: 299.9, period: "monthly", name: "Mentoria Premium" },
  },

  // 🛒 E-commerce
  ecommerce: {
    premium: { amount: 19.9, period: "monthly", name: "Premium Shopping" },
    vip: { amount: 99.9, period: "annual", name: "VIP Anual" },
  },

  // 💪 Fitness/Saúde
  fitness: {
    basic: { amount: 39.9, period: "monthly", name: "Fitness Básico" },
    premium: { amount: 89.9, period: "monthly", name: "Fitness Premium" },
    personal: { amount: 199.9, period: "monthly", name: "Personal Trainer" },
  },

  // 📱 Apps/Serviços
  apps: {
    starter: { amount: 9.9, period: "weekly", name: "App Starter" },
    professional: { amount: 49.9, period: "monthly", name: "App Professional" },
    business: { amount: 149.9, period: "quarterly", name: "App Business" },
  },
};

// ===============================
// 🧠 ANÁLISE DE INTENÇÃO DO USUÁRIO
// ===============================

function analyzeUserIntent(userMessage) {
  const message = userMessage.toLowerCase();

  // Detecção de categoria
  const categories = {
    saas: [
      "software",
      "saas",
      "sistema",
      "plataforma",
      "dashboard",
      "crm",
      "erp",
    ],
    education: [
      "curso",
      "aula",
      "educação",
      "aprender",
      "ensino",
      "mentoria",
      "coaching",
    ],
    ecommerce: ["loja", "compra", "produto", "desconto", "frete", "shopping"],
    fitness: [
      "academia",
      "treino",
      "fitness",
      "exercício",
      "dieta",
      "personal",
    ],
    apps: ["app", "aplicativo", "mobile", "celular", "smartphone"],
  };

  // Detecção de período preferido
  const periods = {
    daily: ["diário", "todo dia", "por dia"],
    weekly: ["semanal", "por semana", "toda semana"],
    monthly: ["mensal", "por mês", "todo mês"],
    quarterly: ["trimestral", "por trimestre", "3 meses"],
    semiannual: ["semestral", "6 meses", "meio ano"],
    annual: ["anual", "por ano", "12 meses", "anuidade"],
  };

  // Detecção de faixa de preço
  const priceRanges = {
    low: ["barato", "econômico", "básico", "simples", "entrada"],
    medium: ["médio", "intermediário", "padrão", "normal"],
    high: ["premium", "avançado", "completo", "profissional", "enterprise"],
  };

  let detectedCategory = null;
  let detectedPeriod = null;
  let detectedPriceRange = null;

  // Buscar categoria
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => message.includes(keyword))) {
      detectedCategory = category;
      break;
    }
  }

  // Buscar período
  for (const [period, keywords] of Object.entries(periods)) {
    if (keywords.some((keyword) => message.includes(keyword))) {
      detectedPeriod = period;
      break;
    }
  }

  // Buscar faixa de preço
  for (const [range, keywords] of Object.entries(priceRanges)) {
    if (keywords.some((keyword) => message.includes(keyword))) {
      detectedPriceRange = range;
      break;
    }
  }

  return {
    category: detectedCategory,
    period: detectedPeriod,
    priceRange: detectedPriceRange,
    originalMessage: userMessage,
  };
}

// ===============================
// 💡 SUGESTÃO DE PLANOS
// ===============================

function suggestPlans(userIntent) {
  const { category, period, priceRange } = userIntent;

  if (!category) {
    return {
      success: false,
      message:
        "Não consegui identificar que tipo de serviço você precisa. Pode me contar mais detalhes?",
      suggestions: [],
    };
  }

  const categoryPlans = SUBSCRIPTION_PLANS[category];
  let suggestions = [];

  // Filtrar por faixa de preço se especificada
  if (priceRange) {
    const priceFilters = {
      low: (plan) => plan.amount <= 50,
      medium: (plan) => plan.amount > 50 && plan.amount <= 150,
      high: (plan) => plan.amount > 150,
    };

    const filter = priceFilters[priceRange];
    suggestions = Object.entries(categoryPlans)
      .filter(([_, plan]) => filter(plan))
      .map(([key, plan]) => ({ ...plan, key }));
  } else {
    suggestions = Object.entries(categoryPlans).map(([key, plan]) => ({
      ...plan,
      key,
    }));
  }

  // Ajustar período se especificado
  if (period) {
    suggestions = suggestions.map((plan) => ({
      ...plan,
      period: period,
      // Ajustar preço baseado no período (exemplo: anual = desconto)
      amount:
        period === "annual"
          ? plan.amount * 10 // 10 meses pelo preço de 12
          : period === "quarterly"
          ? plan.amount * 2.5 // 2.5 meses pelo preço de 3
          : plan.amount,
    }));
  }

  return {
    success: true,
    category,
    suggestions: suggestions.slice(0, 3), // Máximo 3 sugestões
    message: `Encontrei algumas opções de ${category} para você:`,
  };
}

// ===============================
// 🔗 INTEGRAÇÃO COM BACKEND
// ===============================

async function createSubscription(planData, userInfo) {
  const subscriptionData = {
    amount: planData.amount,
    period: planData.period,
    userEmail: userInfo.email,
    userId: userInfo.id || `ai_user_${Date.now()}`,
    title: planData.name,
    description: `Assinatura ${planData.name} criada via AI Studio`,
    backUrl: `${API_CONFIG.baseUrl}/subscription/success`,
  };

  try {
    const response = await fetch(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.createSubscription}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_CONFIG.apiKey,
        },
        body: JSON.stringify(subscriptionData),
      }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Erro ao criar assinatura");
    }

    return {
      success: true,
      subscriptionId: result.subscriptionId,
      checkoutUrl: result.initPoint,
      planDetails: result.planDetails,
    };
  } catch (error) {
    console.error("Erro na criação da assinatura:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ===============================
// 🎯 FUNÇÃO PRINCIPAL DO AI STUDIO
// ===============================

async function processSubscriptionRequest(userMessage, userInfo = {}) {
  // 1. Analisar intenção do usuário
  const userIntent = analyzeUserIntent(userMessage);

  // 2. Sugerir planos baseados na intenção
  const planSuggestions = suggestPlans(userIntent);

  if (!planSuggestions.success) {
    return {
      type: "question",
      message: planSuggestions.message,
      suggestions: [
        "Preciso de um software para minha empresa",
        "Quero fazer um curso online",
        "Procuro um plano fitness",
        "Preciso de uma loja premium",
      ],
    };
  }

  // 3. Apresentar opções ao usuário
  let responseMessage = `${planSuggestions.message}\n\n`;

  planSuggestions.suggestions.forEach((plan, index) => {
    responseMessage += `**${index + 1}. ${plan.name}**\n`;
    responseMessage += `💰 R$ ${plan.amount.toFixed(2)}/${getPeriodLabel(
      plan.period
    )}\n`;
    responseMessage += `📅 Cobrança ${getPeriodDescription(plan.period)}\n\n`;
  });

  responseMessage +=
    "Qual opção você gostaria de assinar? Digite o número ou me diga seu email para criar a assinatura!";

  return {
    type: "options",
    message: responseMessage,
    plans: planSuggestions.suggestions,
    category: planSuggestions.category,
  };
}

// ===============================
// 📞 FUNÇÃO PARA CRIAR ASSINATURA
// ===============================

async function handleSubscriptionCreation(
  planIndex,
  userEmail,
  previousContext
) {
  if (!previousContext.plans || !previousContext.plans[planIndex]) {
    return {
      type: "error",
      message:
        "Opção inválida. Por favor, escolha uma das opções apresentadas.",
    };
  }

  if (!userEmail || !userEmail.includes("@")) {
    return {
      type: "question",
      message:
        "Para criar sua assinatura, preciso de um email válido. Qual é o seu email?",
    };
  }

  const selectedPlan = previousContext.plans[planIndex];
  const userInfo = { email: userEmail };

  // Criar assinatura no backend
  const result = await createSubscription(selectedPlan, userInfo);

  if (!result.success) {
    return {
      type: "error",
      message: `Erro ao criar assinatura: ${result.error}. Tente novamente ou entre em contato com o suporte.`,
    };
  }

  return {
    type: "success",
    message:
      `🎉 **Assinatura criada com sucesso!**\n\n` +
      `📋 **Detalhes:**\n` +
      `- Plano: ${result.planDetails.title}\n` +
      `- Valor: R$ ${result.planDetails.amount.toFixed(2)}\n` +
      `- Período: ${result.planDetails.periodLabel}\n` +
      `- ID: ${result.subscriptionId}\n\n` +
      `🔗 **Clique aqui para finalizar o pagamento:**\n` +
      `${result.checkoutUrl}\n\n` +
      `✅ Você será redirecionado para o Mercado Pago para completar o pagamento de forma segura.`,
    checkoutUrl: result.checkoutUrl,
    subscriptionId: result.subscriptionId,
  };
}

// ===============================
// 🛠️ FUNÇÕES AUXILIARES
// ===============================

function getPeriodLabel(period) {
  const labels = {
    daily: "dia",
    weekly: "semana",
    monthly: "mês",
    quarterly: "trimestre",
    semiannual: "semestre",
    annual: "ano",
  };
  return labels[period] || "período";
}

function getPeriodDescription(period) {
  const descriptions = {
    daily: "diária",
    weekly: "semanal",
    monthly: "mensal",
    quarterly: "trimestral",
    semiannual: "semestral",
    annual: "anual",
  };
  return descriptions[period] || "periódica";
}

// ===============================
// 🎯 EXEMPLO DE USO NO AI STUDIO
// ===============================

/*
PROMPT PARA O AI STUDIO:

Você é um assistente especializado em criar assinaturas personalizadas. 
Use as funções JavaScript fornecidas para:

1. Analisar o que o usuário precisa
2. Sugerir planos adequados  
3. Criar assinaturas no backend
4. Fornecer links de pagamento

FLUXO DA CONVERSA:
1. Usuário descreve o que precisa
2. Analise com analyzeUserIntent()
3. Sugira opções com processSubscriptionRequest()
4. Se usuário escolher, use handleSubscriptionCreation()

EXEMPLO DE CONVERSA:
Usuário: "Preciso de um software para minha empresa, algo mensal e não muito caro"
Assistente: [usa processSubscriptionRequest()]
Usuário: "Quero a opção 2, meu email é joao@empresa.com"  
Assistente: [usa handleSubscriptionCreation(1, "joao@empresa.com")]

Seja sempre helpful, claro e guie o usuário até finalizar a assinatura!
*/

// ===============================
// 📝 EXEMPLO COMPLETO DE IMPLEMENTAÇÃO
// ===============================

async function aiStudioMain(userInput, conversationContext = {}) {
  // Detectar se é uma seleção de plano
  const planSelection = userInput.match(/^(\d+)$/);
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = userInput.match(emailPattern);

  // Se usuário enviou número + email ou já havia contexto de planos
  if (planSelection && conversationContext.plans) {
    const planIndex = parseInt(planSelection[1]) - 1;

    if (emailMatch) {
      return await handleSubscriptionCreation(
        planIndex,
        emailMatch[0],
        conversationContext
      );
    } else {
      return {
        type: "question",
        message: `Perfeito! Você escolheu: **${conversationContext.plans[planIndex].name}**\n\nPara finalizar, preciso do seu email:`,
      };
    }
  }

  // Se usuário enviou email após escolher plano
  if (emailMatch && conversationContext.selectedPlan !== undefined) {
    return await handleSubscriptionCreation(
      conversationContext.selectedPlan,
      emailMatch[0],
      conversationContext
    );
  }

  // Processar nova solicitação de assinatura
  return await processSubscriptionRequest(userInput);
}

// ===============================
// 🧪 TESTES DE EXEMPLO
// ===============================

/*
// Teste 1: Solicitação inicial
console.log(await aiStudioMain("Preciso de um curso online mensal básico"));

// Teste 2: Seleção de plano
console.log(await aiStudioMain("2", { 
  plans: [
    { name: "Curso Básico", amount: 49.90, period: "monthly" },
    { name: "Curso Pro", amount: 99.90, period: "monthly" }
  ]
}));

// Teste 3: Finalização com email
console.log(await aiStudioMain("joao@email.com", {
  selectedPlan: 1,
  plans: [{ name: "Curso Pro", amount: 99.90, period: "monthly" }]
}));
*/

// ===============================
// 🚀 EXPORTAÇÃO PARA AI STUDIO
// ===============================

// Função principal que o AI Studio deve chamar
window.createDynamicSubscription = aiStudioMain;

console.log(
  "🤖 AI Studio Script carregado! Use createDynamicSubscription() para processar solicitações."
);
```

## 🔧 Configuração no AI Studio

### 1. **Setup Inicial**

```javascript
// No AI Studio, cole o script acima e configure:

// 🔄 ALTERE ESTAS CONFIGURAÇÕES:
const API_CONFIG = {
  baseUrl: "https://SEU-DOMINIO.vercel.app", // ← SUA URL
  apiKey: "genio-geladeira-backend-secreto-2024-xyz", // ← SUA API KEY
  endpoints: {
    createSubscription: "/api/mercado-pago/create-subscription",
  },
};
```

### 2. **Prompt Principal para AI Studio**

```
Você é um assistente especializado em criar assinaturas de serviços digitais.

INSTRUÇÕES:
1. Quando o usuário descrever o que precisa, use a função createDynamicSubscription()
2. Analise a resposta e apresente as opções de forma clara
3. Guie o usuário para escolher uma opção e fornecer o email
4. Finalize criando a assinatura e fornecendo o link de pagamento

EXEMPLO DE FLUXO:
👤 Usuário: "Preciso de um software mensal para minha empresa"
🤖 Assistente: [chama createDynamicSubscription() e apresenta opções]
👤 Usuário: "Quero a opção 2, meu email é joao@empresa.com"
🤖 Assistente: [finaliza assinatura e fornece link do Mercado Pago]

Seja sempre amigável, claro e eficiente!
```

### 3. **Exemplo de Conversa**

```
👤 "Preciso de um curso online mensal não muito caro"

🤖 "Encontrei algumas opções de educação para você:

**1. Curso Online**
💰 R$ 49,90/mês
📅 Cobrança mensal

**2. Masterclass**
💰 R$ 149,90/trimestre
📅 Cobrança trimestral

**3. Mentoria Premium**
💰 R$ 299,90/mês
📅 Cobrança mensal

Qual opção você gostaria de assinar? Digite o número ou me diga seu email para criar a assinatura!"

👤 "Quero a opção 1, meu email é joao@email.com"

🤖 "🎉 **Assinatura criada com sucesso!**

📋 **Detalhes:**
- Plano: Curso Online
- Valor: R$ 49,90
- Período: Mensal
- ID: sub_abc123

🔗 **Clique aqui para finalizar o pagamento:**
https://mercadopago.com.br/checkout/123456

✅ Você será redirecionado para o Mercado Pago para completar o pagamento de forma segura."
```

## 🌟 Funcionalidades do Script

### ✅ **Análise Inteligente**

- Detecta categoria (SaaS, Educação, E-commerce, Fitness, Apps)
- Identifica período preferido (diário, semanal, mensal, etc.)
- Reconhece faixa de preço (básico, médio, premium)

### ✅ **Sugestões Personalizadas**

- Máximo 3 opções por categoria
- Ajuste automático de preços por período
- Planos adequados ao perfil do usuário

### ✅ **Integração Completa**

- Criação automática no backend
- Validação de dados
- Links diretos para pagamento
- Tratamento de erros

### ✅ **Experiência Otimizada**

- Fluxo conversacional natural
- Validação de email
- Mensagens claras e amigáveis
- Finalização em poucos passos

## 🎯 **Próximos Passos**

1. **Configure** as URLs e API Keys no script
2. **Cole** o script no Google AI Studio
3. **Configure** o prompt principal
4. **Teste** com diferentes tipos de solicitação
5. **Ajuste** os planos conforme sua necessidade

O script está pronto para ser usado e criar assinaturas dinamicamente via conversação! 🚀
