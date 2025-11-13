import { POST } from "../route";
import { NextRequest } from "next/server";
import { PreApprovalPlan } from "mercadopago";

// Mock do módulo mercadopago
jest.mock("mercadopago", () => ({
  PreApprovalPlan: jest.fn(),
}));

// Mock do cliente do Mercado Pago
jest.mock("@/app/lib/mercado-pago", () => ({
  __esModule: true,
  default: {},
}));

describe("POST /api/mercado-pago/create-subscription - API Dinâmica", () => {
  let mockPreApprovalCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPreApprovalCreate = jest.fn();
    (PreApprovalPlan as jest.Mock).mockImplementation(() => ({
      create: mockPreApprovalCreate,
    }));
  });

  // Teste para cada período disponível
  const periodsTest = [
    { period: "daily", frequency: 1, frequencyType: "days", label: "Diário" },
    { period: "weekly", frequency: 7, frequencyType: "days", label: "Semanal" },
    {
      period: "monthly",
      frequency: 1,
      frequencyType: "months",
      label: "Mensal",
    },
    {
      period: "quarterly",
      frequency: 3,
      frequencyType: "months",
      label: "Trimestral",
    },
    {
      period: "semiannual",
      frequency: 6,
      frequencyType: "months",
      label: "Semestral",
    },
    {
      period: "annual",
      frequency: 12,
      frequencyType: "months",
      label: "Anual",
    },
  ];

  periodsTest.forEach(({ period, frequency, frequencyType, label }) => {
    it(`deve criar assinatura ${period} com sucesso`, async () => {
      const mockSubscriptionId = `sub-${period}-123`;
      const mockInitPoint = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${mockSubscriptionId}`;
      const amount = 49.9;

      mockPreApprovalCreate.mockResolvedValue({
        id: mockSubscriptionId,
        init_point: mockInitPoint,
      });

      const requestBody = {
        amount,
        period,
        userEmail: "teste@example.com",
        userId: "user-123",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/mercado-pago/create-subscription",
        {
          method: "POST",
          body: JSON.stringify(requestBody),
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
          },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.subscriptionId).toBe(mockSubscriptionId);
      expect(data.initPoint).toBe(mockInitPoint);
      expect(data.planDetails.period).toBe(period);
      expect(data.planDetails.periodLabel).toBe(label);
      expect(data.planDetails.amount).toBe(amount);
      expect(data.planDetails.frequency).toBe(frequency);
      expect(data.planDetails.frequencyType).toBe(frequencyType);

      expect(mockPreApprovalCreate).toHaveBeenCalledWith({
        body: expect.objectContaining({
          auto_recurring: expect.objectContaining({
            frequency,
            frequency_type: frequencyType,
            transaction_amount: amount,
            currency_id: "BRL",
          }),
        }),
      });
    });
  });

  it("deve criar assinatura com título e descrição personalizados", async () => {
    const mockSubscriptionId = "sub-custom-123";
    const mockInitPoint = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${mockSubscriptionId}`;

    mockPreApprovalCreate.mockResolvedValue({
      id: mockSubscriptionId,
      init_point: mockInitPoint,
    });

    const requestBody = {
      amount: 99.9,
      period: "monthly",
      userEmail: "premium@example.com",
      userId: "premium-user-456",
      title: "Plano Premium Personalizado",
      description: "Acesso completo com recursos exclusivos",
      currency: "USD",
      backUrl: "https://meusite.com/sucesso",
    };

    const request = new NextRequest(
      "http://localhost:3000/api/mercado-pago/create-subscription",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.planDetails.title).toBe("Plano Premium Personalizado");
    expect(data.planDetails.description).toBe(
      "Acesso completo com recursos exclusivos"
    );
    expect(data.planDetails.currency).toBe("USD");

    expect(mockPreApprovalCreate).toHaveBeenCalledWith({
      body: expect.objectContaining({
        reason: "Plano Premium Personalizado",
        auto_recurring: expect.objectContaining({
          currency_id: "USD",
        }),
        back_url: "https://meusite.com/sucesso",
        external_reference: "premium-user-456",
      }),
    });
  });

  it("deve retornar erro quando valor for inválido", async () => {
    const requestBody = {
      amount: -10, // Valor negativo
      period: "monthly",
      userEmail: "teste@example.com",
    };

    const request = new NextRequest(
      "http://localhost:3000/api/mercado-pago/create-subscription",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Valor deve ser um número positivo");
  });

  it("deve retornar erro quando período for inválido", async () => {
    const requestBody = {
      amount: 49.9,
      period: "invalid", // Período inválido
      userEmail: "teste@example.com",
    };

    const request = new NextRequest(
      "http://localhost:3000/api/mercado-pago/create-subscription",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Período inválido");
    expect(data.validPeriods).toContain("daily");
    expect(data.validPeriods).toContain("monthly");
    expect(data.validPeriods).toContain("annual");
  });

  it("deve retornar erro quando email for inválido", async () => {
    const requestBody = {
      amount: 49.9,
      period: "monthly",
      userEmail: "email-invalido", // Email sem @
    };

    const request = new NextRequest(
      "http://localhost:3000/api/mercado-pago/create-subscription",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Email válido é obrigatório");
  });

  it("deve usar valores padrão quando campos opcionais não forem fornecidos", async () => {
    const mockSubscriptionId = "sub-default-123";
    const mockInitPoint = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${mockSubscriptionId}`;

    mockPreApprovalCreate.mockResolvedValue({
      id: mockSubscriptionId,
      init_point: mockInitPoint,
    });

    const requestBody = {
      amount: 29.9,
      period: "monthly",
      userEmail: "basic@example.com",
      // Sem campos opcionais
    };

    const request = new NextRequest(
      "http://localhost:3000/api/mercado-pago/create-subscription",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.planDetails.title).toBe("Assinatura Mensal");
    expect(data.planDetails.description).toBe("Cobrança mensal de R$ 29.90");
    expect(data.planDetails.currency).toBe("BRL");
    expect(data.externalReference).toMatch(/^user_\d+_monthly$/);

    expect(mockPreApprovalCreate).toHaveBeenCalledWith({
      body: expect.objectContaining({
        back_url: "https://www.google.com", // URL padrão
        auto_recurring: expect.objectContaining({
          currency_id: "BRL", // Moeda padrão
        }),
      }),
    });
  });

  it("deve tratar erro do Mercado Pago adequadamente", async () => {
    const mpError = new Error("Mercado Pago API Error") as any;
    mpError.status = 400;
    mpError.code = "INVALID_PARAMETERS";

    mockPreApprovalCreate.mockRejectedValue(mpError);

    const requestBody = {
      amount: 49.9,
      period: "monthly",
      userEmail: "teste@example.com",
    };

    const request = new NextRequest(
      "http://localhost:3000/api/mercado-pago/create-subscription",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Erro ao criar assinatura");
    expect(data.details).toBe("Mercado Pago API Error");
    expect(data.code).toBe("INVALID_PARAMETERS");
    expect(data.timestamp).toBeDefined();
  });
});
