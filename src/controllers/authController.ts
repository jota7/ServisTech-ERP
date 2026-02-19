import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { successResponse, errorResponse, createdResponse } from '@/utils/response';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign({ userId, email, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

// Login
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: { store: true },
  });
  
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }
  
  if (!user.isActive) {
    throw new AppError('Account is disabled', 401);
  }
  
  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }
  
  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });
  
  // Generate token
  const token = generateToken(user.id, user.email, user.role);
  
  // Log successful login
  logger.info(`User logged in: ${user.email}`);
  
  successResponse(res, {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
      store: user.store ? {
        id: user.store.id,
        name: user.store.name,
        code: user.store.code,
      } : null,
    },
  }, 'Login successful');
});

// Register (only super admin can create users)
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, storeId } = req.body;
  
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      storeId,
    },
    include: { store: true },
  });
  
  // Generate token
  const token = generateToken(user.id, user.email, user.role);
  
  logger.info(`New user registered: ${user.email}`);
  
  createdResponse(res, {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
      store: user.store,
    },
  }, 'User created successfully');
});

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { store: true },
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

// Change password
export const changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password);
  
  if (!isValid) {
    throw new AppError('Current password is incorrect', 400);
  }
  
  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
  
  successResponse(res, null, 'Password changed successfully');
});

// Refresh token
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
  });
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  const token = generateToken(user.id, user.email, user.role);
  
  successResponse(res, { token }, 'Token refreshed');
});
