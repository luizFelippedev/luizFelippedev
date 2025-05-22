// src/services/EmailService.ts - Serviço de Email Avançado
import nodemailer from 'nodemailer';
import { LoggerService } from './LoggerService';
import { RedisService } from './RedisService';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  data?: any;
  html?: string;
  text?: string;
  attachments?: any[];
  priority?: 'high' | 'normal' | 'low';
  delay?: number; // Send after X seconds
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;
  private logger: LoggerService;
  private redis: RedisService;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  private constructor() {
    this.logger = LoggerService.getInstance();
    this.redis = RedisService.getInstance();
    this.setupTransporter();
    this.loadTemplates();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private setupTransporter(): void {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      pool: true,
      maxConnections: 10,
      maxMessages: 100
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email transporter verification failed:', error);
      } else {
        this.logger.info('Email service ready');
      }
    });
  }

  private async loadTemplates(): Promise<void> {
    try {
      const templatesDir = path.join(process.cwd(), 'templates', 'email');
      const templateFiles = await fs.readdir(templatesDir);

      for (const file of templateFiles) {
        if (file.endsWith('.hbs')) {
          const templateName = path.basename(file, '.hbs');
          const templatePath = path.join(templatesDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          const compiledTemplate = handlebars.compile(templateContent);
          
          this.templates.set(templateName, compiledTemplate);
        }
      }

      this.logger.info(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      this.logger.error('Failed to load email templates:', error);
    }
  }

  public async sendEmail(options: EmailOptions): Promise<void> {
    try {
      let html = options.html;
      let subject = options.subject;

      // Use template if specified
      if (options.template && this.templates.has(options.template)) {
        const template = this.templates.get(options.template)!;
        html = template(options.data || {});
        
        // Template might include subject
        if (options.data?.subject) {
          subject = options.data.subject;
        }
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@portfolio.com',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject,
        html,
        text: options.text,
        attachments: options.attachments,
        priority: options.priority || 'normal',
        headers: {
          'X-Portfolio-Service': 'Portfolio Enterprise',
          'X-Email-Type': options.template || 'custom'
        }
      };

      if (options.delay && options.delay > 0) {
        // Schedule email for later
        await this.scheduleEmail(mailOptions, options.delay);
      } else {
        // Send immediately
        const result = await this.transporter.sendMail(mailOptions);
        
        await this.logEmailSent({
          to: mailOptions.to,
          subject: mailOptions.subject,
          template: options.template,
          messageId: result.messageId,
          status: 'sent'
        });
      }

    } catch (error) {
      this.logger.error('Failed to send email:', error);
      
      await this.logEmailSent({
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        template: options.template,
        status: 'failed',
        error: error.message
      });
      
      throw error;
    }
  }

  public async sendTemplatedEmail(options: {
    to: string | string[];
    template: string;
    data: any;
    priority?: 'high' | 'normal' | 'low';
  }): Promise<void> {
    await this.sendEmail({
      to: options.to,
      subject: '', // Will be set by template
      template: options.template,
      data: options.data,
      priority: options.priority
    });
  }

  public async sendBulkEmail(emails: EmailOptions[]): Promise<void> {
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < emails.length; i += batchSize) {
      batches.push(emails.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const promises = batch.map(email => this.sendEmail(email));
      await Promise.allSettled(promises);
      
      // Wait between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async scheduleEmail(mailOptions: any, delaySeconds: number): Promise<void> {
    const scheduleTime = Date.now() + (delaySeconds * 1000);
    const emailData = {
      ...mailOptions,
      scheduleTime
    };

    await this.redis.getClient().zadd(
      'scheduled_emails',
      scheduleTime,
      JSON.stringify(emailData)
    );

    this.logger.info('Email scheduled', {
      to: mailOptions.to,
      scheduleTime: new Date(scheduleTime)
    });
  }

  public async processScheduledEmails(): Promise<void> {
    try {
      const now = Date.now();
      const scheduledEmails = await this.redis.getClient().zrangebyscore(
        'scheduled_emails',
        0,
        now,
        'WITHSCORES'
      );

      for (let i = 0; i < scheduledEmails.length; i += 2) {
        const emailData = JSON.parse(scheduledEmails[i]);
        const score = scheduledEmails[i + 1];

        try {
          await this.transporter.sendMail(emailData);
          
          await this.logEmailSent({
            to: emailData.to,
            subject: emailData.subject,
            messageId: 'scheduled',
            status: 'sent'
          });

          // Remove from scheduled
          await this.redis.getClient().zrem('scheduled_emails', scheduledEmails[i]);
        } catch (error) {
          this.logger.error('Failed to send scheduled email:', error);
          
          // Move to failed queue
          await this.redis.getClient().lpush(
            'failed_emails',
            JSON.stringify({ ...emailData, error: error.message })
          );
          
          await this.redis.getClient().zrem('scheduled_emails', scheduledEmails[i]);
        }
      }
    } catch (error) {
      this.logger.error('Failed to process scheduled emails:', error);
    }
  }

  private async logEmailSent(data: any): Promise<void> {
    const logEntry = {
      ...data,
      timestamp: new Date()
    };

    await this.redis.getClient().lpush('email_logs', JSON.stringify(logEntry));
    await this.redis.getClient().ltrim('email_logs', 0, 9999); // Keep last 10k logs
  }

  public async getEmailStats(timeframe: 'day' | 'week' | 'month'): Promise<any> {
    // Implementation for email statistics
    const logs = await this.redis.getClient().lrange('email_logs', 0, -1);
    
    const parsedLogs = logs.map(log => JSON.parse(log))
      .filter(log => {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        const diffHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
        
        switch (timeframe) {
          case 'day':
            return diffHours <= 24;
          case 'week':
            return diffHours <= 168;
          case 'month':
            return diffHours <= 720;
          default:
            return true;
        }
      });

    return {
      total: parsedLogs.length,
      sent: parsedLogs.filter(log => log.status === 'sent').length,
      failed: parsedLogs.filter(log => log.status === 'failed').length,
      templates: this.getTemplateStats(parsedLogs)
    };
  }

  private getTemplateStats(logs: any[]): any {
    const templateStats = {};
    
    logs.forEach(log => {
      if (log.template) {
        if (!templateStats[log.template]) {
          templateStats[log.template] = 0;
        }
        templateStats[log.template]++;
      }
    });

    return templateStats;
  }

  // Start scheduled email processor
  public startScheduledProcessor(): void {
    setInterval(async () => {
      await this.processScheduledEmails();
    }, 60000); // Check every minute

    this.logger.info('Scheduled email processor started');
  }
}