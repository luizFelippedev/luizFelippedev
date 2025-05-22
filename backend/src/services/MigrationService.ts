// src/services/MigrationService.ts - Sistema de Migração de Dados
import { LoggerService } from './LoggerService';
import { DatabaseService } from './DatabaseService';
import fs from 'fs/promises';
import path from 'path';

interface Migration {
  version: string;
  name: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  executedAt?: Date;
}

export class MigrationService {
  private static instance: MigrationService;
  private logger: LoggerService;
  private database: DatabaseService;
  private migrationsPath: string;

  private constructor() {
    this.logger = LoggerService.getInstance();
    this.database = DatabaseService.getInstance();
    this.migrationsPath = path.join(process.cwd(), 'migrations');
  }

  public static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService();
    }
    return MigrationService.instance;
  }

  public async runMigrations(): Promise<void> {
    try {
      // Ensure migrations collection exists
      await this.ensureMigrationsCollection();

      // Get all migration files
      const migrationFiles = await this.getMigrationFiles();
      
      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations();
      const executedVersions = new Set(executedMigrations.map(m => m.version));

      // Run pending migrations
      for (const migrationFile of migrationFiles) {
        const migration = await this.loadMigration(migrationFile);
        
        if (!executedVersions.has(migration.version)) {
          this.logger.info(`Running migration: ${migration.name}`);
          
          try {
            await migration.up();
            await this.markMigrationAsExecuted(migration);
            this.logger.info(`Migration completed: ${migration.name}`);
          } catch (error) {
            this.logger.error(`Migration failed: ${migration.name}`, error);
            throw error;
          }
        }
      }

      this.logger.info('All migrations completed successfully');
    } catch (error) {
      this.logger.error('Migration process failed:', error);
      throw error;
    }
  }

  public async rollbackMigration(version: string): Promise<void> {
    try {
      const migrationFiles = await this.getMigrationFiles();
      const migration = await this.loadMigration(
        migrationFiles.find(f => f.includes(version))!
      );

      this.logger.info(`Rolling back migration: ${migration.name}`);
      
      await migration.down();
      await this.removeMigrationRecord(version);
      
      this.logger.info(`Migration rolled back: ${migration.name}`);
    } catch (error) {
      this.logger.error('Migration rollback failed:', error);
      throw error;
    }
  }

  public async createMigration(name: string, description: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const version = `${timestamp.split('T')[0].replace(/-/g, '')}_${Date.now()}`;
    const filename = `${version}_${name.replace(/\s+/g, '_').toLowerCase()}.ts`;
    const filepath = path.join(this.migrationsPath, filename);

    const template = `// Migration: ${name}
// Description: ${description}
// Created: ${new Date().toISOString()}

import { Migration } from '../services/MigrationService';

export const migration: Migration = {
  version: '${version}',
  name: '${name}',
  description: '${description}',
  
  async up(): Promise<void> {
    // Migration logic here
    console.log('Running migration: ${name}');
    
    // Example: Create new collection
    // await db.createCollection('new_collection');
    
    // Example: Add new field to existing documents
    // await db.collection('projects').updateMany(
    //   {},
    //   { $set: { newField: 'defaultValue' } }
    // );
  },
  
  async down(): Promise<void> {
    // Rollback logic here
    console.log('Rolling back migration: ${name}');
    
    // Example: Drop collection
    // await db.dropCollection('new_collection');
    
    // Example: Remove field from existing documents
    // await db.collection('projects').updateMany(
    //   {},
    //   { $unset: { newField: '' } }
    // );
  }
};
`;

    await fs.mkdir(this.migrationsPath, { recursive: true });
    await fs.writeFile(filepath, template);
    
    this.logger.info(`Migration created: ${filename}`);
  }

  private async ensureMigrationsCollection(): Promise<void> {
    const mongo = this.database.getMongo();
    if (mongo) {
      const collections = await mongo.db.listCollections({ name: 'migrations' }).toArray();
      if (collections.length === 0) {
        await mongo.db.createCollection('migrations');
      }
    }
  }

  private async getMigrationFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
        .sort();
    } catch (error) {
      this.logger.warn('Migrations directory not found');
      return [];
    }
  }

  private async loadMigration(filename: string): Promise<Migration> {
    const filepath = path.join(this.migrationsPath, filename);
    const module = await import(filepath);
    return module.migration;
  }

  private async getExecutedMigrations(): Promise<Migration[]> {
    const mongo = this.database.getMongo();
    if (mongo) {
      return await mongo.db.collection('migrations').find({}).toArray();
    }
    return [];
  }

  private async markMigrationAsExecuted(migration: Migration): Promise<void> {
    const mongo = this.database.getMongo();
    if (mongo) {
      await mongo.db.collection('migrations').insertOne({
        ...migration,
        executedAt: new Date()
      });
    }
  }

  private async removeMigrationRecord(version: string): Promise<void> {
    const mongo = this.database.getMongo();
    if (mongo) {
      await mongo.db.collection('migrations').deleteOne({ version });
    }
  }
}