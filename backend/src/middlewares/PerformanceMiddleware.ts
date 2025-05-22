// src/middleware/PerformanceMiddleware.ts - Middleware de Performance
export class PerformanceMiddleware {
  private static performanceService = PerformanceMonitoringService.getInstance();

  public static measurePerformance(req: Request, res: Response, next: NextFunction): void {
    const startTime = process.hrtime.bigint();
    
    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      PerformanceMiddleware.performanceService.recordMetric(
        'request_duration',
        duration,
        'ms',
        {
          method: req.method,
          route: req.route?.path || req.path,
          status: res.statusCode.toString()
        }
      );
      
      PerformanceMiddleware.performanceService.recordMetric(
        'request_count',
        1,
        'count',
        {
          method: req.method,
          status: res.statusCode.toString()
        }
      );
    });

    next();
  }
}