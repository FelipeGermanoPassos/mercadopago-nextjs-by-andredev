// Rota protegida com autenticação, rate limiting e cache
// app/api/mercado-pago/v2/create-checkout/route.ts

import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import mpClient from "@/app/lib/mercado-pago";
import { withAuth } from "@/app/lib/auth";
import { withRateLimit, checkoutRateLimiter } from "@/app/lib/rate-limiter";
import { checkoutCache } from "@/app/lib/cache";
import { monitoring } from "@/app/lib/monitoring";

async function handleCreateCheckout(request: Request) {
  const startTime = Date.now();

  try {
    const { produto, preco, email, order_id } = await request.json();
    const auth = (request as any).auth;

    // Validação obrigatória
    if (!produto || !preco || !order_id) {
      monitoring.recordError(
        "validation_error",
        "Missing required fields",
        "v2-create-checkout"
      );
      return NextResponse.json(
        { error: "Campos obrigatórios: produto, preco, order_id" },
        { status: 400 }
      );
    }

    // Gerar chave de cache baseada nos parâmetros
    const cacheKey = `v2-checkout:${order_id}:${JSON.stringify({
      produto,
      preco,
      email,
    })}`;

    // Verificar cache primeiro
    const cachedResult = checkoutCache.get(cacheKey);
    if (cachedResult) {
      monitoring.incrementCounter("checkout_cache_hit", 1, { version: "v2" });
      monitoring.recordResponseTime(
        "v2-create-checkout",
        Date.now() - startTime,
        200
      );

      return NextResponse.json({
        ...cachedResult,
        cached: true,
        cache_timestamp: cachedResult.created_at,
      });
    }

    monitoring.incrementCounter("checkout_cache_miss", 1, { version: "v2" });

    const preference = new Preference(mpClient);

    const body: any = {
      items: [
        {
          id: order_id,
          title: produto,
          quantity: 1,
          unit_price: preco,
          currency_id: "BRL",
        },
      ],
      metadata: {
        client_id: auth.clientId,
        api_key_id: auth.keyData.id,
        order_id: order_id,
        created_via: "api_v2",
      },
      back_urls: {
        success: `${request.headers.get("origin")}/success`,
        failure: `${request.headers.get("origin")}/failure`,
        pending: `${request.headers.get("origin")}/pending`,
      },
      notification_url: `https://seudominio.com/api/mercado-pago/webhook`,
      auto_return: "approved",
    };

    if (email) {
      body.payer = { email };
    }

    const response = await preference.create({ body });

    const result = {
      id: response.id,
      init_point: response.init_point,
      client_id: auth.clientId,
      api_version: "v2",
      created_at: new Date().toISOString(),
    };

    // Armazenar no cache por 30 minutos
    checkoutCache.set(cacheKey, result, 1800);

    // Log da transação
    console.log(
      `[API v2] Checkout criado por ${auth.keyData.name} (${auth.clientId}): ${response.id}`
    );

    // Registrar métricas de sucesso
    monitoring.incrementCounter("checkout_created", 1, {
      version: "v2",
      client: auth.clientId,
    });
    monitoring.recordResponseTime(
      "v2-create-checkout",
      Date.now() - startTime,
      200
    );

    return NextResponse.json(result);
  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error("Erro ao criar checkout v2:", error);
    monitoring.recordError(
      "mercadopago_error",
      error.message || "Unknown error",
      "v2-create-checkout"
    );
    monitoring.recordResponseTime("v2-create-checkout", duration, 500);

    return NextResponse.json(
      {
        error: "Erro ao criar checkout",
        details: error.message,
        api_version: "v2",
      },
      { status: 500 }
    );
  }
}

// Aplicar middlewares: autenticação e rate limiting
export const POST = withAuth(
  withRateLimit(
    handleCreateCheckout,
    checkoutRateLimiter,
    (request: Request) => {
      const auth = (request as any).auth;
      return `checkout:${auth?.clientId || "unknown"}`;
    }
  ),
  "create_checkout"
);
