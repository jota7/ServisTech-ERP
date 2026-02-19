import { Router } from 'express';
import {
  getDashboardKPIs,
  getRevenueChart,
  getOrdersByStatus,
  getTopServices,
  getRecentActivity,
} from '@/controllers/dashboardController';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/kpis', getDashboardKPIs);
router.get('/charts/revenue', getRevenueChart);
router.get('/charts/orders-by-status', getOrdersByStatus);
router.get('/charts/top-services', getTopServices);
router.get('/activity/recent', getRecentActivity);

export default router;
