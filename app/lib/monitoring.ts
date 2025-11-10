// app/lib/monitoring.ts
export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  unit?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: "gt" | "lt" | "eq" | "gte" | "lte";
  threshold: number;
  window: number; // Janela de tempo em segundos
  enabled: boolean;
  notification: {
    email?: string[];
    webhook?: string;
    slack?: string;
  };
}

export interface SystemHealth {
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

class MonitoringService {
  private metrics: Map<string, MetricData[]> = new Map();
  private alerts: Map<string, AlertRule> = new Map();
  private readonly MAX_METRICS_PER_TYPE = 1000;
  private readonly METRIC_RETENTION_HOURS = 24;

  constructor() {
    this.setupDefaultAlerts();
    this.startMetricsCleanup();
  }

  /**
   * Registra uma métrica
   */
  recordMetric(metric: MetricData): void {
    const key = `${metric.name}_${JSON.stringify(metric.tags || {})}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metricsArray = this.metrics.get(key)!;
    metricsArray.push(metric);

    // Manter apenas as métricas mais recentes
    if (metricsArray.length > this.MAX_METRICS_PER_TYPE) {
      metricsArray.shift();
    }

    // Verificar alertas
    this.checkAlerts(metric);
  }

  /**
   * Incrementa contador
   */
  incrementCounter(
    name: string,
    value: number = 1,
    tags?: Record<string, string>
  ): void {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      tags,
      unit: "count",
    });
  }

  /**
   * Registra tempo de resposta
   */
  recordResponseTime(endpoint: string, duration: number, status: number): void {
    this.recordMetric({
      name: "api_response_time",
      value: duration,
      timestamp: Date.now(),
      tags: {
        endpoint,
        status: status.toString(),
        status_class: this.getStatusClass(status),
      },
      unit: "ms",
    });

    // Incrementar contador de requisições
    this.incrementCounter("api_requests_total", 1, {
      endpoint,
      status: status.toString(),
      status_class: this.getStatusClass(status),
    });
  }

  /**
   * Registra erro
   */
  recordError(type: string, message: string, endpoint?: string): void {
    this.incrementCounter("api_errors_total", 1, {
      type,
      endpoint: endpoint || "unknown",
      error_message: message.substring(0, 100), // Limitar tamanho
    });
  }

  /**
   * Registra uso de recursos do sistema
   */
  recordSystemMetrics(): void {
    if (typeof process !== "undefined") {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      this.recordMetric({
        name: "system_memory_used",
        value: memUsage.heapUsed,
        timestamp: Date.now(),
        unit: "bytes",
      });

      this.recordMetric({
        name: "system_memory_total",
        value: memUsage.heapTotal,
        timestamp: Date.now(),
        unit: "bytes",
      });

      this.recordMetric({
        name: "system_cpu_user",
        value: cpuUsage.user,
        timestamp: Date.now(),
        unit: "microseconds",
      });
    }
  }

  /**
   * Obtém métricas por nome
   */
  getMetrics(
    name: string,
    timeRange?: { start: number; end: number }
  ): MetricData[] {
    const allMetrics: MetricData[] = [];

    for (const [key, metrics] of this.metrics) {
      if (key.startsWith(name)) {
        allMetrics.push(...metrics);
      }
    }

    let filtered = allMetrics.filter((m) => m.name === name);

    if (timeRange) {
      filtered = filtered.filter(
        (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    return filtered.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Calcula estatísticas de métricas
   */
  getMetricStats(name: string, timeRange?: { start: number; end: number }) {
    const metrics = this.getMetrics(name, timeRange);

    if (metrics.length === 0) {
      return null;
    }

    const values = metrics.map((m) => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Percentis
    const sorted = [...values].sort((a, b) => a - b);
    const p50Index = Math.floor(sorted.length * 0.5);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      count: metrics.length,
      sum,
      avg,
      min,
      max,
      p50: sorted[p50Index],
      p95: sorted[p95Index],
      p99: sorted[p99Index],
    };
  }

  /**
   * Verifica saúde do sistema
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const now = Date.now();
    const lastMinute = now - 60000;

    // Verificar APIs
    const apiErrors = this.getMetrics("api_errors_total", {
      start: lastMinute,
      end: now,
    });
    const apiRequests = this.getMetrics("api_requests_total", {
      start: lastMinute,
      end: now,
    });

    const totalRequests = apiRequests.reduce((sum, m) => sum + m.value, 0);
    const totalErrors = apiErrors.reduce((sum, m) => sum + m.value, 0);
    const errorRate =
      totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    // Tempo de resposta médio
    const responseTimeStats = this.getMetricStats("api_response_time", {
      start: lastMinute,
      end: now,
    });
    const avgResponseTime = responseTimeStats?.avg || 0;

    // Métricas de sistema
    const memoryStats = this.getMetricStats("system_memory_used", {
      start: lastMinute,
      end: now,
    });
    const memoryUsage = memoryStats?.avg || 0;

    // Determinar status geral
    let status: SystemHealth["status"] = "healthy";

    if (errorRate > 10 || avgResponseTime > 5000) {
      status = "critical";
    } else if (errorRate > 5 || avgResponseTime > 2000) {
      status = "warning";
    }

    return {
      status,
      timestamp: now,
      checks: {
        api: errorRate < 10,
        database: true, // Implementar check real
        mercadopago: true, // Implementar check real
        webhook: true, // Implementar check real
      },
      metrics: {
        requests_per_minute: totalRequests,
        error_rate: errorRate,
        response_time_avg: avgResponseTime,
        memory_usage: memoryUsage,
        cpu_usage: 0, // Implementar CPU usage real
      },
    };
  }

  /**
   * Adiciona regra de alerta
   */
  addAlertRule(rule: AlertRule): void {
    this.alerts.set(rule.id, rule);
  }

  /**
   * Remove regra de alerta
   */
  removeAlertRule(id: string): void {
    this.alerts.delete(id);
  }

  /**
   * Lista regras de alerta
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alerts.values());
  }

  private setupDefaultAlerts(): void {
    // Alerta para alta taxa de erro
    this.addAlertRule({
      id: "high_error_rate",
      name: "Alta Taxa de Erro",
      metric: "api_errors_total",
      operator: "gt",
      threshold: 10,
      window: 300, // 5 minutos
      enabled: true,
      notification: {
        email: ["admin@example.com"],
      },
    });

    // Alerta para tempo de resposta alto
    this.addAlertRule({
      id: "high_response_time",
      name: "Tempo de Resposta Alto",
      metric: "api_response_time",
      operator: "gt",
      threshold: 5000, // 5 segundos
      window: 180, // 3 minutos
      enabled: true,
      notification: {
        email: ["dev@example.com"],
      },
    });

    // Alerta para uso de memória alto
    this.addAlertRule({
      id: "high_memory_usage",
      name: "Alto Uso de Memória",
      metric: "system_memory_used",
      operator: "gt",
      threshold: 1024 * 1024 * 1024, // 1GB
      window: 600, // 10 minutos
      enabled: true,
      notification: {
        email: ["ops@example.com"],
      },
    });
  }

  private checkAlerts(metric: MetricData): void {
    for (const alert of this.alerts.values()) {
      if (!alert.enabled || alert.metric !== metric.name) {
        continue;
      }

      // Verificar se deve disparar alerta
      const windowStart = Date.now() - alert.window * 1000;
      const recentMetrics = this.getMetrics(alert.metric, {
        start: windowStart,
        end: Date.now(),
      });

      if (recentMetrics.length === 0) continue;

      const shouldAlert = this.evaluateAlertCondition(recentMetrics, alert);

      if (shouldAlert) {
        this.triggerAlert(alert, metric);
      }
    }
  }

  private evaluateAlertCondition(
    metrics: MetricData[],
    alert: AlertRule
  ): boolean {
    // Para este exemplo, usar o valor mais recente
    const latestValue = metrics[metrics.length - 1]?.value || 0;

    switch (alert.operator) {
      case "gt":
        return latestValue > alert.threshold;
      case "gte":
        return latestValue >= alert.threshold;
      case "lt":
        return latestValue < alert.threshold;
      case "lte":
        return latestValue <= alert.threshold;
      case "eq":
        return latestValue === alert.threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(
    alert: AlertRule,
    metric: MetricData
  ): Promise<void> {
    console.warn(`🚨 ALERTA: ${alert.name}`, {
      alert: alert.name,
      metric: metric.name,
      value: metric.value,
      threshold: alert.threshold,
      timestamp: new Date(metric.timestamp).toISOString(),
    });

    // Implementar notificações reais
    if (alert.notification.email) {
      await this.sendEmailAlert(alert, metric);
    }

    if (alert.notification.webhook) {
      await this.sendWebhookAlert(alert, metric);
    }

    if (alert.notification.slack) {
      await this.sendSlackAlert(alert, metric);
    }
  }

  private async sendEmailAlert(
    alert: AlertRule,
    metric: MetricData
  ): Promise<void> {
    // Implementar envio de email
    console.log(`📧 Email alert sent for ${alert.name}`);
  }

  private async sendWebhookAlert(
    alert: AlertRule,
    metric: MetricData
  ): Promise<void> {
    // Implementar webhook
    console.log(`🔗 Webhook alert sent for ${alert.name}`);
  }

  private async sendSlackAlert(
    alert: AlertRule,
    metric: MetricData
  ): Promise<void> {
    // Implementar Slack
    console.log(`💬 Slack alert sent for ${alert.name}`);
  }

  private getStatusClass(status: number): string {
    if (status >= 200 && status < 300) return "2xx";
    if (status >= 300 && status < 400) return "3xx";
    if (status >= 400 && status < 500) return "4xx";
    if (status >= 500) return "5xx";
    return "unknown";
  }

  private startMetricsCleanup(): void {
    // Limpar métricas antigas a cada hora
    setInterval(() => {
      const cutoff = Date.now() - this.METRIC_RETENTION_HOURS * 60 * 60 * 1000;

      for (const [key, metrics] of this.metrics) {
        const filtered = metrics.filter((m) => m.timestamp > cutoff);
        this.metrics.set(key, filtered);
      }
    }, 60 * 60 * 1000); // A cada hora
  }
}

// Instância singleton
export const monitoring = new MonitoringService();

// Middleware para capturar métricas automaticamente
export function withMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  name: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      monitoring.recordResponseTime(name, duration, 200);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const status =
        error instanceof Error && "status" in error
          ? (error as any).status
          : 500;

      monitoring.recordResponseTime(name, duration, status);
      monitoring.recordError(
        "function_error",
        error instanceof Error ? error.message : "Unknown error",
        name
      );

      throw error;
    }
  };
}

export default monitoring;
