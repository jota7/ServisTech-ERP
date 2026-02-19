import { Router } from 'express';
import {
  getParts,
  getPartById,
  createPart,
  updatePart,
  updateStock,
  createTransfer,
  getTransfers,
  updateTransferStatus,
  getCategories,
} from '@/controllers/inventoryController';
import { authenticate, authorize } from '@/middleware/auth';
import { validateBody, validateParams } from '@/middleware/validate';
import { createPartSchema, updateStockSchema, createTransferSchema, uuidParamSchema } from '@/utils/schemas';

const router = Router();

router.use(authenticate);

// Parts
router.get('/parts', getParts);
router.get('/parts/categories', getCategories);
router.get('/parts/:id', validateParams(uuidParamSchema), getPartById);
router.post('/parts', authorize('SUPER_ADMIN', 'GERENTE', 'ALMACEN'), validateBody(createPartSchema), createPart);
router.put('/parts/:id', authorize('SUPER_ADMIN', 'GERENTE', 'ALMACEN'), validateParams(uuidParamSchema), updatePart);
router.post('/parts/:id/stock', authorize('SUPER_ADMIN', 'GERENTE', 'ALMACEN'), validateParams(uuidParamSchema), validateBody(updateStockSchema), updateStock);

// Transfers
router.get('/transfers', getTransfers);
router.post('/transfers', authorize('SUPER_ADMIN', 'GERENTE', 'ALMACEN'), validateBody(createTransferSchema), createTransfer);
router.patch('/transfers/:id/status', authorize('SUPER_ADMIN', 'GERENTE', 'ALMACEN'), validateParams(uuidParamSchema), updateTransferStatus);

export default router;
