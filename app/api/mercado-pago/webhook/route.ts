// app/api/mercadopago-webhook/route.js

import { NextResponse } from "next/server";
import { Payment, PreApproval } from "mercadopago";
import mpClient, { verifyMercadoPagoSignature } from "@/app/lib/mercado-pago";
import { handleMercadoPagoPayment } from "@/app/server/mercado-pago/handle-payment";
import { handleMercadoPagoSubscription } from "@/app/server/mercado-pago/handle-subscription";

// Cache simples para idempotência (em produção, use Redis ou banco de dados)
const processedEvents = new Map<string, number>();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

// Limpar eventos antigos periodicamente (apenas em produção, não durante testes)
if (process.env.NODE_ENV !== "test") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of processedEvents.entries()) {
      if (now - timestamp > CACHE_EXPIRY) {
        processedEvents.delete(key);
      }
    }
  }, 60 * 60 * 1000); // Limpa a cada hora
}

export async function POST(request: Request) {
  try {
    verifyMercadoPagoSignature(request);

    const body = await request.json();

    const { type, data } = body;

    // Proteção contra processamento duplicado (Idempotência)
    const eventKey = `${type}-${data.id}`;
    if (processedEvents.has(eventKey)) {
      console.log(`Evento duplicado ignorado: ${eventKey}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Marcar como processado
    processedEvents.set(eventKey, Date.now());

    switch (type) {
      case "payment":
        const payment = new Payment(mpClient);
        const paymentData = await payment.get({ id: data.id });
        if (
          paymentData.status === "approved" || // Pagamento por cartão OU
          paymentData.date_approved !== null // Pagamento por Pix
        ) {
          await handleMercadoPagoPayment(paymentData);
        }
        break;

      case "subscription_preapproval":
      case "subscription_authorized_payment":
        // Eventos de assinatura
        const preApproval = new PreApproval(mpClient);
        const subscriptionData = await preApproval.get({ id: data.id });

        if (subscriptionData.status === "authorized") {
          await handleMercadoPagoSubscription(subscriptionData);
        }
        console.log("Subscription event:", type, subscriptionData.status);
        break;

      default:
        console.log("Unhandled event type:", type);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
