/**
 * SERVISTECH V4.0 - Commission Routes
 */

import { Router } from 'express';
import {
  getCommissions,
  getCommissionSummary,
  payCommissions,
  createDebit,
  getDebitsByTechnician,
  generatePayrollReport,
} from '../controllers/commissionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Comisiones
router.get('/', getCommissions);
router.get('/summary/:technicianId', getCommissionSummary);
router.post('/pay', payCommissions);
router.get('/payroll-report', generatePayrollReport);

// Débitos (contra-cargos)
router.post('/debits', createDebit);
router.get('/debits/:technicianId', getDebitsByTechnician);

export default router;
