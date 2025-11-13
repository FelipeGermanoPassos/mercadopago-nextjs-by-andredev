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

describe("POST /api/mercado-pago/create-subscription", () => {
  let mockPreApprovalCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPreApprovalCreate = jest.fn();
    (PreApprovalPlan as jest.Mock).mockImplementation(() => ({
      create: mockPreApprovalCreate,
    }));
  });

  it("deve criar assinatura mensal com sucesso", async () => {
    const mockSubscriptionId = "sub-monthly-123";
    const mockInitPoint =
      "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=sub-monthly-123";

    mockPreApprovalCreate.mockResolvedValue({
      id: mockSubscriptionId,
      init_point: mockInitPoint,
    });

    const requestBody = {
      amount: 29.9,
      period: "monthly",
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
    expect(data).toEqual({
      success: true,
      subscriptionId: mockSubscriptionId,
      initPoint: mockInitPoint,
      planDetails: {
        period: "monthly",
        periodLabel: "Mensal",
        amount: 29.9,
        currency: "BRL",
        frequency: 1,
        frequencyType: "months",
        title: "Assinatura Mensal",
        description: "Cobrança mensal de R$ 29.90",
      },
      userEmail: "teste@example.com",
      externalReference: "user-123",
    });

    expect(mockPreApprovalCreate).toHaveBeenCalledWith({
      body: expect.objectContaining({
        reason: "Assinatura Mensal",
        auto_recurring: expect.objectContaining({
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 29.9,
          currency_id: "BRL",
        }),
      }),
    });
  });

  it("deve criar assinatura anual com sucesso", async () => {
    const mockSubscriptionId = "sub-annual-456";
    const mockInitPoint =
      "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=sub-annual-456";

    mockPreApprovalCreate.mockResolvedValue({
      id: mockSubscriptionId,
      init_point: mockInitPoint,
    });

    const requestBody = {
      amount: 299.9,
      period: "annual",
      userEmail: "teste@example.com",
      userId: "user-456",
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
    expect(data).toEqual({
      success: true,
      subscriptionId: mockSubscriptionId,
      initPoint: mockInitPoint,
      planDetails: {
        period: "annual",
        periodLabel: "Anual",
        amount: 299.9,
        currency: "BRL",
        frequency: 12,
        frequencyType: "months",
        title: "Assinatura Anual",
        description: "Cobrança anual de R$ 299.90",
      },
      userEmail: "teste@example.com",
      externalReference: "user-456",
    });

    const createCall = mockPreApprovalCreate.mock.calls[0][0];
    expect(createCall.body.auto_recurring.frequency).toBe(12); // 12 meses
    expect(createCall.body.auto_recurring.transaction_amount).toBe(299.9);
  });

  it("deve retornar erro quando período for inválido", async () => {
    const requestBody = {
      amount: 49.9,
      period: "invalid", // Período inválido
      userEmail: "teste@example.com",
      userId: "user-789",
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
    expect(data.error).toBe(
      "Tipo de plano inválido. Use 'monthly' ou 'annual'"
    );
    expect(mockPreApprovalCreate).not.toHaveBeenCalled();
  });

  it("deve retornar erro quando userEmail não for fornecido", async () => {
    const requestBody = {
      planType: "monthly",
      userId: "user-error",
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
    expect(data.error).toBe("Email do usuário é obrigatório");
    expect(mockPreApprovalCreate).not.toHaveBeenCalled();
  });

  it("deve retornar erro quando a criação falhar", async () => {
    mockPreApprovalCreate.mockRejectedValue(
      new Error("Mercado Pago API Error")
    );

    const requestBody = {
      planType: "monthly",
      userEmail: "teste@example.com",
      userId: "user-error",
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

    expect(response.status).toBe(500);
    expect(data.error).toBe("Erro ao criar assinatura");
  });

  it("deve retornar erro quando não houver subscriptionId", async () => {
    mockPreApprovalCreate.mockResolvedValue({
      id: null,
      init_point: null,
    });

    const requestBody = {
      planType: "annual",
      userEmail: "teste@example.com",
      userId: "user-999",
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

    expect(response.status).toBe(500);
  });

  it("deve gerar external_reference automático quando userId não for fornecido", async () => {
    const mockSubscriptionId = "sub-auto-ref";
    const mockInitPoint =
      "https://www.mercadopago.com.br/subscriptions/checkout";

    mockPreApprovalCreate.mockResolvedValue({
      id: mockSubscriptionId,
      init_point: mockInitPoint,
    });

    const requestBody = {
      planType: "monthly",
      userEmail: "teste@example.com",
      // userId não fornecido
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

    expect(response.status).toBe(200);
  });
});
