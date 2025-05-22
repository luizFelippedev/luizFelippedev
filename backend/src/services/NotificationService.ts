// src/services/NotificationService.ts - Sistema de Notificações
import { Server as SocketIOServer } from 'socket.io';
import { RedisService } from './RedisService';
import { EmailService } from '@services/EmailService';
import { LoggerService } from './LoggerService';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  recipients: string[];
  channels: ('socket' | 'email' | 'push')[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
}

export class NotificationService {
  private static instance: NotificationService;
  private io: SocketIOServer | null = null;
  private redis: RedisService;
  private emailService: EmailService;
  private logger: LoggerService;

  private constructor() {
    this.redis = RedisService.getInstance();
    this.emailService = EmailService.getInstance();
    this.logger = LoggerService.getInstance();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public setSocketIO(io: SocketIOServer): void {
    this.io = io;
  }

  public async sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateId(),
      createdAt: new Date()
    };

    // Armazenar notificação
    await this.storeNotification(fullNotification);

    // Enviar pelos canais especificados
    for (const channel of notification.channels) {
      switch (channel) {
        case 'socket':
          await this.sendSocketNotification(fullNotification);
          break;
        case 'email':
          await this.sendEmailNotification(fullNotification);
          break;
        case 'push':
          await this.sendPushNotification(fullNotification);
          break;
      }
    }
  }

  private async sendSocketNotification(notification: Notification): Promise<void> {
    if (!this.io) return;

    try {
      // Enviar para usuários específicos
      for (const userId of notification.recipients) {
        this.io.to(`user:${userId}`).emit('notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          timestamp: notification.createdAt
        });
      }

      // Broadcast para admins se for urgente
      if (notification.priority === 'urgent') {
        this.io.to('admins').emit('urgent_notification', notification);
      }

    } catch (error) {
      this.logger.error('Failed to send socket notification:', error);
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<void> {
    try {
      // Implementar envio de email baseado no tipo e prioridade
      const emailTemplate = this.getEmailTemplate(notification);
      
      for (const userId of notification.recipients) {
        await this.emailService.sendTemplatedEmail({
          to: await this.getUserEmail(userId),
          subject: notification.title,
          template: emailTemplate,
          data: {
            title: notification.title,
            message: notification.message,
            ...notification.data
          }
        });
      }
    } catch (error) {
      this.logger.error('Failed to send email notification:', error);
    }
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    // Implementar push notifications
    this.logger.info('Push notification would be sent here');
  }

  private async storeNotification(notification: Notification): Promise<void> {
    try {
      const key = `notification:${notification.id}`;
      await this.redis.getClient().setex(
        key,
        notification.expiresAt ? 
          Math.floor((notification.expiresAt.getTime() - Date.now()) / 1000) :
          86400 * 7, // 7 dias por padrão
        JSON.stringify(notification)
      );

      // Adicionar à lista de notificações de cada usuário
      for (const userId of notification.recipients) {
        await this.redis.getClient().lpush(
          `user:${userId}:notifications`,
          notification.id
        );
        await this.redis.getClient().expire(`user:${userId}:notifications`, 86400 * 30);
      }
    } catch (error) {
      this.logger.error('Failed to store notification:', error);
    }
  }

  public async getUserNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    try {
      const notificationIds = await this.redis.getClient().lrange(
        `user:${userId}:notifications`,
        0,
        limit - 1
      );

      const notifications: Notification[] = [];
      
      for (const id of notificationIds) {
        const notificationData = await this.redis.getClient().get(`notification:${id}`);
        if (notificationData) {
          notifications.push(JSON.parse(notificationData));
        }
      }

      return notifications;
    } catch (error) {
      this.logger.error('Failed to get user notifications:', error);
      return [];
    }
  }

  public async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      await this.redis.getClient().sadd(`user:${userId}:read_notifications`, notificationId);
    } catch (error) {
      this.logger.error('Failed to mark notification as read:', error);
    }
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getEmailTemplate(notification: Notification): string {
    switch (notification.type) {
      case 'info':
        return 'info-notification';
      case 'success':
        return 'success-notification';
      case 'warning':
        return 'warning-notification';
      case 'error':
        return 'error-notification';
      default:
        return 'generic-notification';
    }
  }

  private async getUserEmail(userId: string): Promise<string> {
    // Implementar busca de email do usuário
    return `user${userId}@example.com`;
  }
}

// src/utils/ApiResponse.ts - Padronização de Respostas
export class ApiResponse {
  public static success<T>(data: T, message?: string, meta?: any) {
    return {
      success: true,
      message: message || 'Operation completed successfully',
      data,
      meta,
      timestamp: new Date().toISOString()
    };
  }

  public static error(message: string, statusCode: number = 500, errors?: any) {
    return {
      success: false,
      message,
      statusCode,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  public static paginated<T>(data: T[], pagination: any, message?: string) {
    return {
      success: true,
      message: message || 'Data retrieved successfully',
      data,
      pagination,
      timestamp: new Date().toISOString()
    };
  }
}