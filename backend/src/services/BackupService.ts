// src/services/BackupService.ts - Serviço de Backup
import { exec } from 'child_process';
import { promisify } from 'util';
import { Storage } from '@google-cloud/storage';
import AWS from 'aws-sdk';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export class BackupService {
  private static instance: BackupService;
  private logger: LoggerService;
  private storage: Storage | null = null;
  private s3: AWS.S3 | null = null;

  private constructor() {
    this.logger = LoggerService.getInstance();
    this.initializeCloudStorage();
  }

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  private initializeCloudStorage(): void {
    // Google Cloud Storage
    if (process.env.GOOGLE_CLOUD_KEYFILE) {
      this.storage = new Storage({
        keyFilename: process.env.GOOGLE_CLOUD_KEYFILE,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
      });
    }

    // AWS S3
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
    }
  }

  public async createDatabaseBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `portfolio-backup-${timestamp}.gz`;
      const backupPath = path.join(process.cwd(), 'backups', backupFileName);

      // Criar diretório de backup se não existir
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // MongoDB backup
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio_enterprise';
      const mongoCommand = `mongodump --uri="${mongoUri}" --archive="${backupPath}" --gzip`;
      
      await execAsync(mongoCommand);

      this.logger.info(`Database backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      this.logger.error('Failed to create database backup:', error);
      throw error;
    }
  }

  public async uploadBackupToCloud(backupPath: string): Promise<void> {
    try {
      const fileName = path.basename(backupPath);
      
      // Upload para Google Cloud Storage
      if (this.storage && process.env.GOOGLE_CLOUD_BACKUP_BUCKET) {
        const bucket = this.storage.bucket(process.env.GOOGLE_CLOUD_BACKUP_BUCKET);
        await bucket.upload(backupPath, {
          destination: `database-backups/${fileName}`,
          metadata: {
            metadata: {
              createdAt: new Date().toISOString(),
              type: 'database-backup'
            }
          }
        });
        
        this.logger.info(`Backup uploaded to Google Cloud Storage: ${fileName}`);
      }

      // Upload para AWS S3
      if (this.s3 && process.env.AWS_BACKUP_BUCKET) {
        const fileContent = fs.readFileSync(backupPath);
        
        await this.s3.upload({
          Bucket: process.env.AWS_BACKUP_BUCKET,
          Key: `database-backups/${fileName}`,
          Body: fileContent,
          Metadata: {
            createdAt: new Date().toISOString(),
            type: 'database-backup'
          }
        }).promise();
        
        this.logger.info(`Backup uploaded to AWS S3: ${fileName}`);
      }
    } catch (error) {
      this.logger.error('Failed to upload backup to cloud:', error);
      throw error;
    }
  }

  public async createFullBackup(): Promise<void> {
    try {
      this.logger.info('Starting full backup process...');
      
      // Backup do banco de dados
      const backupPath = await this.createDatabaseBackup();
      
      // Upload para cloud storage
      await this.uploadBackupToCloud(backupPath);
      
      // Backup de arquivos estáticos
      await this.backupStaticFiles();
      
      // Limpeza de backups antigos locais
      await this.cleanupOldBackups();
      
      this.logger.info('Full backup completed successfully');
    } catch (error) {
      this.logger.error('Full backup failed:', error);
      throw error;
    }
  }

  private async backupStaticFiles(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveName = `static-files-${timestamp}.tar.gz`;
      const archivePath = path.join(process.cwd(), 'backups', archiveName);
      
      // Compactar arquivos estáticos
      const command = `tar -czf "${archivePath}" uploads/ public/`;
      await execAsync(command);
      
      // Upload para cloud storage
      await this.uploadBackupToCloud(archivePath);
      
      this.logger.info('Static files backup completed');
    } catch (error) {
      this.logger.error('Failed to backup static files:', error);
      throw error;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      const files = fs.readdirSync(backupDir);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          this.logger.info(`Cleaned up old backup: ${file}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old backups:', error);
    }
  }

  public async scheduleBackups(): Promise<void> {
    // Backup diário às 2h da manhã
    const schedule = require('node-cron');
    
    schedule.schedule('0 2 * * *', async () => {
      this.logger.info('Starting scheduled backup...');
      try {
        await this.createFullBackup();
      } catch (error) {
        this.logger.error('Scheduled backup failed:', error);
      }
    });

    this.logger.info('Backup scheduler initialized');
  }
}