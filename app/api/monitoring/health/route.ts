// app/api/monitoring/health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { monitoring } from "@/app/lib/monitoring";

export async function GET(request: NextRequest) {
  try {
    const health = await monitoring.getSystemHealth();

    // Status HTTP baseado na saúde do sistema
    const statusCode =
      health.status === "healthy"
        ? 200
        : health.status === "warning"
        ? 200
        : 500;

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Status": health.status,
      },
    });
  } catch (error) {
    console.error("Erro ao obter saúde do sistema:", error);

    return NextResponse.json(
      {
        status: "critical",
        timestamp: Date.now(),
        error: "Health check failed",
        checks: {
          api: false,
          database: false,
          mercadopago: false,
          webhook: false,
        },
        metrics: {
          requests_per_minute: 0,
          error_rate: 100,
          response_time_avg: 0,
          memory_usage: 0,
          cpu_usage: 0,
        },
      },
      { status: 500 }
    );
  }
}
