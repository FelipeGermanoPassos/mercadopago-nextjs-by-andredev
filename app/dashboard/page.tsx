// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";

interface SystemHealth {
  status: "healthy" | "warning" | "critical";
  timestamp: number;
  checks: {
    api: boolean;
    database: boolean;
    mercadopago: boolean;
    webhook: boolean;
  };
  metrics: {
    requests_per_minute: number;
    error_rate: number;
    response_time_avg: number;
    memory_usage: number;
    cpu_usage: number;
  };
}

interface MetricStats {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

export default function DashboardPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [responseTimeStats, setResponseTimeStats] =
    useState<MetricStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar saúde do sistema
        const healthResponse = await fetch("/api/monitoring/health");
        const healthData = await healthResponse.json();
        setHealth(healthData);

        // Buscar estatísticas de tempo de resposta
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;

        const statsResponse = await fetch(
          `/api/monitoring/metrics?name=api_response_time&start=${fiveMinutesAgo}&end=${now}&stats=true`,
          {
            headers: {
              "X-API-Key": "demo-key", // Em produção, usar key real
            },
          }
        );

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setResponseTimeStats(statsData.stats);
        }

        setLastUpdate(Date.now());
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Atualizar a cada 30s

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return "✅";
      case "warning":
        return "⚠️";
      case "critical":
        return "🚨";
      default:
        return "❓";
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard de Monitoramento
          </h1>
          <p className="text-gray-600">
            Status em tempo real do sistema MercadoPago NextJS API
          </p>
          <p className="text-sm text-gray-500">
            Última atualização: {new Date(lastUpdate).toLocaleString()}
          </p>
        </div>

        {/* Status Geral */}
        {health && (
          <div className="mb-8">
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full ${getStatusColor(
                health.status
              )}`}
            >
              <span className="mr-2 text-lg">
                {getStatusIcon(health.status)}
              </span>
              <span className="font-semibold capitalize">
                Sistema{" "}
                {health.status === "healthy"
                  ? "Saudável"
                  : health.status === "warning"
                  ? "Com Avisos"
                  : "Crítico"}
              </span>
            </div>
          </div>
        )}

        {/* Cards de Métricas */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Requisições/min
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {health.metrics.requests_per_minute}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Taxa de Erro
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {health.metrics.error_rate.toFixed(2)}%
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Tempo Resposta
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(health.metrics.response_time_avg)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Uso de Memória
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatBytes(health.metrics.memory_usage)}
              </p>
            </div>
          </div>
        )}

        {/* Checks de Saúde */}
        {health && (
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Verificações de Saúde
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(health.checks).map(([check, status]) => (
                  <div key={check} className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        status ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="capitalize text-sm text-gray-700">
                      {check}
                    </span>
                    <span className="text-xs text-gray-500">
                      {status ? "OK" : "ERRO"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Estatísticas Detalhadas */}
        {responseTimeStats && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Estatísticas de Performance (Últimos 5 min)
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Média
                  </h4>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDuration(responseTimeStats.avg)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    P50 (Mediana)
                  </h4>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDuration(responseTimeStats.p50)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    P95
                  </h4>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDuration(responseTimeStats.p95)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    P99
                  </h4>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDuration(responseTimeStats.p99)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Mínimo
                  </h4>
                  <p className="text-lg font-semibold text-green-700">
                    {formatDuration(responseTimeStats.min)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Máximo
                  </h4>
                  <p className="text-lg font-semibold text-red-700">
                    {formatDuration(responseTimeStats.max)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Total
                  </h4>
                  <p className="text-lg font-semibold text-gray-900">
                    {responseTimeStats.count} req
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Soma
                  </h4>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDuration(responseTimeStats.sum)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Dashboard atualizado automaticamente a cada 30 segundos</p>
        </div>
      </div>
    </div>
  );
}
