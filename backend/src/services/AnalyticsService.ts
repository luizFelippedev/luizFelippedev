// src/services/AnalyticsService.ts - Analytics Empresarial
import { RedisService } from './RedisService';
import { LoggerService } from './LoggerService';

interface AnalyticsEvent {
  type: string;
  userId?: string;
  sessionId: string;
  data: Record<string, any>;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

interface AnalyticsMetrics {
  pageViews: number;
  uniqueVisitors: number;
  projectViews: number;
  contactFormSubmissions: number;
  downloadCount: number;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ page: string; views: number }>;
  topProjects: Array<{ project: string; views: number }>;
  geographicData: Array<{ country: string; visitors: number }>;
  deviceData: Array<{ device: string; count: number }>;
  trafficSources: Array<{ source: string; visitors: number }>;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private redis: RedisService;
  private logger: LoggerService;

  private constructor() {
    this.redis = RedisService.getInstance();
    this.logger = LoggerService.getInstance();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const eventKey = `analytics:events:${new Date().toISOString().split('T')[0]}`;
      const eventData = JSON.stringify(event);
      
      await this.redis.getClient().lpush(eventKey, eventData);
      await this.redis.getClient().expire(eventKey, 86400 * 30); // 30 days
      
      // Update real-time metrics
      await this.updateRealTimeMetrics(event);
      
    } catch (error) {
      this.logger.error('Failed to track analytics event:', error);
    }
  }

  private async updateRealTimeMetrics(event: AnalyticsEvent): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    switch (event.type) {
      case 'page_view':
        await this.redis.getClient().incr(`analytics:page_views:${today}`);
        await this.redis.getClient().zincrby(`analytics:top_pages:${today}`, 1, event.data.page);
        break;
        
      case 'project_view':
        await this.redis.getClient().incr(`analytics:project_views:${today}`);
        await this.redis.getClient().zincrby(`analytics:top_projects:${today}`, 1, event.data.projectId);
        break;
        
      case 'contact_form':
        await this.redis.getClient().incr(`analytics:contact_forms:${today}`);
        break;
        
      case 'download':
        await this.redis.getClient().incr(`analytics:downloads:${today}`);
        break;
    }
    
    // Track unique visitors
    if (event.sessionId) {
      await this.redis.getClient().sadd(`analytics:unique_visitors:${today}`, event.sessionId);
    }
  }

  public async getMetrics(startDate: string, endDate: string): Promise<AnalyticsMetrics> {
    try {
      const dateRange = this.generateDateRange(startDate, endDate);
      
      const [
        pageViews,
        uniqueVisitors,
        projectViews,
        contactFormSubmissions,
        downloadCount,
        topPages,
        topProjects
      ] = await Promise.all([
        this.getPageViews(dateRange),
        this.getUniqueVisitors(dateRange),
        this.getProjectViews(dateRange),
        this.getContactFormSubmissions(dateRange),
        this.getDownloadCount(dateRange),
        this.getTopPages(dateRange),
        this.getTopProjects(dateRange)
      ]);

      return {
        pageViews,
        uniqueVisitors,
        projectViews,
        contactFormSubmissions,
        downloadCount,
        averageSessionDuration: 0, // Calculate separately
        bounceRate: 0, // Calculate separately
        topPages,
        topProjects,
        geographicData: [],
        deviceData: [],
        trafficSources: []
      };
      
    } catch (error) {
      this.logger.error('Failed to get analytics metrics:', error);
      throw error;
    }
  }

  private generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  private async getPageViews(dateRange: string[]): Promise<number> {
    let total = 0;
    for (const date of dateRange) {
      const views = await this.redis.getClient().get(`analytics:page_views:${date}`);
      total += parseInt(views || '0');
    }
    return total;
  }

  private async getUniqueVisitors(dateRange: string[]): Promise<number> {
    const allVisitors = new Set<string>();
    
    for (const date of dateRange) {
      const visitors = await this.redis.getClient().smembers(`analytics:unique_visitors:${date}`);
      visitors.forEach(visitor => allVisitors.add(visitor));
    }
    
    return allVisitors.size;
  }

  private async getProjectViews(dateRange: string[]): Promise<number> {
    let total = 0;
    for (const date of dateRange) {
      const views = await this.redis.getClient().get(`analytics:project_views:${date}`);
      total += parseInt(views || '0');
    }
    return total;
  }

  private async getContactFormSubmissions(dateRange: string[]): Promise<number> {
    let total = 0;
    for (const date of dateRange) {
      const submissions = await this.redis.getClient().get(`analytics:contact_forms:${date}`);
      total += parseInt(submissions || '0');
    }
    return total;
  }

  private async getDownloadCount(dateRange: string[]): Promise<number> {
    let total = 0;
    for (const date of dateRange) {
      const downloads = await this.redis.getClient().get(`analytics:downloads:${date}`);
      total += parseInt(downloads || '0');
    }
    return total;
  }

  private async getTopPages(dateRange: string[]): Promise<Array<{ page: string; views: number }>> {
    const pageData = new Map<string, number>();
    
    for (const date of dateRange) {
      const pages = await this.redis.getClient().zrevrange(`analytics:top_pages:${date}`, 0, -1, 'WITHSCORES');
      
      for (let i = 0; i < pages.length; i += 2) {
        const page = pages[i];
        const score = parseInt(pages[i + 1]);
        pageData.set(page, (pageData.get(page) || 0) + score);
      }
    }
    
    return Array.from(pageData.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }));
  }

  private async getTopProjects(dateRange: string[]): Promise<Array<{ project: string; views: number }>> {
    const projectData = new Map<string, number>();
    
    for (const date of dateRange) {
      const projects = await this.redis.getClient().zrevrange(`analytics:top_projects:${date}`, 0, -1, 'WITHSCORES');
      
      for (let i = 0; i < projects.length; i += 2) {
        const project = projects[i];
        const score = parseInt(projects[i + 1]);
        projectData.set(project, (projectData.get(project) || 0) + score);
      }
    }
    
    return Array.from(projectData.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([project, views]) => ({ project, views }));
  }

  public async getRealTimeMetrics(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    
    const [
      todayPageViews,
      todayUniqueVisitors,
      todayProjectViews,
      activeUsers
    ] = await Promise.all([
      this.redis.getClient().get(`analytics:page_views:${today}`),
      this.redis.getClient().scard(`analytics:unique_visitors:${today}`),
      this.redis.getClient().get(`analytics:project_views:${today}`),
      this.redis.getClient().scard('analytics:active_users')
    ]);

    return {
      todayPageViews: parseInt(todayPageViews || '0'),
      todayUniqueVisitors,
      todayProjectViews: parseInt(todayProjectViews || '0'),
      activeUsers
    };
  }
}