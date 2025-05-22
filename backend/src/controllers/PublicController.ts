// src/controllers/PublicController.ts - Controlador Público Avançado
import { Request, Response, NextFunction } from 'express';
import { Project } from '../models/Project';
import { Certificate } from '../models/Certificate';
import { AnalyticsService } from '../services/AnalyticsService';
import { EmailService } from '../services/EmailService';
import { SearchService } from '../services/SearchService';
import { CacheService } from '../services/CacheService';
import { LoggerService } from '../services/LoggerService';
import { ApiResponse } from '../utils/ApiResponse';

export class PublicController {
  private analyticsService: AnalyticsService;
  private emailService: EmailService;
  private searchService: SearchService;
  private cacheService: CacheService;
  private logger: LoggerService;

  constructor() {
    this.analyticsService = AnalyticsService.getInstance();
    this.emailService = EmailService.getInstance();
    this.searchService = SearchService.getInstance();
    this.cacheService = CacheService.getInstance();
    this.logger = LoggerService.getInstance();
  }

  public async getPortfolioOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [featuredProjects, featuredCertificates, skillsOverview] = await Promise.all([
        Project.find({ featured: true, isActive: true, visibility: 'public' })
          .select('title slug shortDescription media.featuredImage category technologies')
          .limit(6)
          .lean(),
        
        Certificate.find({ featured: true, isActive: true })
          .select('title issuer.name level type media.badge')
          .limit(4)
          .lean(),
        
        this.getSkillsOverview()
      ]);

      const overview = {
        featured: {
          projects: featuredProjects,
          certificates: featuredCertificates
        },
        skills: skillsOverview,
        stats: await this.getPublicStats()
      };

      res.json(ApiResponse.success(overview));
    } catch (error) {
      this.logger.error('Error getting portfolio overview:', error);
      next(error);
    }
  }

  public async getPublicProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        featured,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters: any = {
        isActive: true,
        visibility: 'public'
      };

      if (category) filters.category = category;
      if (featured !== undefined) filters.featured = featured === 'true';
      if (search) {
        filters.$or = [
          { title: { $regex: search, $options: 'i' } },
          { shortDescription: { $regex: search, $options: 'i' } },
          { 'technologies.name': { $regex: search, $options: 'i' } }
        ];
      }

      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const projects = await Project.find(filters)
        .select('title slug shortDescription media.featuredImage category technologies featured analytics.views')
        .sort(sortOptions)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await Project.countDocuments(filters);

      res.json(ApiResponse.paginated(projects, {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }));
    } catch (error) {
      this.logger.error('Error getting public projects:', error);
      next(error);
    }
  }

  public async getProjectBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const project = await Project.findOne({
        slug,
        isActive: true,
        visibility: 'public'
      })
      .select('-__v')
      .lean();

      if (!project) {
        res.status(404).json(ApiResponse.error('Project not found', 404));
        return;
      }

      // Increment view count
      await Project.updateOne(
        { slug },
        { $inc: { 'analytics.views': 1 } }
      );

      // Track analytics
      await this.analyticsService.trackEvent({
        type: 'project_view',
        sessionId: req.sessionID,
        data: {
          projectId: project._id,
          slug: project.slug,
          category: project.category
        },
        timestamp: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Get related projects
      const relatedProjects = await this.getRelatedProjects(project);

      res.json(ApiResponse.success({
        project,
        related: relatedProjects
      }));
    } catch (error) {
      this.logger.error('Error getting project by slug:', error);
      next(error);
    }
  }

  public async submitContactForm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, subject, message } = req.body;

      // Send email notification
      await this.emailService.sendTemplatedEmail({
        to: process.env.CONTACT_EMAIL || 'contact@portfolio.com',
        template: 'contact-form',
        data: {
          name,
          email,
          subject,
          message,
          timestamp: new Date(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      // Send auto-reply to user
      await this.emailService.sendTemplatedEmail({
        to: email,
        template: 'contact-auto-reply',
        data: {
          name,
          subject
        }
      });

      // Track analytics
      await this.analyticsService.trackEvent({
        type: 'contact_form',
        sessionId: req.sessionID,
        data: { subject },
        timestamp: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(ApiResponse.success(null, 'Message sent successfully'));
    } catch (error) {
      this.logger.error('Error submitting contact form:', error);
      next(error);
    }
  }

  public async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: query, type = 'all', category } = req.query;

      let results = [];

      if (type === 'all' || type === 'projects') {
        const projectResults = await this.searchService.searchProjects(
          query as string,
          category ? { category } : {}
        );
        results.push(...projectResults);
      }

      if (type === 'all' || type === 'certificates') {
        const certificateResults = await this.searchService.searchCertificates(query as string);
        results.push(...certificateResults);
      }

      // Sort by relevance score
      results.sort((a, b) => (b.score || 0) - (a.score || 0));

      res.json(ApiResponse.success({
        query,
        results: results.slice(0, 20), // Limit to 20 results
        total: results.length
      }));
    } catch (error) {
      this.logger.error('Error performing search:', error);
      next(error);
    }
  }

  // Métodos auxiliares privados
  private async getSkillsOverview(): Promise<any> {
    // Implementar agregação de skills
    return {
      categories: [
        { name: 'Frontend', count: 12 },
        { name: 'Backend', count: 10 },
        { name: 'Database', count: 6 },
        { name: 'DevOps', count: 8 }
      ],
      total: 36
    };
  }

  private async getPublicStats(): Promise<any> {
    const [projectCount, certificateCount] = await Promise.all([
      Project.countDocuments({ isActive: true, visibility: 'public' }),
      Certificate.countDocuments({ isActive: true })
    ]);

    return {
      projects: projectCount,
      certificates: certificateCount,
      experience: '5+ years'
    };
  }

  private async getRelatedProjects(project: any): Promise<any[]> {
    return await Project.find({
      _id: { $ne: project._id },
      $or: [
        { category: project.category },
        { 'technologies.name': { $in: project.technologies.map((t: any) => t.name) } }
      ],
      isActive: true,
      visibility: 'public'
    })
    .select('title slug shortDescription media.featuredImage category')
    .limit(3)
    .lean();
  }
}