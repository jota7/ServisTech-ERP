import { Router } from 'express';
import {
  getCurrentRegister,
  openRegister,
  closeRegister,
  addExpense,
  getRegisterHistory,
  getRegisterSummary,
} from '@/controllers/cashRegisterController';
import { authenticate, authorize } from '@/middleware/auth';
import { validateBody, validateParams } from '@/middleware/validate';
import { openRegisterSchema, closeRegisterSchema, addExpenseSchema, uuidParamSchema } from '@/utils/schemas';

const router = Router();

router.use(authenticate);

router.get('/current/:storeId', getCurrentRegister);
router.get('/history/:storeId', getRegisterHistory);
router.get('/summary/:storeId', getRegisterSummary);
router.post('/open/:storeId', authorize('SUPER_ADMIN', 'GERENTE', 'ANFITRION'), validateBody(openRegisterSchema), openRegister);
router.post('/close/:id', authorize('SUPER_ADMIN', 'GERENTE', 'ANFITRION'), validateParams(uuidParamSchema), validateBody(closeRegisterSchema), closeRegister);
router.post('/expenses/:id', authorize('SUPER_ADMIN', 'GERENTE', 'ANFITRION'), validateParams(uuidParamSchema), validateBody(addExpenseSchema), addExpense);

export default router;
