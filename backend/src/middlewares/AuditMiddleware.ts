// src/middleware/AuditMiddleware.ts - Middleware de Auditoria
export class AuditMiddleware {
  private static auditService = AuditService.getInstance();

  public static audit(action: string, resource: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const startTime = Date.now();
      
      // Capturar resposta original
      const originalSend = res.send;
      let responseData: any;
      
      res.send = function(data: any) {
        responseData = data;
        return originalSend.call(this, data);
      };

      // Continuar com a requisição
      res.on('finish', async () => {
        const duration = Date.now() - startTime;
        const success = res.statusCode < 400;

        await AuditMiddleware.auditService.log({
          userId: req.user?.id,
          sessionId: req.sessionID,
          action,
          resource,
          resourceId: req.params.id,
          details: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            query: req.query,
            statusCode: res.statusCode,
            responseSize: JSON.stringify(responseData).length
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || '',
          success,
          errorMessage: success ? undefined : 'Request failed',
          duration
        });
      });

      next();
    };
  }
}