import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  addPartUsage,
  addTimeEntry,
  endTimeEntry,
  getKanbanBoard,
} from '@/controllers/orderController';
import { authenticate } from '@/middleware/auth';
import { validateBody, validateParams } from '@/middleware/validate';
import { createOrderSchema, updateOrderSchema, updateOrderStatusSchema, uuidParamSchema } from '@/utils/schemas';

const router = Router();

router.use(authenticate);

router.get('/', getOrders);
router.get('/kanban/board', getKanbanBoard);
router.get('/:id', validateParams(uuidParamSchema), getOrderById);
router.post('/', validateBody(createOrderSchema), createOrder);
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateOrderSchema), updateOrder);
router.patch('/:id/status', validateParams(uuidParamSchema), validateBody(updateOrderStatusSchema), updateOrderStatus);
router.post('/:id/parts', validateParams(uuidParamSchema), addPartUsage);
router.post('/:id/time', validateParams(uuidParamSchema), addTimeEntry);
router.patch('/:id/time/:entryId/end', validateParams(uuidParamSchema), endTimeEntry);

export default router;
