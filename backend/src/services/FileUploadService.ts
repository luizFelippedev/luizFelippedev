// src/services/FileUploadService.ts - Serviço de Upload Avançado
import multer from 'multer';
import { CloudinaryService } from './CloudinaryService';
import { LoggerService } from './LoggerService';
import { RedisService } from './RedisService';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

interface UploadResult {
  fieldname: string;
  originalname: string;
  filename: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
  metadata?: any;
}

interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  watermark?: boolean;
  thumbnail?: boolean;
}

export class FileUploadService {
  private static instance: FileUploadService;
  private cloudinary: CloudinaryService;
  private logger: LoggerService;
  private redis: RedisService;
  private uploadDir: string;

  private constructor() {
    this.cloudinary = CloudinaryService.getInstance();
    this.logger = LoggerService.getInstance();
    this.redis = RedisService.getInstance();
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDirectory();
  }

  public static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  public getMulterConfig(): multer.Options {
    return {
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, this.uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
          cb(null, uniqueName);
        }
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 20
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'application/pdf',
          'video/mp4',
          'video/webm'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} not allowed`));
        }
      }
    };
  }

  public async uploadSingle(file: Express.Multer.File, options?: ImageProcessingOptions): Promise<UploadResult> {
    try {
      let processedFile = file;
      
      // Process image if needed
      if (file.mimetype.startsWith('image/') && options) {
        processedFile = await this.processImage(file, options);
      }

      // Upload to Cloudinary
      const cloudinaryResult = await this.cloudinary.uploadFile(processedFile.path, {
        folder: this.getUploadFolder(file.mimetype),
        resource_type: this.getResourceType(file.mimetype),
        transformation: this.getTransformations(options)
      });

      // Clean up local file
      await this.cleanupFile(processedFile.path);

      const result: UploadResult = {
        fieldname: file.fieldname,
        originalname: file.originalname,
        filename: processedFile.filename,
        path: cloudinaryResult.secure_url,
        url: cloudinaryResult.secure_url,
        size: processedFile.size,
        mimetype: file.mimetype,
        metadata: {
          cloudinaryId: cloudinaryResult.public_id,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          format: cloudinaryResult.format
        }
      };

      // Cache upload result
      await this.redis.getClient().setex(
        `upload:${cloudinaryResult.public_id}`,
        86400 * 7, // 7 days
        JSON.stringify(result)
      );

      this.logger.info('File uploaded successfully', {
        filename: file.originalname,
        size: file.size,
        cloudinaryId: cloudinaryResult.public_id
      });

      return result;
    } catch (error) {
      this.logger.error('File upload failed:', error);
      
      // Clean up file on error
      if (file.path) {
        await this.cleanupFile(file.path);
      }
      
      throw error;
    }
  }

  public async uploadMultiple(files: Express.Multer.File[], options?: ImageProcessingOptions): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadSingle(file, options));
    return Promise.all(uploadPromises);
  }

  private async processImage(file: Express.Multer.File, options: ImageProcessingOptions): Promise<Express.Multer.File> {
    try {
      const outputPath = path.join(this.uploadDir, `processed-${file.filename}`);
      
      let sharp = require('sharp')(file.path);
      
      // Resize if specified
      if (options.width || options.height) {
        sharp = sharp.resize(options.width, options.height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Set quality
      if (options.quality) {
        sharp = sharp.jpeg({ quality: options.quality });
      }
      
      // Convert format if specified
      if (options.format) {
        switch (options.format) {
          case 'jpeg':
            sharp = sharp.jpeg();
            break;
          case 'png':
            sharp = sharp.png();
            break;
          case 'webp':
            sharp = sharp.webp();
            break;
        }
      }
      
      // Add watermark if requested
      if (options.watermark) {
        const watermarkPath = path.join(process.cwd(), 'assets', 'watermark.png');
        try {
          await fs.access(watermarkPath);
          sharp = sharp.composite([{
            input: watermarkPath,
            gravity: 'southeast',
            blend: 'over'
          }]);
        } catch {
          this.logger.warn('Watermark file not found');
        }
      }
      
      await sharp.toFile(outputPath);
      
      // Clean up original
      await this.cleanupFile(file.path);
      
      const stats = await fs.stat(outputPath);
      
      return {
        ...file,
        path: outputPath,
        filename: path.basename(outputPath),
        size: stats.size
      };
      
    } catch (error) {
      this.logger.error('Image processing failed:', error);
      return file; // Return original on error
    }
  }

  private getUploadFolder(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('video/')) return 'videos';
    if (mimetype === 'application/pdf') return 'documents';
    return 'misc';
  }

  private getResourceType(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'raw';
  }

  private getTransformations(options?: ImageProcessingOptions): any[] {
    const transformations = [];
    
    if (options?.width || options?.height) {
      transformations.push({
        width: options.width,
        height: options.height,
        crop: 'limit'
      });
    }
    
    if (options?.quality) {
      transformations.push({
        quality: options.quality
      });
    }
    
    return transformations;
  }

  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      this.logger.warn('Failed to cleanup file:', error);
    }
  }

  public async deleteFile(cloudinaryId: string): Promise<void> {
    try {
      await this.cloudinary.deleteFile(cloudinaryId);
      await this.redis.getClient().del(`upload:${cloudinaryId}`);
      
      this.logger.info('File deleted successfully', { cloudinaryId });
    } catch (error) {
      this.logger.error('File deletion failed:', error);
      throw error;
    }
  }

  public async generateThumbnail(imageUrl: string, size: { width: number; height: number }): Promise<string> {
    // Generate thumbnail URL using Cloudinary transformations
    return this.cloudinary.getOptimizedUrl(imageUrl, {
      width: size.width,
      height: size.height,
      crop: 'fill',
      quality: 'auto',
      format: 'auto'
    });
  }

  public async getUploadStats(): Promise<any> {
    // Get upload statistics
    const today = new Date().toISOString().split('T')[0];
    const uploadCount = await this.redis.getClient().get(`uploads:count:${today}`) || '0';
    const uploadSize = await this.redis.getClient().get(`uploads:size:${today}`) || '0';
    
    return {
      today: {
        count: parseInt(uploadCount),
        totalSize: parseInt(uploadSize)
      }
    };
  }
}