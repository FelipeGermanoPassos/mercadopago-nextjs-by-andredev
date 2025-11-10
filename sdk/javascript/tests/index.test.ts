// tests/index.test.ts
import {
  MercadoPagoClient,
  MercadoPagoApiError,
  createClient,
} from "../src/index";

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("MercadoPagoClient", () => {
  let client: MercadoPagoClient;

  beforeEach(() => {
    client = new MercadoPagoClient({
      apiKey: "test-api-key",
      baseUrl: "https://api.example.com",
    });
  });

  describe("createCheckout", () => {
    it("should create checkout successfully", async () => {
      const mockResponse = {
        id: "checkout-123",
        init_point: "https://mercadopago.com/checkout/123",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.createCheckout({
        produto: "Test Product",
        preco: 100,
        order_id: "order-123",
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/mercado-pago/v2/create-checkout",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-API-Key": "test-api-key",
            "User-Agent": "MercadoPago-NextJS-SDK/1.0.0",
          }),
          body: JSON.stringify({
            produto: "Test Product",
            preco: 100,
            order_id: "order-123",
          }),
        })
      );
    });

    it("should handle API errors", async () => {
      const errorResponse = {
        error: "Invalid request",
        details: "Missing required field",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      } as Response);

      await expect(
        client.createCheckout({
          produto: "Test Product",
          preco: 100,
          order_id: "order-123",
        })
      ).rejects.toThrow(MercadoPagoApiError);
    });
  });

  describe("createSubscription", () => {
    it("should create subscription successfully", async () => {
      const mockResponse = {
        id: "sub-123",
        init_point: "https://mercadopago.com/subscription/123",
        status: "pending",
        plan_type: "monthly",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.createSubscription({
        planType: "monthly",
        userEmail: "test@example.com",
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe("retry mechanism", () => {
    it("should retry failed requests", async () => {
      const mockResponse = {
        id: "checkout-123",
        init_point: "https://mercadopago.com/checkout/123",
      };

      // Primeira tentativa falha, segunda sucede
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

      const result = await client.createCheckout({
        produto: "Test Product",
        preco: 100,
        order_id: "order-123",
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should fail after max retries", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(
        client.createCheckout({
          produto: "Test Product",
          preco: 100,
          order_id: "order-123",
        })
      ).rejects.toThrow("Network error");

      expect(mockFetch).toHaveBeenCalledTimes(3); // 3 tentativas
    });
  });

  describe("timeout handling", () => {
    it("should timeout long requests", async () => {
      // Mock AbortController
      const mockAbortController = {
        abort: jest.fn(),
        signal: { aborted: false },
      };
      global.AbortController = jest.fn(() => mockAbortController) as any;

      const client = new MercadoPagoClient({
        apiKey: "test-api-key",
        baseUrl: "https://api.example.com",
        timeout: 100, // 100ms timeout
      });

      // Mock uma resposta que demora mais que o timeout
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ id: "test" }),
                } as Response),
              200
            )
          )
      );

      await expect(
        client.createCheckout({
          produto: "Test Product",
          preco: 100,
          order_id: "order-123",
        })
      ).rejects.toThrow();
    });
  });
});

describe("Factory functions", () => {
  it("should create client with createClient", () => {
    const client = createClient({
      apiKey: "test-key",
      baseUrl: "https://api.example.com",
    });

    expect(client).toBeInstanceOf(MercadoPagoClient);
  });
});
