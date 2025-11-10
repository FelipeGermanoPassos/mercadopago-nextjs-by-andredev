import { NextRequest, NextResponse } from "next/server";
import { PreApprovalPlan } from "mercadopago";
import mpClient from "@/app/lib/mercado-pago";

// Tipos de plano disponíveis
export type PlanType = "monthly" | "annual";

// Configuração dos planos
const PLANS = {
  monthly: {
    amount: 14.9,
    frequency: 1,
    frequency_type: "months" as const,
    title: "Plano Mensal",
    description: "Assinatura mensal com renovação automática",
  },
  annual: {
    amount: 119.9,
    frequency: 1,
    frequency_type: "months" as const,
    billing_day: 1, // Dia da cobrança (pode ser ajustado)
    title: "Plano Anual",
    description: "Assinatura anual com renovação automática - Economize mais!",
  },
} as const;

export async function POST(req: NextRequest) {
  const { planType, userEmail, userId } = await req.json();

  // Validação do tipo de plano
  if (!planType || !["monthly", "annual"].includes(planType)) {
    return NextResponse.json(
      { error: "Tipo de plano inválido. Use 'monthly' ou 'annual'" },
      { status: 400 }
    );
  }

  if (!userEmail) {
    return NextResponse.json(
      { error: "Email do usuário é obrigatório" },
      { status: 400 }
    );
  }

  try {
    const plan = PLANS[planType as PlanType];
    const preApprovalPlan = new PreApprovalPlan(mpClient);

    // Para assinaturas anuais, cobramos 12 meses de uma vez
    const isAnnual = planType === "annual";

    // Estrutura correta do plano conforme documentação Mercado Pago
    const planBody = {
      reason: plan.title,
      auto_recurring: {
        frequency: isAnnual ? 12 : plan.frequency, // 12 meses para anual, 1 para mensal
        frequency_type: plan.frequency_type,
        transaction_amount: plan.amount,
        currency_id: "BRL",
      },
      back_url: "https://www.google.com", // URL válida obrigatória para testes
      payer_email: userEmail,
      external_reference: userId || `user_${Date.now()}`,
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
      subscriptionId: createdPlan.id,
      initPoint: createdPlan.init_point,
      planType,
      amount: plan.amount,
      frequency: isAnnual ? "12 meses" : "mensal",
    });
  } catch (err: any) {
    console.error("Erro ao criar assinatura:", err);

    // Retorna detalhes do erro para facilitar debug
    const errorMessage = err?.message || "Erro desconhecido";
    const errorStatus = err?.status || 500;
    const errorCode = err?.code;

    return NextResponse.json(
      {
        error: "Erro ao criar assinatura",
        details: errorMessage,
        code: errorCode,
        status: errorStatus,
      },
      { status: 500 }
    );
  }
}
