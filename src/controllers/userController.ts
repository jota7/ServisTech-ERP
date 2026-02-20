import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@/config/database';
import { successResponse, createdResponse } from '@/utils/response';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

export const getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const role = req.query.role as string;
  
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatar: true,
        storeId: true,
        createdAt: true,
        lastLogin: true,
        store: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  
  successResponse(res, users, 'Users retrieved successfully', 200, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true, isActive: true,
      avatar: true, storeId: true, createdAt: true, lastLogin: true,
      store: { select: { id: true, name: true, code: true } }
    },
  });
  if (!user) throw new AppError('User not found', 404);
  successResponse(res, user);
});

export const createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, storeId } = req.body;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new AppError('Email already registered', 409);
  
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role, storeId },
    select: {
      id: true, name: true, email: true, role: true, isActive: true,
      storeId: true, createdAt: true,
      store: { select: { id: true, name: true, code: true } }
    },
  });
  logger.info(`User created: ${user.email}`);
  createdResponse(res, user, 'User created successfully');
});

export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, email, role, storeId, isActive } = req.body;
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) throw new AppError('User not found', 404);
  
  const user = await prisma.user.update({
    where: { id },
    data: { name, email, role, storeId, isActive },
    select: {
      id: true, name: true, email: true, role: true, isActive: true,
      storeId: true, updatedAt: true,
      store: { select: { id: true, name: true, code: true } }
    },
  });
  successResponse(res, user, 'User updated successfully');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (id === req.user?.id) throw new AppError('Cannot delete your own account', 400);
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  successResponse(res, null, 'User disabled successfully');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { password: hashedPassword } });
  successResponse(res, null, 'Password reset successfully');
});