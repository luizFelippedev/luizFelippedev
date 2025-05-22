// src/routes/admin.ts - Rotas Administrativas Completas
import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { ProjectController } from '../controllers/ProjectController';
import { CertificateController } from '../controllers/CertificateController';
import { authenticate, authorize } from '../middleware/AuthMiddleware';
import { AuditMiddleware } from '../middleware/AuditMiddleware';
import { SecurityMiddleware } from '../middleware/SecurityMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { upload } from '../middleware/UploadMiddleware';

const router = Router();
const adminController = new AdminController();
const projectController = new ProjectController();
const certificateController = new CertificateController();

// Middleware global para rotas admin
router.use(authenticate);
router.use(authorize(['admin']));
router.use(SecurityMiddleware.antiInjection);

// Dashboard
router.get('/dashboard',
  AuditMiddleware.audit('dashboard_view', 'admin'),
  adminController.getDashboardData.bind(adminController)
);

// System Metrics
router.get('/system/metrics',
  adminController.getSystemMetrics.bind(adminController)
);

router.get('/system/config',
  adminController.getSystemConfig.bind(adminController)
);

router.put('/system/config',
  AuditMiddleware.audit('system_config_update', 'system'),
  adminController.updateSystemConfig.bind(adminController)
);

// Analytics
router.get('/analytics/advanced',
  adminController.getAdvancedAnalytics.bind(adminController)
);

router.get('/analytics/performance',
  adminController.getPerformanceMetrics.bind(adminController)
);

// User Management
router.get('/users',
  adminController.getUsers.bind(adminController)
);

router.put('/users/:userId/role',
  AuditMiddleware.audit('user_role_update', 'user'),
  ValidationMiddleware.validateBody(['role']),
  adminController.updateUserRole.bind(adminController)
);

// Project Management
router.get('/projects',
  projectController.getAllProjects.bind(projectController)
);

router.post('/projects',
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
  ]),
  AuditMiddleware.audit('project_create', 'project'),
  ValidationMiddleware.validateBody(['title', 'shortDescription', 'category']),
  projectController.createProject.bind(projectController)
);

router.put('/projects/:id',
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
  ]),
  AuditMiddleware.audit('project_update', 'project'),
  projectController.updateProject.bind(projectController)
);

router.delete('/projects/:id',
  AuditMiddleware.audit('project_delete', 'project'),
  projectController.deleteProject.bind(projectController)
);

router.get('/projects/:id/analytics',
  projectController.getProjectAnalytics.bind(projectController)
);

// Certificate Management
router.get('/certificates',
  certificateController.getAllCertificates.bind(certificateController)
);

router.post('/certificates',
  upload.fields([
    { name: 'certificate', maxCount: 1 },
    { name: 'badge', maxCount: 1 }
  ]),
  AuditMiddleware.audit('certificate_create', 'certificate'),
  ValidationMiddleware.validateBody(['title', 'issuer', 'dates']),
  certificateController.createCertificate.bind(certificateController)
);

router.put('/certificates/:id',
  upload.fields([
    { name: 'certificate', maxCount: 1 },
    { name: 'badge', maxCount: 1 }
  ]),
  AuditMiddleware.audit('certificate_update', 'certificate'),
  certificateController.updateCertificate.bind(certificateController)
);

router.delete('/certificates/:id',
  AuditMiddleware.audit('certificate_delete', 'certificate'),
  certificateController.deleteCertificate.bind(certificateController)
);

// Audit Logs
router.get('/audit-logs',
  adminController.getAuditLogs.bind(adminController)
);

// Backup Management
router.post('/backup',
  AuditMiddleware.audit('backup_create', 'system'),
  SecurityMiddleware.createAdvancedRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 1 // Apenas 1 backup por hora
  }),
  adminController.createBackup.bind(adminController)
);

// Cache Management
router.post('/cache/clear',
  AuditMiddleware.audit('cache_clear', 'system'),
  adminController.clearCache.bind(adminController)
);

export { router as adminRoutes };