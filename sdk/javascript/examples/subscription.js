// examples/subscription.js
// Exemplo de uso do SDK para criar assinaturas

const { MercadoPagoClient } = require("@mercadopago-nextjs/sdk");

const client = new MercadoPagoClient({
  apiKey: process.env.MERCADOPAGO_API_KEY || "test-api-key",
  baseUrl: process.env.API_BASE_URL || "http://localhost:3000",
});

async function exemploAssinatura() {
  try {
    console.log("📋 Criando assinatura mensal...");

    const subscription = await client.createSubscription({
      planType: "monthly",
      userEmail: "usuario@exemplo.com",
      userId: "user-123",
    });

    console.log("✅ Assinatura criada com sucesso!");
    console.log("ID:", subscription.id);
    console.log("Status:", subscription.status);
    console.log("Plano:", subscription.plan_type);
    console.log("URL de Pagamento:", subscription.init_point);

    return subscription;
  } catch (error) {
    console.error("❌ Erro ao criar assinatura:", error.message);
    throw error;
  }
}

async function exemploCancelamento(subscriptionId) {
  try {
    console.log(`🗑️ Cancelando assinatura ${subscriptionId}...`);

    const result = await client.cancelSubscription(subscriptionId);

    console.log("✅ Assinatura cancelada com sucesso!");
    console.log("Resultado:", result);

    return result;
  } catch (error) {
    console.error("❌ Erro ao cancelar assinatura:", error.message);
    throw error;
  }
}

async function exemploCompleto() {
  try {
    // Criar assinatura
    const subscription = await exemploAssinatura();

    // Aguardar um momento
    console.log("⏳ Aguardando 2 segundos...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Cancelar assinatura (apenas para demonstração)
    // await exemploCancelamento(subscription.id);

    console.log("🎉 Exemplo completo executado!");
  } catch (error) {
    console.error("💥 Erro no exemplo:", error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  exemploCompleto();
}

module.exports = { exemploAssinatura, exemploCancelamento };
