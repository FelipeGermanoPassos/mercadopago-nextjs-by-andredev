import { POST } from "../route";
import { NextRequest } from "next/server";
import { Payment, PreApproval } from "mercadopago";
import crypto from "crypto";

// Mock do módulo mercadopago
jest.mock("mercadopago", () => ({
  Payment: jest.fn(),
  PreApproval: jest.fn(),
}));

// Mock do cliente do Mercado Pago
jest.mock("@/app/lib/mercado-pago", () => ({
  __esModule: true,
  default: {},
  verifyMercadoPagoSignature: jest.fn(),
}));

// Mock do handler de pagamento
jest.mock("@/app/server/mercado-pago/handle-payment", () => ({
  handleMercadoPagoPayment: jest.fn(),
}));

// Mock do handler de assinatura
jest.mock("@/app/server/mercado-pago/handle-subscription", () => ({
  handleMercadoPagoSubscription: jest.fn(),
}));

import { verifyMercadoPagoSignature } from "@/app/lib/mercado-pago";
import { handleMercadoPagoPayment } from "@/app/server/mercado-pago/handle-payment";
import { handleMercadoPagoSubscription } from "@/app/server/mercado-pago/handle-subscription";

describe("POST /api/mercado-pago/webhook", () => {
  let mockPaymentGet: jest.Mock;
  let mockPreApprovalGet: jest.Mock;

  // Dados de teste do Mercado Pago
  const TEST_USER_DATA = {
    name: "Dionatan Brasil",
    email: "dionatan.brasil@test.com",
    user_id: "2973455888",
    document: "12345678909",
  };

  const TEST_CARDS = {
    mastercard: "5031 4332 1540 6351",
    visa: "4235 6477 2802 5682",
    amex: "3753 651535 56885",
    elo: "5067 7667 8388 8311",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockPaymentGet = jest.fn();
    (Payment as jest.Mock).mockImplementation(() => ({
      get: mockPaymentGet,
    }));

    mockPreApprovalGet = jest.fn();
    (PreApproval as jest.Mock).mockImplementation(() => ({
      get: mockPreApprovalGet,
    }));

    // Mock da verificação de assinatura (sucesso por padrão)
    (verifyMercadoPagoSignature as jest.Mock).mockReturnValue(undefined);
  });

  it("deve processar webhook de pagamento aprovado", async () => {
    const mockPaymentData = {
      id: "123456789",
      status: "approved",
      date_approved: "2025-11-10T10:00:00Z",
      transaction_amount: 29.9,
      payment_method_id: "master",
      payer: {
        email: TEST_USER_DATA.email,
        first_name: TEST_USER_DATA.name.split(" ")[0],
        last_name: TEST_USER_DATA.name.split(" ")[1],
        identification: {
          type: "CPF",
          number: TEST_USER_DATA.document,
        },
      },
      metadata: {
        order_id: "order-123",
        user_email: TEST_USER_DATA.email,
      },
    };

    mockPaymentGet.mockResolvedValue(mockPaymentData);

    const requestBody = {
      type: "payment",
      data: {
        id: "123456789",
      },
    };

    const request = new Request(
      "http://localhost:3000/api/mercado-pago/webhook?data.id=123456789",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json",
          "x-signature": "ts=1234567890,v1=abc123",
          "x-request-id": "req-123",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ received: true });
    expect(verifyMercadoPagoSignature).toHaveBeenCalledWith(request);
    expect(mockPaymentGet).toHaveBeenCalledWith({ id: "123456789" });
    expect(handleMercadoPagoPayment).toHaveBeenCalledWith(mockPaymentData);
  });

  it("deve processar webhook de pagamento Pix aprovado", async () => {
    const mockPaymentData = {
      id: "987654321",
      status: "approved",
      date_approved: "2025-11-10T10:15:00Z",
      transaction_amount: 49.9,
      payment_method_id: "pix",
      payer: {
        email: TEST_USER_DATA.email,
        first_name: TEST_USER_DATA.name.split(" ")[0],
        last_name: TEST_USER_DATA.name.split(" ")[1],
        identification: {
          type: "CPF",
          number: TEST_USER_DATA.document,
        },
      },
      metadata: {
        order_id: "order-456",
        user_email: TEST_USER_DATA.email,
      },
    };

    mockPaymentGet.mockResolvedValue(mockPaymentData);

    const requestBody = {
      type: "payment",
      data: {
        id: "987654321",
      },
    };

    const request = new Request(
      "http://localhost:3000/api/mercado-pago/webhook?data.id=987654321",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json",
          "x-signature": "ts=1234567890,v1=abc123",
          "x-request-id": "req-456",
        },
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(handleMercadoPagoPayment).toHaveBeenCalledWith(mockPaymentData);
  });

  it("não deve processar pagamento pendente", async () => {
    const mockPaymentData = {
      id: "111111111",
      status: "pending",
      date_approved: null,
      metadata: {
        teste_id: "order-789",
      },
    };

    mockPaymentGet.mockResolvedValue(mockPaymentData);

    const requestBody = {
      type: "payment",
      data: {
        id: "111111111",
      },
    };

    const request = new Request(
      "http://localhost:3000/api/mercado-pago/webhook?data.id=111111111",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json",
          "x-signature": "ts=1234567890,v1=abc123",
          "x-request-id": "req-789",
        },
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(handleMercadoPagoPayment).not.toHaveBeenCalled();
  });

  it("deve processar eventos de assinatura", async () => {
    const mockSubscriptionData = {
      id: "sub-123",
      status: "authorized",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
      },
    };

    mockPreApprovalGet.mockResolvedValue(mockSubscriptionData);

    const requestBody = {
      type: "subscription_preapproval",
      data: {
        id: "sub-123",
      },
    };

    const request = new Request(
      "http://localhost:3000/api/mercado-pago/webhook?data.id=sub-123",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json",
          "x-signature": "ts=1234567890,v1=abc123",
          "x-request-id": "req-sub",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ received: true });
    expect(mockPreApprovalGet).toHaveBeenCalledWith({ id: "sub-123" });
    expect(handleMercadoPagoSubscription).toHaveBeenCalledWith(
      mockSubscriptionData
    );
    expect(mockPaymentGet).not.toHaveBeenCalled();
    expect(handleMercadoPagoPayment).not.toHaveBeenCalled();
  });

  it("deve retornar erro 500 quando houver falha no processamento", async () => {
    mockPaymentGet.mockRejectedValue(new Error("Payment API Error"));

    const requestBody = {
      type: "payment",
      data: {
        id: "error-id",
      },
    };

    const request = new Request(
      "http://localhost:3000/api/mercado-pago/webhook?data.id=error-id",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json",
          "x-signature": "ts=1234567890,v1=abc123",
          "x-request-id": "req-error",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Webhook handler failed" });
  });

  it("deve verificar assinatura antes de processar", async () => {
    const mockPaymentData = {
      id: "123",
      status: "approved",
      date_approved: "2025-11-07T10:00:00Z",
      metadata: {
        teste_id: "order-123",
      },
    };

    mockPaymentGet.mockResolvedValue(mockPaymentData);

    const requestBody = {
      type: "payment",
      data: {
        id: "123",
      },
    };

    const request = new Request(
      "http://localhost:3000/api/mercado-pago/webhook?data.id=123",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json",
          "x-signature": "ts=1234567890,v1=abc123",
          "x-request-id": "req-verify",
        },
      }
    );

    await POST(request);

    expect(verifyMercadoPagoSignature).toHaveBeenCalledTimes(1);
    expect(verifyMercadoPagoSignature).toHaveBeenCalledWith(request);
  });

  it("deve ignorar eventos não tratados", async () => {
    const requestBody = {
      type: "unknown_event_type",
      data: {
        id: "unknown-123",
      },
    };

    const request = new Request(
      "http://localhost:3000/api/mercado-pago/webhook?data.id=unknown-123",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "content-type": "application/json",
          "x-signature": "ts=1234567890,v1=abc123",
          "x-request-id": "req-unknown",
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ received: true });
    expect(mockPaymentGet).not.toHaveBeenCalled();
    expect(mockPreApprovalGet).not.toHaveBeenCalled();
    expect(handleMercadoPagoPayment).not.toHaveBeenCalled();
    expect(handleMercadoPagoSubscription).not.toHaveBeenCalled();
  });
});
