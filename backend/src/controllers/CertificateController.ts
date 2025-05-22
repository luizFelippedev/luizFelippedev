// src/controllers/CertificateController.ts - Controlador de Certificados
import { Request, Response, NextFunction } from 'express';
import { Certificate, ICertificate } from '../models/Certificate';
import { CacheService } from '../services/CacheService';
import { FileUploadService } from '../services/FileUploadService';
import { LoggerService } from '../services/LoggerService';
import { ApiResponse } from '../utils/ApiResponse';
import { PaginationService } from '../services/PaginationService';

export class CertificateController {
  private cacheService: CacheService;
  private uploadService: FileUploadService;
  private logger: LoggerService;

  constructor() {
    this.cacheService = CacheService.getInstance();
    this.uploadService = FileUploadService.getInstance();
    this.logger = LoggerService.getInstance();
  }

  public async getAllCertificates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        level,
        featured,
        search,
        sortBy = 'dates.issued',
        sortOrder = 'desc'
      } = req.query;

      const cacheKey = `certificates:list:${JSON.stringify(req.query)}`;
      const cachedData = await this.cacheService.get(cacheKey);

      if (cachedData) {
        res.json(ApiResponse.success(cachedData));
        return;
      }

      // Construir filtros
      const filters: any = { isActive: true };
      
      if (type) filters.type = type;
      if (level) filters.level = level;
      if (featured !== undefined) filters.featured = featured === 'true';
      if (search) {
        filters.$or = [
          { title: { $regex: search, $options: 'i' } },
          { 'issuer.name': { $regex: search, $options: 'i' } },
          { 'skills.name': { $regex: search, $options: 'i' } }
        ];
      }

      // Ordenação
      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const certificates = await Certificate.find(filters)
        .sort(sortOptions)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await Certificate.countDocuments(filters);
      const pagination = PaginationService.getPaginationData(
        Number(page),
        Number(limit),
        total
      );

      const result = {
        certificates: certificates.map(this.sanitizeCertificate),
        pagination,
        filters: {
          types: await this.getAvailableTypes(),
          levels: await this.getAvailableLevels(),
          issuers: await this.getTopIssuers()
        }
      };

      await this.cacheService.set(cacheKey, result, 600); // 10 minutos

      res.json(ApiResponse.success(result));
    } catch (error) {
      this.logger.error('Error getting certificates:', error);
      next(error);
    }
  }

  public async createCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificateData = req.body;
      
      // Upload de arquivos se houver
      if (req.files) {
        const uploadResults = await this.uploadService.uploadMultiple(req.files as Express.Multer.File[]);
        certificateData.media = {
          ...certificateData.media,
          ...this.processUploadResults(uploadResults)
        };
      }

      const certificate = new Certificate(certificateData);
      await certificate.save();

      // Invalidar cache
      await this.cacheService.deletePattern('certificates:*');

      res.status(201).json(ApiResponse.success(
        this.sanitizeCertificate(certificate.toObject()),
        'Certificate created successfully'
      ));
    } catch (error) {
      this.logger.error('Error creating certificate:', error);
      next(error);
    }
  }

  public async updateCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const certificate = await Certificate.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!certificate) {
        res.status(404).json(ApiResponse.error('Certificate not found', 404));
        return;
      }

      // Invalidar cache
      await this.cacheService.deletePattern('certificates:*');

      res.json(ApiResponse.success(
        this.sanitizeCertificate(certificate.toObject()),
        'Certificate updated successfully'
      ));
    } catch (error) {
      this.logger.error('Error updating certificate:', error);
      next(error);
    }
  }

  public async deleteCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const certificate = await Certificate.findByIdAndUpdate(
        id,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );

      if (!certificate) {
        res.status(404).json(ApiResponse.error('Certificate not found', 404));
        return;
      }

      // Invalidar cache
      await this.cacheService.deletePattern('certificates:*');

      res.json(ApiResponse.success(null, 'Certificate deleted successfully'));
    } catch (error) {
      this.logger.error('Error deleting certificate:', error);
      next(error);
    }
  }

  private sanitizeCertificate(certificate: any): any {
    return certificate;
  }

  private async getAvailableTypes(): Promise<string[]> {
    return await Certificate.distinct('type', { isActive: true });
  }

  private async getAvailableLevels(): Promise<string[]> {
    return await Certificate.distinct('level', { isActive: true });
  }

  private async getTopIssuers(): Promise<Array<{ name: string; count: number }>> {
    const pipeline = [
      { $match: { isActive: true } },
      { $group: { _id: '$issuer.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { name: '$_id', count: 1, _id: 0 } }
    ];

    return await Certificate.aggregate(pipeline);
  }

  private processUploadResults(uploadResults: any[]): any {
    const result: any = {};
    
    uploadResults.forEach(upload => {
      if (upload.fieldname === 'certificate') {
        result.certificate = upload.url;
      } else if (upload.fieldname === 'badge') {
        result.badge = upload.url;
      }
    });

    return result;
  }
}
