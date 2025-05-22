// tests/integration/api.test.ts - Testes de Integração
import request from 'supertest';
import { PortfolioServer } from '../../src/server';
import { TestingService } from '../../src/services/TestingService';

describe('API Integration Tests', () => {
  let app: any;
  let server: PortfolioServer;
  let testingService: TestingService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/portfolio_test';
    process.env.REDIS_URL = 'redis://localhost:6379/1';

    server = new PortfolioServer();
    app = server.getApp();
    testingService = TestingService.getInstance();
    
    await server.start();
    await testingService.setupTestEnvironment();
  });

  afterAll(async () => {
    await testingService.teardownTestEnvironment();
    await server.shutdown();
  });

  describe('Public API', () => {
    test('GET /api/public - should return portfolio overview', async () => {
      const response = await request(app)
        .get('/api/public')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('featured');
      expect(response.body.data).toHaveProperty('skills');
      expect(response.body.data).toHaveProperty('stats');
    });

    test('GET /api/public/projects - should return public projects', async () => {
      const response = await request(app)
        .get('/api/public/projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty('totalItems');
    });

    test('GET /api/public/projects/:slug - should return project by slug', async () => {
      const response = await request(app)
        .get('/api/public/projects/test-project-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project).toHaveProperty('title', 'Test Project 1');
      expect(response.body.data.project).toHaveProperty('slug', 'test-project-1');
    });

    test('POST /api/public/contact - should submit contact form', async () => {
      const contactData = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message'
      };

      const response = await request(app)
        .post('/api/public/contact')
        .send(contactData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('sent successfully');
    });
  });

  describe('Admin API', () => {
    let adminToken: string;

    beforeEach(async () => {
      // Login as admin to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });

      adminToken = loginResponse.body.data.token;
    });

    test('GET /api/admin/dashboard - should return dashboard data', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data).toHaveProperty('analytics');
    });

    test('POST /api/admin/projects - should create new project', async () => {
      const projectData = {
        title: 'New Test Project',
        shortDescription: 'This is a new test project',
        category: 'web_app',
        technologies: [
          { name: 'Vue.js', category: 'frontend', level: 'primary' }
        ],
        timeline: {
          startDate: '2024-01-01'
        }
      };

      const response = await request(app)
        .post('/api/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title', 'New Test Project');
      expect(response.body.data).toHaveProperty('slug', 'new-test-project');
    });
  });

  describe('Authentication', () => {
    test('POST /api/auth/login - should authenticate user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    test('POST /api/auth/login - should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });
});