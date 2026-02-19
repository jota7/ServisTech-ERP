/**
 * SERVISTECH V4.0 - Petty Cash Routes
 */

import { Router } from 'express';
import {
  createExpense,
  getExpenses,
  getExpensesReport,
  getUploadUrl,
  deleteExpense,
} from '../controllers/pettyCashController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Gastos de una caja específica
router.post('/register/:registerId/expenses', createExpense);
router.get('/register/:registerId/expenses', getExpenses);

// Reportes
router.get('/report', getExpensesReport);

// Upload de fotos
router.post('/upload-url', getUploadUrl);

// Eliminar gasto
router.delete('/:id', deleteExpense);

export default router;
