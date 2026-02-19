/**
 * SERVISTECH V4.0 - Warranty Routes
 */

import { Router } from 'express';
import {
  createWarranty,
  getWarranties,
  getWarrantyById,
  updateWarrantyStatus,
  getWarrantyStats,
  getWarrantiesByTechnician,
} from '../controllers/warrantyController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// CRUD de garantías
router.post('/', createWarranty);
router.get('/', getWarranties);
router.get('/stats/overview', getWarrantyStats);
router.get('/by-technician/:technicianId', getWarrantiesByTechnician);
router.get('/:id', getWarrantyById);
router.patch('/:id/status', updateWarrantyStatus);

export default router;
