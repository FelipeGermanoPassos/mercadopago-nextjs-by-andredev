// app/api/monitoring/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { monitoring } from "@/app/lib/monitoring";
import { withAuth } from "@/app/lib/auth";

async function handleGetMetrics(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const metricName = searchParams.get("name");
  const startTime = searchParams.get("start");
  const endTime = searchParams.get("end");
  const stats = searchParams.get("stats") === "true";

  if (!metricName) {
    return NextResponse.json(
      { error: 'Parâmetro "name" é obrigatório' },
      { status: 400 }
    );
  }

  try {
    const timeRange =
      startTime && endTime
        ? {
            start: parseInt(startTime),
            end: parseInt(endTime),
          }
        : undefined;

    if (stats) {
      // Retornar estatísticas
      const statistics = monitoring.getMetricStats(metricName, timeRange);

      if (!statistics) {
        return NextResponse.json({
          metric: metricName,
          stats: null,
          message: "Nenhuma métrica encontrada",
        });
      }

      return NextResponse.json({
        metric: metricName,
        timeRange,
        stats: statistics,
      });
    } else {
      // Retornar dados brutos
      const metrics = monitoring.getMetrics(metricName, timeRange);

      return NextResponse.json({
        metric: metricName,
        timeRange,
        data: metrics,
        count: metrics.length,
      });
    }
  } catch (error) {
    console.error("Erro ao obter métricas:", error);
    return NextResponse.json(
      { error: "Erro interno ao obter métricas" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetMetrics, "read_metrics");
