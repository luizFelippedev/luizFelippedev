// src/routes/analytics.ts - Rotas de Analytics
import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authenticate, authorize } from '../middleware/AuthMiddleware';
import { validateQuery } from '../middleware/ValidationMiddleware';

const router = Router();
const analyticsController = new AnalyticsController();

// Public analytics (limited data)
router.post('/track', analyticsController.trackEvent);
router.get('/public/stats', analyticsController.getPublicStats);

// Admin analytics (full access)
router.use(authenticate);
router.use(authorize(['admin']));

router.get('/metrics', validateQuery(['startDate', 'endDate']), analyticsController.getMetrics);
router.get('/realtime', analyticsController.getRealTimeMetrics);
router.get('/export', analyticsController.exportData);

export { router as analyticsRoutes };

// Boot Server
const server = new PortfolioServer();

// Graceful Shutdown
process.on('SIGTERM', async () => {
  await server.shutdown();
});

process.on('SIGINT', async () => {
  await server.shutdown();
});

// Start Server
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});