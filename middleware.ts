// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { monitoring } from "./app/lib/monitoring";

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const response = NextResponse.next();

  // Adicionar headers de monitoramento
  response.headers.set("X-Request-ID", crypto.randomUUID());
  response.headers.set("X-Timestamp", startTime.toString());

  // Hook para capturar métricas após a resposta
  response.headers.set("X-Monitor-Hook", "true");

  // Registrar início da requisição
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Executar de forma assíncrona para não bloquear a resposta
  Promise.resolve().then(() => {
    const duration = Date.now() - startTime;
    const status = response.status || 200;

    // Registrar métricas
    monitoring.recordResponseTime(`${method} ${pathname}`, duration, status);

    // Métricas específicas por endpoint
    if (pathname.startsWith("/api/mercado-pago/")) {
      monitoring.incrementCounter("mercadopago_api_requests", 1, {
        endpoint: pathname,
        method,
        status: status.toString(),
      });
    }

    // Registrar métricas de sistema periodicamente
    if (Math.random() < 0.1) {
      // 10% das requisições
      monitoring.recordSystemMetrics();
    }
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
