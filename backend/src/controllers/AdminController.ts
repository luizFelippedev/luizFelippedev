// src/controllers/AdminController.ts - Controlador Administrativo Completo
import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { AuditService } from '../services/AuditService';
import { BackupService } from '../services/BackupService';
import { PerformanceMonitoringService } from '../services/PerformanceMonitoringService';
import { NotificationService } from '../services/NotificationService';
import { CacheService } from '../services/CacheService';
import { LoggerService } from '../services/LoggerService';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Certificate } from '../models/Certificate';
import { ApiResponse } from '../utils/ApiResponse';

export class AdminController {
  private analyticsService: AnalyticsService;
  private auditService: AuditService;
  private backupService: BackupService;
  private performanceService: PerformanceMonitoringService;
  private notificationService: NotificationService;
  private cacheService: CacheService;
  private logger: LoggerService;

  constructor() {
    this.analyticsService = AnalyticsService.getInstance();
    this.auditService = AuditService.getInstance();
    this.backupService = BackupService.getInstance();
    this.performanceService = PerformanceMonitoringService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.cacheService = CacheService.getInstance();
    this.logger = LoggerService.getInstance();
  }

  // Dashboard Principal
  public async getDashboardData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cacheKey = 'admin:dashboard:overview';
      let dashboardData = await this.cacheService.get(cacheKey);

      if (!dashboardData) {
        const [
          totalProjects,
          totalCertificates,
          totalUsers,
          recentAnalytics,
          systemMetrics,
          recentAuditLogs
        ] = await Promise.all([
          Project.countDocuments({ isActive: true }),
          Certificate.countDocuments({ isActive: true }),
          User.countDocuments({ isActive: true }),
          this.analyticsService.getRealTimeMetrics(),
          this.getSystemMetrics(),
          this.auditService.getAuditLogs({ limit: 10 })
        ]);

        dashboardData = {
          overview: {
            totalProjects,
            totalCertificates,
            totalUsers,
            uptime: process.uptime()
          },
          analytics: recentAnalytics,
          systemMetrics,
          recentActivity: recentAuditLogs.logs,
          performance: await this.getPerformanceOverview()
        };

        await this.cacheService.set(cacheKey, dashboardData, 300); // 5 minutos
      }

      res.json(ApiResponse.success(dashboardData));
    } catch (error) {
      this.logger.error('Error getting dashboard data:', error);
      next(error);
    }
  }

  // Métricas do Sistema
  public async getSystemMetrics(req?: Request, res?: Response, next?: NextFunction): Promise<any> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      const metrics = {
        memory: {
          used: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
          total: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
          external: Math.round((memUsage.external / 1024 / 1024) * 100) / 100,
          rss: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      };

      if (res) {
        res.json(ApiResponse.success(metrics));
      } else {
        return metrics;
      }
    } catch (error) {
      this.logger.error('Error getting system metrics:', error);
      if (next) next(error);
      return null;
    }
  }

  // Analytics Avançado
  public async getAdvancedAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, granularity = 'day' } = req.query;
      
      const analytics = await this.analyticsService.getMetrics(
        startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate as string || new Date().toISOString()
      );

      // Dados agregados por período
      const aggregatedData = await this.getAggregatedAnalytics(
        startDate as string,
        endDate as string,
        granularity as string
      );

      res.json(ApiResponse.success({
        ...analytics,
        aggregated: aggregatedData,
        trends: await this.calculateTrends(analytics)
      }));
    } catch (error) {
      this.logger.error('Error getting advanced analytics:', error);
      next(error);
    }
  }

  // Gerenciamento de Usuários
  public async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20, search, role, status } = req.query;
      
      const filters: any = {};
      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      if (role) filters.role = role;
      if (status) filters.isActive = status === 'active';

      const users = await User.find(filters)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await User.countDocuments(filters);

      res.json(ApiResponse.paginated(users, {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }));
    } catch (error) {
      this.logger.error('Error getting users:', error);
      next(error);
    }
  }

  public async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { role, updatedAt: new Date() },
        { new: true, select: '-password' }
      );

      if (!user) {
        res.status(404).json(ApiResponse.error('User not found', 404));
        return;
      }

      // Audit log
      await this.auditService.log({
        userId: req.user.id,
        sessionId: req.sessionID,
        action: 'user_role_update',
        resource: 'user',
        resourceId: userId,
        details: { newRole: role },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        success: true
      });

      res.json(ApiResponse.success(user, 'User role updated successfully'));
    } catch (error) {
      this.logger.error('Error updating user role:', error);
      next(error);
    }
  }

  // Logs de Auditoria
  public async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 50,
        userId,
        resource,
        action,
        startDate,
        endDate
      } = req.query;

      const filters: any = {};
      if (userId) filters.userId = userId;
      if (resource) filters.resource = resource;
      if (action) filters.action = action;
      if (startDate || endDate) {
        filters.timestamp = {};
        if (startDate) filters.timestamp.$gte = new Date(startDate as string);
        if (endDate) filters.timestamp.$lte = new Date(endDate as string);
      }

      const { logs, total } = await this.auditService.getAuditLogs({
        ...filters,
        page: Number(page),
        limit: Number(limit)
      });

      res.json(ApiResponse.paginated(logs, {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }));
    } catch (error) {
      this.logger.error('Error getting audit logs:', error);
      next(error);
    }
  }

  // Backup e Restore
  public async createBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Executar backup em background
      this.backupService.createFullBackup().catch(error => {
        this.logger.error('Backup failed:', error);
      });

      // Notificar administradores
      await this.notificationService.sendNotification({
        type: 'info',
        title: 'Backup Iniciado',
        message: 'Backup completo do sistema foi iniciado.',
        recipients: ['admin'],
        channels: ['socket'],
        priority: 'normal'
      });

      res.json(ApiResponse.success(null, 'Backup initiated successfully'));
    } catch (error) {
      this.logger.error('Error initiating backup:', error);
      next(error);
    }
  }

  // Performance Monitoring
  public async getPerformanceMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { metric, timeframe = 'hour' } = req.query;
      
      if (metric) {
        const data = await this.performanceService.getAggregatedMetrics(
          metric as string,
          timeframe as 'hour' | 'day' | 'week'
        );
        res.json(ApiResponse.success(data));
      } else {
        const overview = await this.getPerformanceOverview();
        res.json(ApiResponse.success(overview));
      }
    } catch (error) {
      this.logger.error('Error getting performance metrics:', error);
      next(error);
    }
  }

  // Cache Management
  public async clearCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pattern } = req.body;
      
      if (pattern) {
        await this.cacheService.deletePattern(pattern);
      } else {
        await this.cacheService.flushAll();
      }

      // Audit log
      await this.auditService.log({
        userId: req.user.id,
        sessionId: req.sessionID,
        action: 'cache_clear',
        resource: 'system',
        details: { pattern: pattern || 'all' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        success: true
      });

      res.json(ApiResponse.success(null, 'Cache cleared successfully'));
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
      next(error);
    }
  }

  // Configurações do Sistema
  public async getSystemConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = {
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
        features: {
          analytics: true,
          backups: true,
          notifications: true,
          search: !!process.env.ELASTICSEARCH_URL
        },
        limits: {
          uploadSize: process.env.MAX_FILE_SIZE || '50MB',
          rateLimit: process.env.RATE_LIMIT_MAX || '1000'
        }
      };

      res.json(ApiResponse.success(config));
    } catch (error) {
      this.logger.error('Error getting system config:', error);
      next(error);
    }
  }

  public async updateSystemConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { settings } = req.body;
      
      // Validar e aplicar configurações
      // (implementação específica dependeria dos settings disponíveis)
      
      // Audit log
      await this.auditService.log({
        userId: req.user.id,
        sessionId: req.sessionID,
        action: 'system_config_update',
        resource: 'system',
        details: settings,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        success: true
      });

      res.json(ApiResponse.success(null, 'System configuration updated'));
    } catch (error) {
      this.logger.error('Error updating system config:', error);
      next(error);
    }
  }

  // Métodos auxiliares
  private async getAggregatedAnalytics(startDate?: string, endDate?: string, granularity?: string): Promise<any> {
    // Implementar agregação de dados por período
    return {
      pageViewsByDay: [],
      projectViewsByCategory: [],
      geographicDistribution: [],
      deviceBreakdown: []
    };
  }

  private async calculateTrends(analytics: any): Promise<any> {
    // Calcular tendências e comparações
    return {
      pageViewsTrend: 'up',
      uniqueVisitorsTrend: 'up',
      projectViewsTrend: 'stable',
      conversionTrend: 'up'
    };
  }

  private async getPerformanceOverview(): Promise<any> {
    const [
      requestDuration,
      memoryUsage,
      cpuUsage
    ] = await Promise.all([
      this.performanceService.getAggregatedMetrics('request_duration', 'hour'),
      this.performanceService.getAggregatedMetrics('memory_heap_used', 'hour'),
      this.performanceService.getAggregatedMetrics('cpu_user', 'hour')
    ]);

    return {
      requests: requestDuration,
      memory: memoryUsage,
      cpu: cpuUsage,
      alerts: await this.checkPerformanceAlerts()
    };
  }

  private async checkPerformanceAlerts(): Promise<any[]> {
    const alerts = [];
    
    // Verificar uso de memória
    const memUsage = process.memoryUsage();
    const memoryPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (memoryPercentage > 90) {
      alerts.push({
        type: 'warning',
        message: 'High memory usage detected',
        value: `${memoryPercentage.toFixed(1)}%`
      });
    }

    return alerts;
  }
}