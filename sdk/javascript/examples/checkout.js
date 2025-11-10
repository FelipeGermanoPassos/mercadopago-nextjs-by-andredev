// examples/checkout.js
// Exemplo básico de uso do SDK para criar checkout

const { MercadoPagoClient } = require("@mercadopago-nextjs/sdk");

// Configurar cliente
const client = new MercadoPagoClient({
  apiKey: process.env.MERCADOPAGO_API_KEY || "test-api-key",
  baseUrl: process.env.API_BASE_URL || "http://localhost:3000",
});

async function exemploCheckout() {
  try {
    console.log("🛒 Criando checkout...");

    const checkout = await client.createCheckout({
      produto: "Curso de JavaScript Avançado",
      preco: 199.9,
      email: "cliente@exemplo.com",
      order_id: `order-${Date.now()}`,
    });

    console.log("✅ Checkout criado com sucesso!");
    console.log("ID:", checkout.id);
    console.log("URL de Pagamento:", checkout.init_point);

    return checkout;
  } catch (error) {
    console.error("❌ Erro ao criar checkout:", error.message);

    if (error.statusCode) {
      console.error("Status Code:", error.statusCode);
      console.error("Detalhes:", error.apiError);
    }

    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  exemploCheckout()
    .then(() => console.log("🎉 Exemplo executado com sucesso!"))
    .catch(() => process.exit(1));
}

module.exports = { exemploCheckout };
