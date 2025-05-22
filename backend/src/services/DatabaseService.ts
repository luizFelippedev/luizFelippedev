// src/server.ts - Entry Point Empresarial
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/environment';
import { DatabaseService } from './services/DatabaseService';
import { RedisService } from './services/RedisService';
import { LoggerService } from './services/LoggerService';
import { AuthService } from './services/AuthService';
import { EmailService } from './services/EmailService';
import { CloudinaryService } from './services/CloudinaryService';
import { AnalyticsService } from './services/AnalyticsService';
import { SocketService } from './services/SocketService';
import { ErrorHandler } from './middleware/ErrorHandler';
import { SecurityMiddleware } from './middleware/SecurityMiddleware';
import { ValidationMiddleware } from './middleware/ValidationMiddleware';
import { CacheMiddleware } from './middleware/CacheMiddleware';
import { MetricsMiddleware } from './middleware/MetricsMiddleware';
import { apiRoutes } from './routes/api';
import { adminRoutes } from './routes/admin';
import { publicRoutes } from './routes/public';
import { authRoutes } from './routes/auth';
import { uploadRoutes } from './routes/upload';
import { analyticsRoutes } from './routes/analytics';
import { websocketRoutes } from './routes/websocket';

class PortfolioServer {
  private app: Application;
  private server: any;
  private io: SocketIOServer;
  private logger: LoggerService;
  private database: DatabaseService;
  private redis: RedisService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.logger = LoggerService.getInstance();
    this.database = DatabaseService.getInstance();
    this.redis = RedisService.getInstance();
    
    this.initializeSocketIO();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeSocketIO(): void {
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origins,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    const socketService = new SocketService(this.io);
    socketService.initialize();
  }

  private initializeMiddlewares(): void {
    // Security Middlewares
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "wss:", "ws:"]
        }
      }
    }));

    this.app.use(cors({
      origin: config.cors.origins,
      methods: config.cors.methods,
      allowedHeaders: config.cors.allowedHeaders,
      credentials: true
    }));

    // Rate Limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Performance Middlewares
    this.app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
      level: 6
    }));

    // Parsing Middlewares
    this.app.use(express.json({ 
      limit: config.upload.maxFileSize,
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: config.upload.maxFileSize 
    }));

    // Custom Middlewares
    this.app.use(SecurityMiddleware.sanitizeInput);
    this.app.use(MetricsMiddleware.collectMetrics);
    this.app.use(CacheMiddleware.initialize);
  }

  private initializeRoutes(): void {
    // Health Check
    this.app.get('/health', async (req, res) => {
      const healthCheck = {
        uptime: process.uptime(),
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: await this.database.isHealthy(),
          redis: await this.redis.isHealthy(),
          memory: {
            used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
            total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100
          }
        }
      };
      res.status(200).json(healthCheck);
    });

    // API Routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/public', publicRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/upload', uploadRoutes);
    this.app.use('/api/analytics', analyticsRoutes);
    this.app.use('/api/websocket', websocketRoutes);
    this.app.use('/api', apiRoutes);

    // Documentation
    this.app.use('/docs', express.static('docs'));
    
    // Static Files
    this.app.use('/uploads', express.static('uploads'));
  }

  private initializeErrorHandling(): void {
    this.app.use(ErrorHandler.notFound);
    this.app.use(ErrorHandler.handleError);
  }

  public async start(): Promise<void> {
    try {
      await this.database.connect();
      await this.redis.connect();
      
      this.server.listen(config.port, () => {
        this.logger.info(`🚀 Server running on port ${config.port}`);
        this.logger.info(`📚 Documentation: http://localhost:${config.port}/docs`);
        this.logger.info(`💡 Health Check: http://localhost:${config.port}/health`);
      });
    } catch (error) {
      this.logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down server...');
    await this.database.disconnect();
    await this.redis.disconnect();
    this.server.close();
  }
}

// src/config/environment.ts - Configuração Empresarial
export const config = {
  port: parseInt(process.env.PORT || '5000'),
  environment: process.env.NODE_ENV || 'development',
  
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio_enterprise',
      options: {
        maxPoolSize: 50,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        retryWrites: true,
        w: 'majority'
      }
    },
    postgresql: {
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432'),
      database: process.env.PG_DATABASE || 'portfolio_enterprise',
      username: process.env.PG_USERNAME || 'postgres',
      password: process.env.PG_PASSWORD || 'password',
      pool: {
        min: 5,
        max: 50,
        acquire: 30000,
        idle: 10000
      }
    }
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'enterprise-portfolio-secret-key',
    expiresIn: '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
    refreshExpiresIn: '7d'
  },

  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // requests per windowMs
  },

  upload: {
    maxFileSize: '50mb',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    }
  },

  email: {
    smtp: {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'noreply@portfolio.com'
  },

  analytics: {
    googleAnalytics: process.env.GA_TRACKING_ID,
    mixpanel: process.env.MIXPANEL_TOKEN
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      enabled: true,
      filename: 'logs/portfolio-enterprise.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }
  }
};

// src/services/DatabaseService.ts - Serviço de Banco de Dados Avançado
import mongoose, { Connection } from 'mongoose';
import { Sequelize } from 'sequelize';
import { config } from '../config/environment';
import { LoggerService } from './LoggerService';

export class DatabaseService {
  private static instance: DatabaseService;
  private mongoConnection: Connection | null = null;
  private postgresConnection: Sequelize | null = null;
  private logger: LoggerService;

  private constructor() {
    this.logger = LoggerService.getInstance();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(): Promise<void> {
    await Promise.all([
      this.connectMongoDB(),
      this.connectPostgreSQL()
    ]);
  }

  private async connectMongoDB(): Promise<void> {
    try {
      await mongoose.connect(config.database.mongodb.uri, config.database.mongodb.options);
      this.mongoConnection = mongoose.connection;
      
      this.mongoConnection.on('connected', () => {
        this.logger.info('✅ MongoDB connected successfully');
      });

      this.mongoConnection.on('error', (error) => {
        this.logger.error('❌ MongoDB connection error:', error);
      });

      this.mongoConnection.on('disconnected', () => {
        this.logger.warn('⚠️ MongoDB disconnected');
      });

    } catch (error) {
      this.logger.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  private async connectPostgreSQL(): Promise<void> {
    try {
      this.postgresConnection = new Sequelize({
        host: config.database.postgresql.host,
        port: config.database.postgresql.port,
        database: config.database.postgresql.database,
        username: config.database.postgresql.username,
        password: config.database.postgresql.password,
        dialect: 'postgres',
        pool: config.database.postgresql.pool,
        logging: (msg) => this.logger.debug(msg)
      });

      await this.postgresConnection.authenticate();
      this.logger.info('✅ PostgreSQL connected successfully');

    } catch (error) {
      this.logger.error('❌ PostgreSQL connection failed:', error);
      throw error;
    }
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const mongoHealthy = this.mongoConnection?.readyState === 1;
      const postgresHealthy = this.postgresConnection ? 
        await this.postgresConnection.authenticate().then(() => true).catch(() => false) : 
        false;
      
      return mongoHealthy && postgresHealthy;
    } catch {
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.mongoConnection) {
      await mongoose.disconnect();
    }
    if (this.postgresConnection) {
      await this.postgresConnection.close();
    }
  }

  public getMongo(): Connection | null {
    return this.mongoConnection;
  }

  public getPostgres(): Sequelize | null {
    return this.postgresConnection;
  }
}