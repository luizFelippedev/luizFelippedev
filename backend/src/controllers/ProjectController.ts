// src/controllers/ProjectController.ts - Controlador Avançado de Projetos
import { Request, Response, NextFunction } from 'express';
import { Project, IProject } from '../models/Project';
import { CacheService } from '../services/CacheService';
import { AnalyticsService } from '../services/AnalyticsService';
import { SearchService } from '../services/SearchService';
import { FileUploadService } from '../services/FileUploadService';
import { LoggerService } from '../services/LoggerService';
import { ApiResponse } from '../utils/ApiResponse';
import { PaginationService } from '../services/PaginationService';

export class ProjectController {
  private cacheService: CacheService;
  private analyticsService: AnalyticsService;
  private searchService: SearchService;
  private uploadService: FileUploadService;
  private logger: LoggerService;

  constructor() {
    this.cacheService = CacheService.getInstance();
    this.analyticsService = AnalyticsService.getInstance();
    this.searchService = SearchService.getInstance();
    this.uploadService = FileUploadService.getInstance();
    this.logger = LoggerService.getInstance();
  }

  public async getAllProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        status,
        featured,
        tags,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        visibility = 'public'
      } = req.query;

      const cacheKey = `projects:list:${JSON.stringify(req.query)}`;
      const cachedData = await this.cacheService.get(cacheKey);

      if (cachedData) {
        await this.analyticsService.trackEvent({
          type: 'projects_list_view_cached',
          sessionId: req.sessionID,
          data: { query: req.query },
          timestamp: new Date()
        });
        
        res.json(ApiResponse.success(cachedData, 'Projects retrieved from cache'));
        return;
      }

      // Construir filtros
      const filters: any = { isActive: true, visibility };
      
      if (category) filters.category = category;
      if (status) filters.status = status;
      if (featured !== undefined) filters.featured = featured === 'true';
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        filters.tags = { $in: tagArray };
      }

      // Busca textual avançada
      if (search) {
        const searchResults = await this.searchService.searchProjects(search as string);
        filters._id = { $in: searchResults.map(r => r.id) };
      }

      // Paginação e ordenação
      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const projects = await Project.find(filters)
        .sort(sortOptions)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate('team', 'name role avatar')
        .lean();

      const total = await Project.countDocuments(filters);
      const pagination = PaginationService.getPaginationData(
        Number(page),
        Number(limit),
        total
      );

      const result = {
        projects: projects.map(this.sanitizeProject),
        pagination,
        filters: {
          categories: await this.getAvailableCategories(),
          statuses: await this.getAvailableStatuses(),
          tags: await this.getPopularTags()
        }
      };

      // Cache por 5 minutos
      await this.cacheService.set(cacheKey, result, 300);

      // Analytics
      await this.analyticsService.trackEvent({
        type: 'projects_list_view',
        sessionId: req.sessionID,
        data: { 
          query: req.query,
          resultCount: projects.length
        },
        timestamp: new Date()
      });

      res.json(ApiResponse.success(result));
    } catch (error) {
      this.logger.error('Error getting projects:', error);
      next(error);
    }
  }

  public async getProjectBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;
      const cacheKey = `project:${slug}`;
      
      let project = await this.cacheService.get(cacheKey);
      
      if (!project) {
        project = await Project.findOne({ slug, isActive: true })
          .populate('team', 'name role avatar linkedin')
          .lean();
          
        if (!project) {
          res.status(404).json(ApiResponse.error('Project not found', 404));
          return;
        }

        await this.cacheService.set(cacheKey, project, 3600); // 1 hora
      }

      // Incrementar visualizações
      await Project.updateOne(
        { slug },
        { $inc: { 'analytics.views': 1 } }
      );

      // Analytics
      await this.analyticsService.trackEvent({
        type: 'project_view',
        sessionId: req.sessionID,
        data: { 
          projectId: project._id,
          slug: project.slug,
          category: project.category
        },
        timestamp: new Date()
      });

      // Projetos relacionados
      const relatedProjects = await this.getRelatedProjects(project);

      res.json(ApiResponse.success({
        project: this.sanitizeProject(project),
        related: relatedProjects
      }));
    } catch (error) {
      this.logger.error('Error getting project:', error);
      next(error);
    }
  }

  public async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectData = req.body;
      
      // Upload de arquivos se houver
      if (req.files) {
        const uploadResults = await this.uploadService.uploadMultiple(req.files as Express.Multer.File[]);
        projectData.media = {
          ...projectData.media,
          featuredImage: uploadResults.find(r => r.fieldname === 'featuredImage')?.url,
          gallery: uploadResults.filter(r => r.fieldname === 'gallery').map(r => r.url)
        };
      }

      const project = new Project(projectData);
      await project.save();

      // Invalidar cache
      await this.cacheService.deletePattern('projects:*');
      
      // Reindexar para busca
      await this.searchService.indexProject(project);

      res.status(201).json(ApiResponse.success(
        this.sanitizeProject(project.toObject()),
        'Project created successfully'
      ));
    } catch (error) {
      this.logger.error('Error creating project:', error);
      next(error);
    }
  }

  public async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Upload de novos arquivos se houver
      if (req.files) {
        const uploadResults = await this.uploadService.uploadMultiple(req.files as Express.Multer.File[]);
        updateData.media = {
          ...updateData.media,
          ...this.processUploadResults(uploadResults)
        };
      }

      const project = await Project.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!project) {
        res.status(404).json(ApiResponse.error('Project not found', 404));
        return;
      }

      // Invalidar cache
      await this.cacheService.delete(`project:${project.slug}`);
      await this.cacheService.deletePattern('projects:*');
      
      // Atualizar índice de busca
      await this.searchService.updateProject(project);

      res.json(ApiResponse.success(
        this.sanitizeProject(project.toObject()),
        'Project updated successfully'
      ));
    } catch (error) {
      this.logger.error('Error updating project:', error);
      next(error);
    }
  }

  public async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const project = await Project.findByIdAndUpdate(
        id,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );

      if (!project) {
        res.status(404).json(ApiResponse.error('Project not found', 404));
        return;
      }

      // Invalidar cache
      await this.cacheService.delete(`project:${project.slug}`);
      await this.cacheService.deletePattern('projects:*');
      
      // Remover do índice de busca
      await this.searchService.removeProject(project._id.toString());

      res.json(ApiResponse.success(null, 'Project deleted successfully'));
    } catch (error) {
      this.logger.error('Error deleting project:', error);
      next(error);
    }
  }

  public async getProjectAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const project = await Project.findById(id);
      if (!project) {
        res.status(404).json(ApiResponse.error('Project not found', 404));
        return;
      }

      const analytics = await this.analyticsService.getProjectAnalytics(
        id,
        startDate as string,
        endDate as string
      );

      res.json(ApiResponse.success(analytics));
    } catch (error) {
      this.logger.error('Error getting project analytics:', error);
      next(error);
    }
  }

  private sanitizeProject(project: any): any {
    const sanitized = { ...project };
    // Remove campos sensíveis se necessário
    return sanitized;
  }

  private async getRelatedProjects(project: any): Promise<any[]> {
    const related = await Project.find({
      _id: { $ne: project._id },
      $or: [
        { category: project.category },
        { tags: { $in: project.tags } },
        { 'technologies.name': { $in: project.technologies.map((t: any) => t.name) } }
      ],
      isActive: true,
      visibility: 'public'
    })
    .limit(4)
    .select('title slug shortDescription media.featuredImage category technologies')
    .lean();

    return related;
  }

  private async getAvailableCategories(): Promise<string[]> {
    const categories = await Project.distinct('category', { isActive: true });
    return categories;
  }

  private async getAvailableStatuses(): Promise<string[]> {
    const statuses = await Project.distinct('status', { isActive: true });
    return statuses;
  }

  private async getPopularTags(): Promise<Array<{ name: string; count: number }>> {
    const pipeline = [
      { $match: { isActive: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { name: '$_id', count: 1, _id: 0 } }
    ];

    return await Project.aggregate(pipeline);
  }

  private processUploadResults(uploadResults: any[]): any {
    const result: any = {};
    
    uploadResults.forEach(upload => {
      if (upload.fieldname === 'featuredImage') {
        result.featuredImage = upload.url;
      } else if (upload.fieldname === 'gallery') {
        if (!result.gallery) result.gallery = [];
        result.gallery.push(upload.url);
      }
    });

    return result;
  }
}
