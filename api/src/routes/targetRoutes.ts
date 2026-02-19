/**
 * SERVISTECH V4.0 - Target & Fixed Expenses Routes
 */

import { Router } from 'express';
import {
  createFixedExpense,
  getFixedExpenses,
  calculateDailyTarget,
  getTargetsDashboard,
  updateFixedExpense,
} from '../controllers/targetController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Gastos fijos
router.post('/expenses/fixed', createFixedExpense);
router.get('/expenses/fixed', getFixedExpenses);
router.patch('/expenses/fixed/:id', updateFixedExpense);

// Metas diarias
router.get('/daily-calculation', calculateDailyTarget);
router.get('/dashboard', getTargetsDashboard);

export default router;
