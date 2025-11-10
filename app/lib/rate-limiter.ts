// Sistema avançado de Rate Limiting
// app/lib/rate-limiter.ts

interface RateLimitConfig {
  requests: number;
  window: number; // em segundos
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitInfo {
  totalHits: number;
  totalRemainingRequests: number;
  resetTime: Date;
  isRateLimited: boolean;
}

class RateLimiter {
  private cache = new Map<string, { count: number; resetTime: number }>();

  constructor(private defaultConfig: RateLimitConfig) {}

  check(key: string, config?: Partial<RateLimitConfig>): RateLimitInfo {
    const finalConfig = { ...this.defaultConfig, ...config };
    const now = Date.now();
    const windowMs = finalConfig.window * 1000;
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const resetTime = new Date(windowStart + windowMs);

    const cached = this.cache.get(`${key}_${windowStart}`);
    const currentCount = cached ? cached.count : 0;

    const isRateLimited = currentCount >= finalConfig.requests;

    return {
      totalHits: currentCount,
      totalRemainingRequests: Math.max(0, finalConfig.requests - currentCount),
      resetTime,
      isRateLimited,
    };
  }

  increment(key: string, config?: Partial<RateLimitConfig>): RateLimitInfo {
    const finalConfig = { ...this.defaultConfig, ...config };
    const now = Date.now();
    const windowMs = finalConfig.window * 1000;
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const cacheKey = `${key}_${windowStart}`;

    const cached = this.cache.get(cacheKey);
    const newCount = cached ? cached.count + 1 : 1;

    this.cache.set(cacheKey, {
      count: newCount,
      resetTime: windowStart + windowMs,
    });

    // Limpar cache antigo
    this.cleanup();

    return this.check(key, config);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.resetTime < now) {
        this.cache.delete(key);
      }
    }
  }

  reset(key: string) {
    // Remove todas as entradas para essa chave
    for (const cacheKey of this.cache.keys()) {
      if (cacheKey.startsWith(key + "_")) {
        this.cache.delete(cacheKey);
      }
    }
  }

  getStats() {
    return {
      totalCacheEntries: this.cache.size,
      activeWindows: Array.from(this.cache.entries()).map(([key, value]) => ({
        key: key.split("_")[0],
        count: value.count,
        resetTime: new Date(value.resetTime),
      })),
    };
  }
}

// Instâncias de rate limiters para diferentes cenários
export const globalRateLimiter = new RateLimiter({
  requests: 1000,
  window: 60, // 1000 requests por minuto globalmente
});

export const checkoutRateLimiter = new RateLimiter({
  requests: 100,
  window: 60, // 100 checkouts por minuto por cliente
});

export const webhookRateLimiter = new RateLimiter({
  requests: 500,
  window: 60, // 500 webhooks por minuto (o MP pode enviar muitos)
});

// Middleware para aplicar rate limiting
export function withRateLimit(
  handler: Function,
  limiter: RateLimiter,
  getKey: (request: Request) => string,
  config?: Partial<RateLimitConfig>
) {
  return async (request: Request, ...args: any[]) => {
    try {
      const key = getKey(request);
      const rateLimitInfo = limiter.increment(key, config);

      if (rateLimitInfo.isRateLimited) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded",
            message: `Too many requests. Try again after ${rateLimitInfo.resetTime.toISOString()}`,
            retryAfter: Math.ceil(
              (rateLimitInfo.resetTime.getTime() - Date.now()) / 1000
            ),
            limit: config?.requests || limiter["defaultConfig"].requests,
            remaining: rateLimitInfo.totalRemainingRequests,
            resetTime: rateLimitInfo.resetTime.toISOString(),
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": String(
                config?.requests || limiter["defaultConfig"].requests
              ),
              "X-RateLimit-Remaining": String(
                rateLimitInfo.totalRemainingRequests
              ),
              "X-RateLimit-Reset": String(
                Math.ceil(rateLimitInfo.resetTime.getTime() / 1000)
              ),
              "Retry-After": String(
                Math.ceil(
                  (rateLimitInfo.resetTime.getTime() - Date.now()) / 1000
                )
              ),
            },
          }
        );
      }

      const response = await handler(request, ...args);

      // Adicionar headers de rate limit na resposta
      if (response instanceof Response) {
        response.headers.set(
          "X-RateLimit-Limit",
          String(config?.requests || limiter["defaultConfig"].requests)
        );
        response.headers.set(
          "X-RateLimit-Remaining",
          String(rateLimitInfo.totalRemainingRequests - 1)
        );
        response.headers.set(
          "X-RateLimit-Reset",
          String(Math.ceil(rateLimitInfo.resetTime.getTime() / 1000))
        );
      }

      return response;
    } catch (error) {
      throw error;
    }
  };
}

// Utilitários para diferentes tipos de chave
export const rateLimitKeys = {
  byApiKey: (request: Request) => {
    const apiKey =
      request.headers.get("X-API-Key") ||
      request.headers.get("Authorization")?.replace("Bearer ", "");
    return `api_key_${apiKey || "anonymous"}`;
  },

  byIP: (request: Request) => {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]
      : request.headers.get("x-real-ip") || "unknown";
    return `ip_${ip}`;
  },

  byClientId: (request: Request) => {
    const auth = (request as any).auth;
    return `client_${auth?.clientId || "anonymous"}`;
  },

  global: () => "global",
};

export default RateLimiter;
