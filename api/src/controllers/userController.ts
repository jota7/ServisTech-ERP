import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@/config/database';
import { successResponse, errorResponse, createdResponse, paginate } from '@/utils/response';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

// Get all users
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
  
  if (role) {
    where.role = role;
  }
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatar: true,
        storeId: true,
        store: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  
  successResponse(res, users, 'Users retrieved successfully', 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      store: {
        select: { id: true, name: true, code: true },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      avatar: true,
      storeId: true,
      store: true,
      createdAt: true,
      lastLogin: true,
    },
  });
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  successResponse(res, user);
});

// Create user
export const createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, storeId } = req.body;
  
  // Check if email exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      storeId,
    },
    include: {
      store: {
        select: { id: true, name: true, code: true },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      storeId: true,
      store: true,
      createdAt: true,
    },
  });
  
  logger.info(`User created: ${user.email} by ${req.user?.email}`);
  
  createdResponse(res, user, 'User created successfully');
});

// Update user
export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, email, role, storeId, isActive } = req.body;
  
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });
  
  if (!existingUser) {
    throw new AppError('User not found', 404);
  }
  
  // Check email uniqueness if changing
  if (email && email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email },
    });
    
    if (emailExists) {
      throw new AppError('Email already in use', 409);
    }
  }
  
  const user = await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      role,
      storeId,
      isActive,
    },
    include: {
      store: {
        select: { id: true, name: true, code: true },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      storeId: true,
      store: true,
      updatedAt: true,
    },
  });
  
  logger.info(`User updated: ${user.email} by ${req.user?.email}`);
  
  successResponse(res, user, 'User updated successfully');
});

// Delete user (soft delete by disabling)
export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  // Prevent self-deletion
  if (id === req.user?.id) {
    throw new AppError('Cannot delete your own account', 400);
  }
  
  const user = await prisma.user.findUnique({
    where: { id },
  });
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Soft delete by disabling
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
  
  logger.info(`User disabled: ${user.email} by ${req.user?.email}`);
  
  successResponse(res, null, 'User disabled successfully');
});

// Reset user password
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { newPassword } = req.body;
  
  const user = await prisma.user.findUnique({
    where: { id },
  });
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });
  
  logger.info(`Password reset for user: ${user.email} by ${req.user?.email}`);
  
  successResponse(res, null, 'Password reset successfully');
});
