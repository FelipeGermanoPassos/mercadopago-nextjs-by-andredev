// app/api/monitoring/alerts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { monitoring } from "@/app/lib/monitoring";
import { withAuth } from "@/app/lib/auth";

async function handleGetAlerts(request: NextRequest) {
  try {
    const alerts = monitoring.getAlertRules();

    return NextResponse.json({
      alerts,
      total: alerts.length,
    });
  } catch (error) {
    console.error("Erro ao obter alertas:", error);
    return NextResponse.json(
      { error: "Erro interno ao obter alertas" },
      { status: 500 }
    );
  }
}

async function handleCreateAlert(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação básica
    const requiredFields = [
      "id",
      "name",
      "metric",
      "operator",
      "threshold",
      "window",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo '${field}' é obrigatório` },
          { status: 400 }
        );
      }
    }

    // Validar operador
    const validOperators = ["gt", "lt", "eq", "gte", "lte"];
    if (!validOperators.includes(body.operator)) {
      return NextResponse.json(
        { error: "Operador inválido. Use: gt, lt, eq, gte, lte" },
        { status: 400 }
      );
    }

    const alertRule = {
      id: body.id,
      name: body.name,
      metric: body.metric,
      operator: body.operator,
      threshold: parseFloat(body.threshold),
      window: parseInt(body.window),
      enabled: body.enabled !== false,
      notification: body.notification || {},
    };

    monitoring.addAlertRule(alertRule);

    return NextResponse.json(
      {
        message: "Alerta criado com sucesso",
        alert: alertRule,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar alerta:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar alerta" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetAlerts, "read_alerts");
export const POST = withAuth(handleCreateAlert, "manage_alerts");
