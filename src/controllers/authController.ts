import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@/config/database';
import { successResponse } from '@/utils/response';
import { asyncHandler, AppError } from '@/middleware/errorHandler';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true, name: true, email: true, password: true, role: true, isActive: true,
      storeId: true,
      store: { select: { id: true, name: true, code: true } }
    }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isActive) throw new AppError('User account is disabled', 403);

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const { password: _, ...userWithoutPassword } = user;
  successResponse(res, { user: userWithoutPassword, token }, 'Login successful');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.id },
    select: {
      id: true, name: true, email: true, role: true, isActive: true,
      storeId: true,
      store: { select: { id: true, name: true, code: true } }
    }
  });
  successResponse(res, user);
});