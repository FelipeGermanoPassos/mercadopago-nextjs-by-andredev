// app/api/cache/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiCache, checkoutCache, metricsCache } from "@/app/lib/cache";
import { withAuth } from "@/app/lib/auth";

async function handleGetCacheStats(request: NextRequest) {
  try {
    const cacheStats = {
      api: apiCache.getStats(),
      checkout: checkoutCache.getStats(),
      metrics: metricsCache.getStats(),
    };

    // Calcular estatísticas agregadas
    const totalHits = Object.values(cacheStats).reduce(
      (sum, stats) => sum + stats.hits,
      0
    );
    const totalMisses = Object.values(cacheStats).reduce(
      (sum, stats) => sum + stats.misses,
      0
    );
    const totalItems = Object.values(cacheStats).reduce(
      (sum, stats) => sum + stats.totalItems,
      0
    );
    const totalSize = Object.values(cacheStats).reduce(
      (sum, stats) => sum + stats.totalSize,
      0
    );
    const totalEvictions = Object.values(cacheStats).reduce(
      (sum, stats) => sum + stats.evictions,
      0
    );

    const aggregated = {
      totalHits,
      totalMisses,
      overallHitRate:
        totalHits + totalMisses > 0
          ? (totalHits / (totalHits + totalMisses)) * 100
          : 0,
      totalItems,
      totalSize,
      totalEvictions,
      cacheCount: Object.keys(cacheStats).length,
    };

    return NextResponse.json({
      individual: cacheStats,
      aggregated,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Erro ao obter estatísticas de cache:", error);
    return NextResponse.json(
      { error: "Erro interno ao obter estatísticas" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetCacheStats, "read_cache");
