// src/services/TestingService.ts - Serviço de Testes
import { LoggerService } from './LoggerService';
import { DatabaseService } from './DatabaseService';
import { RedisService } from './RedisService';

export class TestingService {
  private static instance: TestingService;
  private logger: LoggerService;
  private database: DatabaseService;
  private redis: RedisService;

  private constructor() {
    this.logger = LoggerService.getInstance();
    this.database = DatabaseService.getInstance();
    this.redis = RedisService.getInstance();
  }

  public static getInstance(): TestingService {
    if (!TestingService.instance) {
      TestingService.instance = new TestingService();
    }
    return TestingService.instance;
  }

  public async setupTestEnvironment(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Test environment setup can only be run in test mode');
    }

    try {
      // Clear test database
      await this.clearTestDatabase();
      
      // Clear test cache
      await this.clearTestCache();
      
      // Seed test data
      await this.seedTestData();
      
      this.logger.info('Test environment setup completed');
    } catch (error) {
      this.logger.error('Test environment setup failed:', error);
      throw error;
    }
  }

  public async teardownTestEnvironment(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      return;
    }

    try {
      await this.clearTestDatabase();
      await this.clearTestCache();
      
      this.logger.info('Test environment cleaned up');
    } catch (error) {
      this.logger.error('Test environment cleanup failed:', error);
    }
  }

  private async clearTestDatabase(): Promise<void> {
    const mongo = this.database.getMongo();
    if (mongo) {
      const collections = await mongo.db.listCollections().toArray();
      
      for (const collection of collections) {
        if (!collection.name.startsWith('system.')) {
          await mongo.db.collection(collection.name).deleteMany({});
        }
      }
    }
  }

  private async clearTestCache(): Promise<void> {
    const client = this.redis.getClient();
    await client.flushdb();
  }

  private async seedTestData(): Promise<void> {
    const { Project } = await import('../models/Project');
    const { Certificate } = await import('../models/Certificate');
    const { User } = await import('../models/User');

    // Seed test projects
    const testProjects = [
      {
        title: 'Test Project 1',
        slug: 'test-project-1',
        shortDescription: 'This is a test project',
        fullDescription: 'This is a detailed description of the test project',
        category: 'web_app',
        status: 'completed',
        visibility: 'public',
        featured: true,
        technologies: [
          { name: 'React', category: 'frontend', level: 'primary' },
          { name: 'Node.js', category: 'backend', level: 'primary' }
        ],
        media: {
          featuredImage: 'https://example.com/image.jpg',
          gallery: []
        },
        timeline: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-01')
        },
        isActive: true
      }
    ];

    await Project.insertMany(testProjects);

    // Seed test certificates
    const testCertificates = [
      {
        title: 'Test Certificate',
        issuer: { name: 'Test Academy' },
        dates: { issued: new Date('2024-01-01') },
        level: 'professional',
        type: 'technical',
        skills: [
          { name: 'JavaScript', category: 'Programming', proficiencyLevel: 'advanced' }
        ],
        media: {
          certificate: 'https://example.com/cert.pdf'
        },
        featured: true,
        isActive: true
      }
    ];

    await Certificate.insertMany(testCertificates);

    // Seed test users
    const testUsers = [
      {
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
        isActive: true
      },
      {
        name: 'Test User',
        email: 'user@test.com',
        password: 'password123',
        role: 'user',
        isActive: true
      }
    ];

    await User.insertMany(testUsers);
  }
}
