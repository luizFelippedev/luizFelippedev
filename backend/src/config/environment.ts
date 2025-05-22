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