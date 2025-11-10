// SDK JavaScript/TypeScript
// sdk/javascript/src/index.ts

export interface CheckoutRequest {
  produto: string;
  preco: number;
  email?: string;
  order_id: string;
}

export interface CheckoutResponse {
  id: string;
  init_point: string;
  client_id?: string;
  api_version?: string;
  created_at?: string;
}

export interface SubscriptionRequest {
  planType: "monthly" | "annual";
  userEmail: string;
  userId?: string;
}

export interface SubscriptionResponse {
  id: string;
  init_point: string;
  status: string;
  plan_type: string;
}

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
  timestamp?: string;
}

export interface ClientConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
}

export class MercadoPagoClient {
  private config: Required<ClientConfig>;

  constructor(config: ClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}/api/mercado-pago${endpoint}`;

    const defaultHeaders = {
      "Content-Type": "application/json",
      "X-API-Key": this.config.apiKey,
      "User-Agent": "MercadoPago-NextJS-SDK/1.0.0",
    };

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout
        );

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData: ApiError = await response.json().catch(() => ({
            error: `HTTP ${response.status}: ${response.statusText}`,
          }));

          throw new MercadoPagoApiError(
            errorData.error || "API request failed",
            response.status,
            errorData
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.config.retries) {
          throw error;
        }

        // Delay progressivo entre tentativas
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }

    throw lastError;
  }

  /**
   * Cria um checkout de pagamento único
   */
  async createCheckout(data: CheckoutRequest): Promise<CheckoutResponse> {
    return this.request<CheckoutResponse>("/v2/create-checkout", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Cria uma assinatura recorrente
   */
  async createSubscription(
    data: SubscriptionRequest
  ): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>("/create-subscription", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Consulta status de um pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<any> {
    return this.request(`/payment/${paymentId}`, {
      method: "GET",
    });
  }

  /**
   * Lista transações
   */
  async listTransactions(filters?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();
    return this.request(`/transactions${query ? "?" + query : ""}`, {
      method: "GET",
    });
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<any> {
    return this.request(`/subscription/${subscriptionId}/cancel`, {
      method: "POST",
    });
  }
}

export class MercadoPagoApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public apiError: ApiError
  ) {
    super(message);
    this.name = "MercadoPagoApiError";
  }
}

// Exportar cliente configurado para diferentes ambientes
export const createClient = (config: ClientConfig) =>
  new MercadoPagoClient(config);

// Cliente pré-configurado para desenvolvimento
export const createDevClient = (apiKey: string) =>
  new MercadoPagoClient({
    apiKey,
    baseUrl: "http://localhost:3000",
  });

// Cliente pré-configurado para produção
export const createProdClient = (apiKey: string, baseUrl: string) =>
  new MercadoPagoClient({
    apiKey,
    baseUrl,
  });

export default MercadoPagoClient;
