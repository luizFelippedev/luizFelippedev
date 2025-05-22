// src/middleware/SecurityMiddleware.ts - Middleware de Segurança Avançado
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult, matchedData } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';
import { LoggerService } from '../services/LoggerService';
import { RedisService } from '../services/RedisService';

export class SecurityMiddleware {
  private static logger = LoggerService.getInstance();
  private static redis = RedisService.getInstance();

  // Sanitização de entrada avançada
  public static sanitizeInput(req: Request, res: Response, next: NextFunction): void {
    try {
      // Sanitizar body
      if (req.body && typeof req.body === 'object') {
        req.body = SecurityMiddleware.deepSanitize(req.body);
      }

      // Sanitizar query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = SecurityMiddleware.deepSanitize(req.query);
      }

      // Sanitizar params
      if (req.params && typeof req.params === 'object') {
        req.params = SecurityMiddleware.deepSanitize(req.params);
      }

      next();
    } catch (error) {
      SecurityMiddleware.logger.error('Error in input sanitization:', error);
      next(error);
    }
  }

  private static deepSanitize(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj, { 
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => SecurityMiddleware.deepSanitize(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = DOMPurify.sanitize(key, { 
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: []
        });
        sanitized[sanitizedKey] = SecurityMiddleware.deepSanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  }

  // Proteção contra SQL Injection e NoSQL Injection
  public static antiInjection(req: Request, res: Response, next: NextFunction): void {
    const suspiciousPatterns = [
      /(\$where|\$ne|\$in|\$nin|\$gt|\$lt|\$gte|\$lte)/i,
      /(union|select|insert|update|delete|drop|create|alter)/i,
      /(script|javascript|vbscript|onload|onerror)/i,
      /(<|>|&lt;|&gt;)/g
    ];

    const checkForInjection = (value: any): boolean => {
      if (typeof value === 'string') {
        return suspiciousPatterns.some(pattern => pattern.test(value));
      }
      if (Array.isArray(value)) {
        return value.some(item => checkForInjection(item));
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(val => checkForInjection(val));
      }
      return false;
    };

    if (checkForInjection(req.body) || 
        checkForInjection(req.query) || 
        checkForInjection(req.params)) {
      SecurityMiddleware.logger.warn('Potential injection attempt blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid input detected',
        code: 'SECURITY_VIOLATION'
      });
    }

    next();
  }

  // Rate limiting avançado por usuário e IP
  public static createAdvancedRateLimit(options: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (req: Request) => string;
  }) {
    return rateLimit({
      windowMs: options.windowMs,
      max: options.maxRequests,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      keyGenerator: options.keyGenerator || ((req: Request) => {
        return req.user?.id || req.ip;
      }),
      handler: (req: Request, res: Response) => {
        SecurityMiddleware.logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userId: req.user?.id,
          userAgent: req.get('User-Agent')
        });
        
        res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.round(options.windowMs / 1000)
        });
      }
    });
  }

  // Proteção CSRF
  public static async csrfProtection(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const token = req.get('X-CSRF-Token') || req.body._token;
    const sessionToken = req.session?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      SecurityMiddleware.logger.warn('CSRF token validation failed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        expectedToken: sessionToken,
        receivedToken: token
      });

      return res.status(403).json({
        success: false,
        message: 'Invalid CSRF token',
        code: 'CSRF_VIOLATION'
      });
    }

    next();
  }

  // Bloqueio de IP suspeito
  public static async blockSuspiciousIPs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientIP = req.ip;
      const isBlocked = await SecurityMiddleware.redis.getClient().get(`blocked_ip:${clientIP}`);
      
      if (isBlocked) {
        SecurityMiddleware.logger.warn('Blocked IP attempted access', { ip: clientIP });
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          code: 'IP_BLOCKED'
        });
      }

      // Verificar tentativas suspeitas
      const attemptKey = `suspicious_attempts:${clientIP}`;
      const attempts = await SecurityMiddleware.redis.getClient().incr(attemptKey);
      
      if (attempts === 1) {
        await SecurityMiddleware.redis.getClient().expire(attemptKey, 3600); // 1 hora
      }

      if (attempts > 50) { // Mais de 50 tentativas suspeitas em 1 hora
        await SecurityMiddleware.redis.getClient().setex(`blocked_ip:${clientIP}`, 86400, 'auto_blocked');
        SecurityMiddleware.logger.warn('IP auto-blocked due to suspicious activity', { ip: clientIP, attempts });
        
        return res.status(403).json({
          success: false,
          message: 'IP temporarily blocked due to suspicious activity',
          code: 'IP_AUTO_BLOCKED'
        });
      }

      next();
    } catch (error) {
      SecurityMiddleware.logger.error('Error in IP blocking middleware:', error);
      next();
    }
  }

  // Validação de origem
  public static validateOrigin(req: Request, res: Response, next: NextFunction): void {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    const origin = req.get('Origin') || req.get('Referer');

    if (req.method !== 'GET' && origin) {
      const isAllowed = allowedOrigins.some(allowed => 
        origin.startsWith(allowed) || allowed === '*'
      );

      if (!isAllowed) {
        SecurityMiddleware.logger.warn('Invalid origin blocked', {
          origin,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(403).json({
          success: false,
          message: 'Origin not allowed',
          code: 'INVALID_ORIGIN'
        });
      }
    }

    next();
  }

  // Detecção de bot
  public static detectBot(req: Request, res: Response, next: NextFunction): void {
    const userAgent = req.get('User-Agent') || '';
    const botPatterns = [
      /bot/i, /crawl/i, /spider/i, /scrape/i,
      /curl/i, /wget/i, /python/i, /php/i
    ];

    const isBot = botPatterns.some(pattern => pattern.test(userAgent));
    
    if (isBot) {
      req.isBot = true;
      SecurityMiddleware.logger.info('Bot detected', {
        userAgent,
        ip: req.ip
      });
    }

    next();
  }
}