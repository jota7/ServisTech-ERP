import { Router } from 'express';
import { login, register, getProfile, changePassword, refreshToken } from '@/controllers/authController';
import { authenticate, authorize } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import { loginSchema, createUserSchema } from '@/utils/schemas';

const router = Router();

// Public routes
router.post('/login', validateBody(loginSchema), login);

// Protected routes
router.use(authenticate);

router.get('/profile', getProfile);
router.post('/refresh', refreshToken);
router.post('/change-password', changePassword);

// Admin only
router.post('/register', authorize('SUPER_ADMIN'), validateBody(createUserSchema), register);

export default router;
