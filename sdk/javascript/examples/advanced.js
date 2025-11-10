// examples/advanced.js
// Exemplos avançados de uso do SDK

const {
  MercadoPagoClient,
  MercadoPagoApiError,
} = require("@mercadopago-nextjs/sdk");

// Cliente com configurações avançadas
const client = new MercadoPagoClient({
  apiKey: process.env.MERCADOPAGO_API_KEY || "test-api-key",
  baseUrl: process.env.API_BASE_URL || "http://localhost:3000",
  timeout: 15000, // 15 segundos
  retries: 2, // 2 tentativas
});

async function exemploTratamentoErros() {
  console.log("🛡️ Testando tratamento de erros...");

  try {
    // Tentar criar checkout com dados inválidos
    await client.createCheckout({
      produto: "", // Produto vazio para forçar erro
      preco: -10, // Preço negativo
      order_id: "", // Order ID vazio
    });
  } catch (error) {
    if (error instanceof MercadoPagoApiError) {
      console.log("✅ Erro da API capturado corretamente:");
      console.log("- Status Code:", error.statusCode);
      console.log("- Mensagem:", error.message);
      console.log("- Detalhes da API:", error.apiError);
    } else {
      console.log("❌ Erro inesperado:", error.message);
    }
  }
}

async function exemploListarTransacoes() {
  console.log("📊 Listando transações...");

  try {
    const transactions = await client.listTransactions({
      limit: 10,
      offset: 0,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });

    console.log("✅ Transações obtidas:", transactions.length || 0);

    if (transactions.length > 0) {
      console.log("Primeira transação:", transactions[0]);
    }

    return transactions;
  } catch (error) {
    console.error("❌ Erro ao listar transações:", error.message);
    throw error;
  }
}

async function exemploConsultarPagamento(paymentId) {
  console.log(`🔍 Consultando pagamento ${paymentId}...`);

  try {
    const payment = await client.getPaymentStatus(paymentId);

    console.log("✅ Status do pagamento:", payment.status);
    console.log("Detalhes:", payment);

    return payment;
  } catch (error) {
    console.error("❌ Erro ao consultar pagamento:", error.message);
    throw error;
  }
}

async function exemploRetryAutomatico() {
  console.log("🔄 Testando retry automático...");

  // Simular falha de rede temporária
  const originalFetch = global.fetch;
  let tentativas = 0;

  global.fetch = jest.fn().mockImplementation((...args) => {
    tentativas++;
    console.log(`Tentativa ${tentativas}...`);

    if (tentativas < 2) {
      // Primeiras tentativas falham
      return Promise.reject(new Error("Network error"));
    } else {
      // Última tentativa sucede
      return originalFetch(...args);
    }
  });

  try {
    const checkout = await client.createCheckout({
      produto: "Produto Teste Retry",
      preco: 50.0,
      order_id: `retry-${Date.now()}`,
    });

    console.log("✅ Retry funcionou! Checkout criado:", checkout.id);
    return checkout;
  } catch (error) {
    console.error("❌ Retry falhou:", error.message);
    throw error;
  } finally {
    // Restaurar fetch original
    global.fetch = originalFetch;
  }
}

async function exemploPerformance() {
  console.log("⚡ Testando performance...");

  const inicio = Date.now();

  try {
    // Criar múltiplos checkouts em paralelo
    const promessas = Array.from({ length: 3 }, (_, i) =>
      client.createCheckout({
        produto: `Produto ${i + 1}`,
        preco: (i + 1) * 10,
        order_id: `perf-${Date.now()}-${i}`,
      })
    );

    const resultados = await Promise.all(promessas);

    const fim = Date.now();
    const tempo = fim - inicio;

    console.log(`✅ ${resultados.length} checkouts criados em ${tempo}ms`);
    console.log(
      "IDs:",
      resultados.map((r) => r.id)
    );

    return resultados;
  } catch (error) {
    console.error("❌ Erro no teste de performance:", error.message);
    throw error;
  }
}

async function exemploCompleto() {
  console.log("🚀 Executando exemplos avançados...\n");

  try {
    await exemploTratamentoErros();
    console.log("");

    await exemploListarTransacoes();
    console.log("");

    // await exemploConsultarPagamento('payment-123');
    // console.log('');

    // await exemploRetryAutomatico();
    // console.log('');

    await exemploPerformance();
    console.log("");

    console.log("🎉 Todos os exemplos avançados executados com sucesso!");
  } catch (error) {
    console.error("💥 Erro nos exemplos:", error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  exemploCompleto();
}

module.exports = {
  exemploTratamentoErros,
  exemploListarTransacoes,
  exemploConsultarPagamento,
  exemploPerformance,
};
