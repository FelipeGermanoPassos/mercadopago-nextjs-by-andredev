// Middleware de autenticação por API Key
// app/lib/auth.ts

import { NextResponse } from "next/server";
import crypto from "crypto";

interface ApiKeyData {
  id: string;
  name: string;
  clientId: string;
  permissions: string[];
  rateLimit: {
    requests: number;
    window: number; // em segundos
  };
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

// Base de dados simulada de API Keys (em produção, use banco de dados)
const API_KEYS: Record<string, ApiKeyData> = {
  mp_live_wordpress_abc123: {
    id: "wp_001",
    name: "WordPress Site Principal",
    clientId: "wordpress-site",
    permissions: ["checkout:create", "subscription:create", "payment:read"],
    rateLimit: { requests: 100, window: 60 },
    isActive: true,
    createdAt: new Date("2025-01-01"),
    lastUsedAt: new Date(),
  },
  mp_live_mobile_def456: {
    id: "mobile_001",
    name: "App Mobile iOS/Android",
    clientId: "mobile-app",
    permissions: ["subscription:create", "subscription:cancel", "payment:read"],
    rateLimit: { requests: 200, window: 60 },
    isActive: true,
    createdAt: new Date("2025-01-01"),
  },
  mp_live_erp_ghi789: {
    id: "erp_001",
    name: "Sistema ERP Empresarial",
    clientId: "erp-system",
    permissions: [
      "checkout:create",
      "subscription:create",
      "webhook:receive",
      "analytics:read",
    ],
    rateLimit: { requests: 500, window: 60 },
    isActive: true,
    createdAt: new Date("2025-01-01"),
  },
};

// Cache para controle de rate limiting
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}

export function generateApiKey(clientId: string): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(16).toString("hex");
  return `mp_live_${clientId}_${timestamp}${random}`;
}

export function validateApiKey(apiKey: string): ApiKeyData {
  if (!apiKey) {
    throw new AuthError("API Key é obrigatória", 401);
  }

  if (!apiKey.startsWith("mp_live_")) {
    throw new AuthError("Formato de API Key inválido", 401);
  }

  const keyData = API_KEYS[apiKey];
  if (!keyData) {
    throw new AuthError("API Key não encontrada", 401);
  }

  if (!keyData.isActive) {
    throw new AuthError("API Key desativada", 403);
  }

  // Atualizar último uso
  keyData.lastUsedAt = new Date();

  return keyData;
}

export function checkPermission(
  keyData: ApiKeyData,
  permission: string
): boolean {
  return (
    keyData.permissions.includes(permission) ||
    keyData.permissions.includes("*")
  );
}

export function checkRateLimit(apiKey: string, keyData: ApiKeyData): void {
  const now = Date.now();
  const windowMs = keyData.rateLimit.window * 1000;
  const cacheKey = `${apiKey}_${Math.floor(now / windowMs)}`;

  const cached = rateLimitCache.get(cacheKey);
  const currentCount = cached ? cached.count + 1 : 1;

  if (currentCount > keyData.rateLimit.requests) {
    throw new AuthError(
      `Rate limit excedido. Máximo ${keyData.rateLimit.requests} requests por ${keyData.rateLimit.window}s`,
      429
    );
  }

  rateLimitCache.set(cacheKey, {
    count: currentCount,
    resetTime: now + windowMs,
  });

  // Limpar cache antigo
  for (const [key, value] of rateLimitCache.entries()) {
    if (value.resetTime < now) {
      rateLimitCache.delete(key);
    }
  }
}

export function authenticateRequest(
  request: Request,
  requiredPermission: string
) {
  const apiKey =
    request.headers.get("X-API-Key") ||
    request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    throw new AuthError(
      "API Key não fornecida. Use header X-API-Key ou Authorization: Bearer",
      401
    );
  }

  const keyData = validateApiKey(apiKey);

  if (!checkPermission(keyData, requiredPermission)) {
    throw new AuthError(
      `Permissão '${requiredPermission}' não encontrada para esta API Key`,
      403
    );
  }

  checkRateLimit(apiKey, keyData);

  return keyData;
}

// Middleware helper para Next.js
export function withAuth(handler: Function, permission: string) {
  return async (request: Request, ...args: any[]) => {
    try {
      const keyData = authenticateRequest(request, permission);

      // Adicionar dados da autenticação ao request (simulado)
      (request as any).auth = {
        apiKey: request.headers.get("X-API-Key"),
        clientId: keyData.clientId,
        permissions: keyData.permissions,
        keyData,
      };

      return await handler(request, ...args);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          {
            error: error.message,
            code:
              error.statusCode === 429
                ? "RATE_LIMIT_EXCEEDED"
                : "AUTHENTICATION_FAILED",
            timestamp: new Date().toISOString(),
          },
          { status: error.statusCode }
        );
      }
      throw error;
    }
  };
}

// Utilitário para gerar relatório de uso
export function getApiKeyUsage(apiKey: string) {
  const keyData = API_KEYS[apiKey];
  if (!keyData) return null;

  return {
    id: keyData.id,
    name: keyData.name,
    clientId: keyData.clientId,
    isActive: keyData.isActive,
    createdAt: keyData.createdAt,
    lastUsedAt: keyData.lastUsedAt,
    permissions: keyData.permissions,
    rateLimit: keyData.rateLimit,
  };
}
