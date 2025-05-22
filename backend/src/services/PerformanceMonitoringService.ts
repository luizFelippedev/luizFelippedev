// src/services/PerformanceMonitoringService.ts - Monitoramento de Performance
interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  labels?: Record<string, string>;
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private logger: LoggerService;
  private redis: RedisService;
  private metrics: Map<string, PerformanceMetric[]> = new Map();

  private constructor() {
    this.logger = LoggerService.getInstance();
    this.redis = RedisService.getInstance();
    this.startMetricsCollection();
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  public recordMetric(name: string, value: number, unit: string, labels?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      labels
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Manter apenas os últimos 1000 pontos de dados
    if (metrics.length > 1000) {
      metrics.shift();
    }

    // Armazenar no Redis para persistência
    this.storeMetricInRedis(metric);
  }

  private async storeMetricInRedis(metric: PerformanceMetric): Promise<void> {
    try {
      const key = `metrics:${metric.name}:${new Date().toISOString().split('T')[0]}`;
      const data = JSON.stringify(metric);
      
      await this.redis.getClient().lpush(key, data);
      await this.redis.getClient().expire(key, 86400 * 30); // 30 dias
    } catch (error) {
      this.logger.error('Failed to store metric in Redis:', error);
    }
  }

  public getMetrics(name: string, limit: number = 100): PerformanceMetric[] {
    const metrics = this.metrics.get(name) || [];
    return metrics.slice(-limit);
  }

  public async getAggregatedMetrics(name: string, timeframe: 'hour' | 'day' | 'week'): Promise<any> {
    try {
      const now = new Date();
      let startTime: Date;
      
      switch (timeframe) {
        case 'hour':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'day':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
      }

      const metrics = this.getMetrics(name, 10000)
        .filter(m => m.timestamp >= startTime);

      if (metrics.length === 0) {
        return null;
      }

      const values = metrics.map(m => m.value);
      
      return {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        p95: this.calculatePercentile(values, 95),
        p99: this.calculatePercentile(values, 99)
      };
    } catch (error) {
      this.logger.error('Failed to get aggregated metrics:', error);
      return null;
    }
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private startMetricsCollection(): void {
    // Coletar métricas do sistema a cada 30 segundos
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);
  }

  private collectSystemMetrics(): void {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      this.recordMetric('memory_heap_used', memUsage.heapUsed, 'bytes');
      this.recordMetric('memory_heap_total', memUsage.heapTotal, 'bytes');
      this.recordMetric('memory_rss', memUsage.rss, 'bytes');
      this.recordMetric('cpu_user', cpuUsage.user, 'microseconds');
      this.recordMetric('cpu_system', cpuUsage.system, 'microseconds');
      this.recordMetric('uptime', process.uptime(), 'seconds');
    } catch (error) {
      this.logger.error('Failed to collect system metrics:', error);
    }
  }
}