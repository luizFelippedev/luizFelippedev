// src/services/AuditService.ts - Serviço de Auditoria
import { Schema, model, Document } from 'mongoose';

interface IAuditLog extends Document {
  userId?: string;
  sessionId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  duration?: number;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: String,
  sessionId: { type: String, required: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: String,
  details: Schema.Types.Mixed,
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  success: { type: Boolean, required: true },
  errorMessage: String,
  duration: Number,
  timestamp: { type: Date, default: Date.now }
}, {
  collection: 'audit_logs'
});

// Indexes para consultas eficientes
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);

export class AuditService {
  private static instance: AuditService;
  private logger: LoggerService;

  private constructor() {
    this.logger = LoggerService.getInstance();
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  public async log(auditData: {
    userId?: string;
    sessionId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    errorMessage?: string;
    duration?: number;
  }): Promise<void> {
    try {
      const auditEntry = new AuditLog({
        ...auditData,
        timestamp: new Date()
      });

      await auditEntry.save();

      // Log crítico para ações sensíveis
      if (this.isCriticalAction(auditData.action)) {
        this.logger.warn('Critical action performed', auditData);
      }
    } catch (error) {
      this.logger.error('Failed to save audit log:', error);
    }
  }

  public async getAuditLogs(filters: {
    userId?: string;
    resource?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ logs: IAuditLog[]; total: number }> {
    try {
      const query: any = {};
      
      if (filters.userId) query.userId = filters.userId;
      if (filters.resource) query.resource = filters.resource;
      if (filters.action) query.action = filters.action;
      
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = filters.startDate;
        if (filters.endDate) query.timestamp.$lte = filters.endDate;
      }

      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments(query)
      ]);

      return { logs, total };
    } catch (error) {
      this.logger.error('Failed to retrieve audit logs:', error);
      return { logs: [], total: 0 };
    }
  }

  public async getAuditStats(timeframe: 'day' | 'week' | 'month'): Promise<any> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const pipeline = [
        { $match: { timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: {
              action: '$action',
              success: '$success'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.action',
            total: { $sum: '$count' },
            successful: {
              $sum: {
                $cond: [{ $eq: ['$_id.success', true] }, '$count', 0]
              }
            },
            failed: {
              $sum: {
                $cond: [{ $eq: ['$_id.success', false] }, '$count', 0]
              }
            }
          }
        },
        { $sort: { total: -1 } }
      ];

      const stats = await AuditLog.aggregate(pipeline);
      return stats;
    } catch (error) {
      this.logger.error('Failed to get audit stats:', error);
      return [];
    }
  }

  private isCriticalAction(action: string): boolean {
    const criticalActions = [
      'user_delete',
      'project_delete',
      'admin_login',
      'password_change',
      'permission_change',
      'system_config_change'
    ];
    
    return criticalActions.includes(action);
  }
}