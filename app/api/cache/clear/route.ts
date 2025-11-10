// app/api/cache/clear/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiCache, checkoutCache, metricsCache } from "@/app/lib/cache";
import { withAuth } from "@/app/lib/auth";

async function handleClearCache(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cacheType = searchParams.get("type"); // 'api', 'checkout', 'metrics', 'all'
    const key = searchParams.get("key"); // Chave específica para limpar

    let cleared = 0;

    if (key) {
      // Limpar chave específica
      switch (cacheType) {
        case "api":
          if (apiCache.delete(key)) cleared++;
          break;
        case "checkout":
          if (checkoutCache.delete(key)) cleared++;
          break;
        case "metrics":
          if (metricsCache.delete(key)) cleared++;
          break;
        default:
          // Tentar limpar de todos os caches
          if (apiCache.delete(key)) cleared++;
          if (checkoutCache.delete(key)) cleared++;
          if (metricsCache.delete(key)) cleared++;
      }

      return NextResponse.json({
        message: `Chave '${key}' removida de ${cleared} cache(s)`,
        key,
        cachesCleared: cleared,
      });
    } else {
      // Limpar cache inteiro(s)
      switch (cacheType) {
        case "api":
          apiCache.clear();
          cleared = 1;
          break;
        case "checkout":
          checkoutCache.clear();
          cleared = 1;
          break;
        case "metrics":
          metricsCache.clear();
          cleared = 1;
          break;
        case "all":
        default:
          apiCache.clear();
          checkoutCache.clear();
          metricsCache.clear();
          cleared = 3;
      }

      return NextResponse.json({
        message: `${cleared} cache(s) limpo(s) com sucesso`,
        type: cacheType || "all",
        cachesCleared: cleared,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error("Erro ao limpar cache:", error);
    return NextResponse.json(
      { error: "Erro interno ao limpar cache" },
      { status: 500 }
    );
  }
}

export const DELETE = withAuth(handleClearCache, "manage_cache");
