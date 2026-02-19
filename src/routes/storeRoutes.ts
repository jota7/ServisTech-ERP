import { Router } from 'express';
import {
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  getStoreStats,
} from '@/controllers/storeController';
import { authenticate, authorize } from '@/middleware/auth';
import { validateBody, validateParams } from '@/middleware/validate';
import { createStoreSchema, uuidParamSchema } from '@/utils/schemas';

const router = Router();

router.use(authenticate);

router.get('/', getStores);
router.get('/stats/:id', validateParams(uuidParamSchema), getStoreStats);
router.get('/:id', validateParams(uuidParamSchema), getStoreById);
router.post('/', authorize('SUPER_ADMIN'), validateBody(createStoreSchema), createStore);
router.put('/:id', authorize('SUPER_ADMIN'), validateParams(uuidParamSchema), updateStore);
router.delete('/:id', authorize('SUPER_ADMIN'), validateParams(uuidParamSchema), deleteStore);

export default router;
