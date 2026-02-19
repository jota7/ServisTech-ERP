import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
} from '@/controllers/userController';
import { authenticate, authorize } from '@/middleware/auth';
import { validateBody, validateParams } from '@/middleware/validate';
import { createUserSchema, updateUserSchema, uuidParamSchema } from '@/utils/schemas';

const router = Router();

router.use(authenticate);

// Routes accessible by SUPER_ADMIN and GERENTE
router.get('/', authorize('SUPER_ADMIN', 'GERENTE'), getUsers);
router.get('/:id', authorize('SUPER_ADMIN', 'GERENTE'), validateParams(uuidParamSchema), getUserById);

// Admin only routes
router.post('/', authorize('SUPER_ADMIN'), validateBody(createUserSchema), createUser);
router.put('/:id', authorize('SUPER_ADMIN'), validateParams(uuidParamSchema), validateBody(updateUserSchema), updateUser);
router.delete('/:id', authorize('SUPER_ADMIN'), validateParams(uuidParamSchema), deleteUser);
router.post('/:id/reset-password', authorize('SUPER_ADMIN'), validateParams(uuidParamSchema), resetPassword);

export default router;
