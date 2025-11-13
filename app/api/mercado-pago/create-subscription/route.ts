import { NextRequest, NextResponse } from "next/server";
import { PreApprovalPlan } from "mercadopago";
import mpClient from "@/app/lib/mercado-pago";

// Tipos de periodicidade disponíveis
export type FrequencyType = "days" | "months";
export type PlanPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual";

// Interface para requisição da assinatura
export interface CreateSubscriptionRequest {
  // Dados obrigatórios
  amount: number;
  period: PlanPeriod;
  userEmail: string;

  // Dados opcionais
  userId?: string;
  title?: string;
  description?: string;
  currency?: string;
  backUrl?: string;
}

// Mapeamento de períodos para configuração do Mercado Pago
const PERIOD_CONFIG = {
  daily: { frequency: 1, frequency_type: "days" as FrequencyType },
  weekly: { frequency: 7, frequency_type: "days" as FrequencyType },
  monthly: { frequency: 1, frequency_type: "months" as FrequencyType },
  quarterly: { frequency: 3, frequency_type: "months" as FrequencyType },
  semiannual: { frequency: 6, frequency_type: "months" as FrequencyType },
  annual: { frequency: 12, frequency_type: "months" as FrequencyType },
} as const;

// Labels em português para cada período
const PERIOD_LABELS = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
} as const;

export async function POST(req: NextRequest) {
  try {
    const body: CreateSubscriptionRequest = await req.json();
    const {
      amount,
      period,
      userEmail,
      userId,
      title,
      description,
      currency = "BRL",
      backUrl,
    } = body;

    // Validações obrigatórias
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Valor deve ser um número positivo",
        },
        { status: 400 }
      );
    }

    if (!period || !Object.keys(PERIOD_CONFIG).includes(period)) {
      return NextResponse.json(
        {
          success: false,
          error: "Período inválido",
          validPeriods: Object.keys(PERIOD_CONFIG),
          examples: {
            daily: "Cobrança diária",
            weekly: "Cobrança semanal",
            monthly: "Cobrança mensal",
            quarterly: "Cobrança trimestral",
            semiannual: "Cobrança semestral",
            annual: "Cobrança anual",
          },
        },
        { status: 400 }
      );
    }

    if (!userEmail || !userEmail.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          error: "Email válido é obrigatório",
        },
        { status: 400 }
      );
    }

    // Configuração do período
    const periodConfig = PERIOD_CONFIG[period];
    const preApprovalPlan = new PreApprovalPlan(mpClient);

    // Título e descrição dinâmicos
    const planTitle = title || `Assinatura ${PERIOD_LABELS[period]}`;
    const planDescription =
      description ||
      `Cobrança ${PERIOD_LABELS[period].toLowerCase()} de R$ ${amount.toFixed(
        2
      )}`;

    // Estrutura do plano conforme documentação Mercado Pago
    const planBody = {
      reason: planTitle,
      auto_recurring: {
        frequency: periodConfig.frequency,
        frequency_type: periodConfig.frequency_type,
        transaction_amount: amount,
        currency_id: currency,
      },
      back_url: backUrl || "https://www.google.com", // URL de retorno
      payer_email: userEmail,
      external_reference: userId || `user_${Date.now()}_${period}`,
    };

    console.log("Criando plano com dados:", JSON.stringify(planBody, null, 2));

    const createdPlan = await preApprovalPlan.create({
      body: planBody as any,
    });

    console.log("Plano criado:", createdPlan);

    if (!createdPlan.id) {
      throw new Error("Falha ao criar plano de assinatura - ID não retornado");
    }

    return NextResponse.json({
      success: true,
      subscriptionId: createdPlan.id,
      initPoint: createdPlan.init_point,
      planDetails: {
        period,
        periodLabel: PERIOD_LABELS[period],
        amount,
        currency,
        frequency: periodConfig.frequency,
        frequencyType: periodConfig.frequency_type,
        title: planTitle,
        description: planDescription,
      },
      userEmail,
      externalReference: userId || `user_${Date.now()}_${period}`,
    });
  } catch (err: any) {
    console.error("Erro ao criar assinatura:", err);

    // Retorna detalhes do erro para facilitar debug
    const errorMessage = err?.message || "Erro desconhecido";
    const errorStatus = err?.status || 500;
    const errorCode = err?.code;

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao criar assinatura",
        details: errorMessage,
        code: errorCode,
        status: errorStatus,
        timestamp: new Date().toISOString(),
      },
      { status: errorStatus === 400 ? 400 : 500 }
    );
  }
}
