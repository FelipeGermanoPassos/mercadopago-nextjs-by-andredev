# 🚀 Guia de Implementação - AI Studio Google

## 📋 Checklist de Implementação

### ✅ **Passo 1: Preparação do Backend**

- [ ] Backend Next.js com API de assinaturas funcionando
- [ ] Middleware de autenticação X-API-Key ativo
- [ ] URL de produção disponível (ex: https://meuapp.vercel.app)
- [ ] API Key configurada no .env

### ✅ **Passo 2: Configuração do Script**

1. **Abra o arquivo AI_STUDIO_GOOGLE_SCRIPT.md**
2. **Configure as constantes:**

```javascript
const API_CONFIG = {
  baseUrl: "https://meuapp.vercel.app", // ← SUA URL AQUI
  apiKey: "genio-geladeira-backend-secreto-2024-xyz", // ← SUA API KEY
  endpoints: {
    createSubscription: "/api/mercado-pago/create-subscription",
  },
};
```

### ✅ **Passo 3: Customização dos Planos**

Edite o objeto `SUBSCRIPTION_PLANS` conforme seus produtos:

```javascript
const SUBSCRIPTION_PLANS = {
  // 🎯 SEUS PLANOS AQUI
  meuservico: {
    basico: { amount: 29.9, period: "monthly", name: "Plano Básico" },
    premium: { amount: 79.9, period: "monthly", name: "Plano Premium" },
    enterprise: { amount: 199.9, period: "monthly", name: "Plano Enterprise" },
  },
  // Adicione mais categorias conforme necessário
};
```

### ✅ **Passo 4: Configuração no Google AI Studio**

#### 4.1 **Criar Novo Projeto**

1. Acesse [Google AI Studio](https://aistudio.google.com)
2. Crie um novo projeto
3. Escolha "Chat" ou "Prompt"

#### 4.2 **Configurar System Instructions**

```
VOCÊ É UM ASSISTENTE DE VENDAS ESPECIALIZADO EM ASSINATURAS DIGITAIS

OBJETIVO: Ajudar usuários a encontrar e criar assinaturas personalizadas para serviços digitais

INSTRUÇÕES:
1. Quando usuário descrever necessidade, analise com a função createDynamicSubscription()
2. Apresente até 3 opções relevantes de forma clara e organizada
3. Solicite escolha do plano e email do usuário
4. Finalize criando a assinatura e fornecendo link de pagamento
5. Seja sempre amigável, profissional e eficiente

FLUXO PADRÃO:
- Usuário descreve necessidade → Analise e sugira planos
- Usuário escolhe opção → Solicite email
- Usuário fornece email → Crie assinatura e forneça link

IMPORTANTE:
- Use sempre a função createDynamicSubscription() para processar solicitações
- Valide emails antes de criar assinaturas
- Forneça informações claras sobre valores e períodos
- Em caso de erro, oriente o usuário a tentar novamente
```

#### 4.3 **Adicionar o Script JavaScript**

1. Cole todo o código do `AI_STUDIO_GOOGLE_SCRIPT.md`
2. Teste a função `createDynamicSubscription()`
3. Verifique se não há erros no console

#### 4.4 **Configurar Safety Settings**

- **Harassment**: Block few
- **Hate Speech**: Block few
- **Sexually Explicit**: Block few
- **Dangerous Content**: Block few

## 🧪 **Testes Recomendados**

### Teste 1: Solicitação Básica

**Input:** "Preciso de um software mensal para minha empresa"
**Esperado:** Lista com opções de SaaS

### Teste 2: Especificação de Preço

**Input:** "Quero um curso online básico e barato"
**Esperado:** Filtro por preço baixo na categoria educação

### Teste 3: Período Específico

**Input:** "Busco um plano anual de fitness"
**Esperado:** Opções fitness com cobrança anual

### Teste 4: Finalização Completa

**Input:** "Opção 2, meu email é teste@email.com"
**Esperado:** Criação da assinatura + link de pagamento

### Teste 5: Tratamento de Erro

**Input:** Email inválido ou opção inexistente
**Esperado:** Mensagem de erro clara e orientação

## 🔧 **Configurações Avançadas**

### Personalização de Respostas

```javascript
// Adicione no script para personalizar mensagens
const CUSTOM_MESSAGES = {
  welcome:
    "Olá! Vou te ajudar a encontrar a assinatura perfeita. O que você precisa?",
  error: "Ops! Algo deu errado. Vamos tentar novamente?",
  success: "🎉 Perfeito! Sua assinatura foi criada com sucesso!",
  invalidEmail: "Por favor, forneça um email válido para continuar.",
  invalidOption: "Escolha uma das opções apresentadas (1, 2 ou 3).",
};
```

### Integração com Analytics

```javascript
// Adicione tracking de eventos
function trackEvent(event, data) {
  // Google Analytics 4
  gtag("event", event, {
    event_category: "AI_Assistant",
    event_label: data.category,
    value: data.amount,
  });

  // Ou seu sistema de analytics preferido
  console.log("Event tracked:", event, data);
}
```

### Webhooks de Notificação

```javascript
// Notificar sistemas externos quando assinatura for criada
async function notifyExternalSystems(subscriptionData) {
  try {
    await fetch("https://sua-webhook-url.com/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "subscription_created_via_ai",
        data: subscriptionData,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.warn("Failed to notify external systems:", error);
  }
}
```

## 📊 **Monitoramento e Métricas**

### KPIs Importantes

- **Taxa de Conversão**: Solicitações → Assinaturas criadas
- **Categorias Mais Solicitadas**: Quais tipos de serviço são mais procurados
- **Períodos Preferidos**: Monthly vs Annual vs Quarterly
- **Faixas de Preço**: Basic vs Premium vs Enterprise
- **Abandono**: Onde usuários param no fluxo

### Log de Eventos

```javascript
// Adicione logging detalhado
function logEvent(type, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    data,
    sessionId: generateSessionId(),
  };

  // Enviar para seu sistema de logging
  console.log("AI Assistant Log:", logEntry);
}
```

## 🛡️ **Segurança e Validações**

### Validações Obrigatórias

- [ ] **Email**: Formato válido com regex
- [ ] **Valores**: Apenas números positivos
- [ ] **Períodos**: Apenas períodos permitidos
- [ ] **API Key**: Sempre presente e válida
- [ ] **Rate Limiting**: Prevenir spam

### Sanitização de Dados

```javascript
function sanitizeInput(input) {
  return input
    .trim()
    .replace(/[<>\"']/g, "") // Remove caracteres perigosos
    .substring(0, 500); // Limita tamanho
}
```

## 🔄 **Atualizações e Manutenção**

### Versionamento do Script

```javascript
const SCRIPT_VERSION = "1.0.0";
const LAST_UPDATED = "2024-11-13";

// Log da versão para debugging
console.log(`AI Studio Script v${SCRIPT_VERSION} (${LAST_UPDATED})`);
```

### Atualizações Recomendadas

- **Mensalmente**: Revisar planos e preços
- **Trimestralmente**: Analisar métricas e otimizar
- **Semestralmente**: Atualizar categorias e funcionalidades
- **Quando necessário**: Correções de bugs e melhorias

## 📞 **Suporte e Troubleshooting**

### Problemas Comuns

#### 1. **API não responde**

- Verificar URL do backend
- Confirmar API Key
- Testar endpoint manualmente

#### 2. **Planos não aparecem**

- Verificar configuração SUBSCRIPTION_PLANS
- Checar análise de intenção
- Testar com keywords diferentes

#### 3. **Erro na criação**

- Validar formato do email
- Verificar se backend está online
- Checar logs do Next.js

#### 4. **Checkout não funciona**

- Confirmar configuração Mercado Pago
- Verificar URLs de retorno
- Testar em ambiente de produção

### Debug Mode

```javascript
const DEBUG_MODE = true; // Ativar para desenvolvimento

if (DEBUG_MODE) {
  console.log("User Intent:", userIntent);
  console.log("Plan Suggestions:", planSuggestions);
  console.log("API Response:", apiResponse);
}
```

## 🎯 **Próximos Passos**

1. **✅ Configure** todas as variáveis do script
2. **✅ Teste** localmente antes de publicar
3. **✅ Deploy** no Google AI Studio
4. **✅ Execute** testes end-to-end
5. **✅ Monitore** métricas e feedbacks
6. **✅ Itere** baseado nos resultados

**Seu AI Assistant está pronto para vender assinaturas automaticamente! 🚀**

## 🆘 **Precisa de Ajuda?**

Se encontrar problemas:

1. Verifique o console do navegador para erros
2. Teste cada função individualmente
3. Confirme se o backend está respondendo
4. Valide a configuração passo a passo

**Dica:** Use o modo DEBUG para ver exatamente o que está acontecendo em cada etapa!
