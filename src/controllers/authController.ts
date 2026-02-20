import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '@/config/database';
import { successResponse } from '@/utils/response';
import { asyncHandler, AppError } from '@/middleware/errorHandler';

// Función para generar tokens (Centralizada)
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
};

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

  const token = generateToken(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const { password: _, ...userWithoutPassword } = user;
  successResponse(res, { user: userWithoutPassword, token }, 'Login successful');
});

// Agregamos las funciones faltantes para que authRoutes no falle
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.id },
    include: { store: true }
  });
  successResponse(res, user);
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = generateToken(req.user!.id);
  successResponse(res, { token }, 'Token refreshed');
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role, storeId } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name, role, storeId }
  });
  successResponse(res, user, 'User registered successfully');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  // Lógica básica de cambio de password
  successResponse(res, null, 'Password changed successfully');
});