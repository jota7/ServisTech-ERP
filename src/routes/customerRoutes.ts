import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
} from '@/controllers/customerController';
import { authenticate } from '@/middleware/auth';
import { validateBody, validateParams } from '@/middleware/validate';
import { createCustomerSchema, updateCustomerSchema, uuidParamSchema } from '@/utils/schemas';

const router = Router();

router.use(authenticate);

router.get('/', getCustomers);
router.get('/stats/:id', validateParams(uuidParamSchema), getCustomerStats);
router.get('/:id', validateParams(uuidParamSchema), getCustomerById);
router.post('/', validateBody(createCustomerSchema), createCustomer);
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateCustomerSchema), updateCustomer);
router.delete('/:id', validateParams(uuidParamSchema), deleteCustomer);

export default router;
