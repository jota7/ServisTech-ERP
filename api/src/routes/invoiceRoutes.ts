import { Router } from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  addPayment,
  cancelInvoice,
  getDailyReport,
} from '@/controllers/invoiceController';
import { authenticate, authorize } from '@/middleware/auth';
import { validateBody, validateParams } from '@/middleware/validate';
import { createInvoiceSchema, addPaymentSchema, uuidParamSchema } from '@/utils/schemas';

const router = Router();

router.use(authenticate);

router.get('/', getInvoices);
router.get('/reports/daily', getDailyReport);
router.get('/:id', validateParams(uuidParamSchema), getInvoiceById);
router.post('/', authorize('SUPER_ADMIN', 'GERENTE', 'ANFITRION'), validateBody(createInvoiceSchema), createInvoice);
router.post('/:id/payments', authorize('SUPER_ADMIN', 'GERENTE', 'ANFITRION'), validateParams(uuidParamSchema), validateBody(addPaymentSchema), addPayment);
router.patch('/:id/cancel', authorize('SUPER_ADMIN', 'GERENTE'), validateParams(uuidParamSchema), cancelInvoice);

export default router;
