// src/routes/public.ts - Rotas Públicas Avançadas
import { Router } from 'express';
import { PublicController } from '../controllers/PublicController';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { CacheMiddleware } from '../middleware/CacheMiddleware';
import { SecurityMiddleware } from '../middleware/SecurityMiddleware';

const router = Router();
const publicController = new PublicController();

// Rate limiting mais leniente para rotas públicas
router.use(SecurityMiddleware.createAdvancedRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 300 // 300 requests per window
}));

// Portfolio Overview
router.get('/',
  CacheMiddleware.cache({ ttl: 300 }), // 5 minutes
  publicController.getPortfolioOverview.bind(publicController)
);

// Projects - Public
router.get('/projects',
  ValidationMiddleware.queryValidation(),
  ValidationMiddleware.handleValidationErrors,
  CacheMiddleware.cache({ ttl: 600 }), // 10 minutes
  publicController.getPublicProjects.bind(publicController)
);

router.get('/projects/featured',
  CacheMiddleware.cache({ ttl: 1800 }), // 30 minutes
  publicController.getFeaturedProjects.bind(publicController)
);

router.get('/projects/categories',
  CacheMiddleware.cache({ ttl: 3600 }), // 1 hour
  publicController.getProjectCategories.bind(publicController)
);

router.get('/projects/:slug',
  ValidationMiddleware.paramValidation('slug', 'slug'),
  ValidationMiddleware.handleValidationErrors,
  CacheMiddleware.cache({ ttl: 1800 }), // 30 minutes
  publicController.getProjectBySlug.bind(publicController)
);

// Certificates - Public
router.get('/certificates',
  ValidationMiddleware.queryValidation(),
  ValidationMiddleware.handleValidationErrors,
  CacheMiddleware.cache({ ttl: 1800 }), // 30 minutes
  publicController.getPublicCertificates.bind(publicController)
);

router.get('/certificates/featured',
  CacheMiddleware.cache({ ttl: 3600 }), // 1 hour
  publicController.getFeaturedCertificates.bind(publicController)
);

// Skills
router.get('/skills',
  CacheMiddleware.cache({ ttl: 3600 }), // 1 hour
  publicController.getSkills.bind(publicController)
);

router.get('/skills/categories',
  CacheMiddleware.cache({ ttl: 3600 }), // 1 hour
  publicController.getSkillCategories.bind(publicController)
);

// About
router.get('/about',
  CacheMiddleware.cache({ ttl: 3600 }), // 1 hour
  publicController.getAboutData.bind(publicController)
);

// Contact
router.post('/contact',
  SecurityMiddleware.createAdvancedRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3 // Only 3 contact form submissions per hour
  }),
  ValidationMiddleware.contactValidation(),
  ValidationMiddleware.handleValidationErrors,
  publicController.submitContactForm.bind(publicController)
);

// Search
router.get('/search',
  ValidationMiddleware.searchValidation(),
  ValidationMiddleware.handleValidationErrors,
  CacheMiddleware.cache({ ttl: 300 }), // 5 minutes
  publicController.search.bind(publicController)
);

// RSS Feed
router.get('/rss',
  CacheMiddleware.cache({ ttl: 3600 }), // 1 hour
  publicController.getRSSFeed.bind(publicController)
);

// Sitemap
router.get('/sitemap.xml',
  CacheMiddleware.cache({ ttl: 86400 }), // 24 hours
  publicController.getSitemap.bind(publicController)
);

// Analytics Tracking (Public)
router.post('/analytics/track',
  SecurityMiddleware.createAdvancedRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10 // 10 tracking events per minute
  }),
  ValidationMiddleware.analyticsTrackingValidation(),
  ValidationMiddleware.handleValidationErrors,
  publicController.trackAnalyticsEvent.bind(publicController)
);

// Resume/CV Download
router.get('/resume/download',
  SecurityMiddleware.createAdvancedRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10 // 10 downloads per hour per IP
  }),
  publicController.downloadResume.bind(publicController)
);

export { router as publicRoutes };

// Adicionar validações específicas para rotas públicas
ValidationMiddleware.contactValidation = () => [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .normalizeEmail()
    .isEmail()
    .withMessage('Must be a valid email address'),
  
  body('subject')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Subject must be between 5 and 100 characters'),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters')
];

ValidationMiddleware.searchValidation = () => [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('type')
    .optional()
    .isIn(['projects', 'certificates', 'all'])
    .withMessage('Invalid search type'),
  
  query('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters')
];

ValidationMiddleware.analyticsTrackingValidation = () => [
  body('event')
    .isIn(['page_view', 'project_view', 'certificate_view', 'contact_form', 'download'])
    .withMessage('Invalid event type'),
  
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object'),
  
  body('sessionId')
    .optional()
    .isLength({ min: 10, max: 100 })
    .withMessage('Invalid session ID')
];
