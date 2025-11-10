// app/api/monitoring/alerts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { monitoring } from "@/app/lib/monitoring";
import { withAuth } from "@/app/lib/auth";

async function handleDeleteAlert(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const alerts = monitoring.getAlertRules();
    const alertExists = alerts.some((alert) => alert.id === id);

    if (!alertExists) {
      return NextResponse.json(
        { error: "Alerta não encontrado" },
        { status: 404 }
      );
    }

    monitoring.removeAlertRule(id);

    return NextResponse.json({
      message: "Alerta removido com sucesso",
      id,
    });
  } catch (error) {
    console.error("Erro ao remover alerta:", error);
    return NextResponse.json(
      { error: "Erro interno ao remover alerta" },
      { status: 500 }
    );
  }
}

export const DELETE = withAuth(handleDeleteAlert, "manage_alerts");
