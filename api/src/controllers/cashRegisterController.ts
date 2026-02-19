import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { successResponse, createdResponse } from '@/utils/response';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

// Get current register
export const getCurrentRegister = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { storeId } = req.params;
  
  const register = await prisma.cashRegister.findFirst({
    where: {
      storeId,
      status: 'OPEN',
    },
    include: {
      expenses: {
        orderBy: { createdAt: 'desc' },
      },
      openedBy: {
        select: { id: true, name: true },
      },
    },
  });
  
  if (!register) {
    successResponse(res, null, 'No open register found');
    return;
  }
  
  successResponse(res, register);
});

// Open register
export const openRegister = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { storeId } = req.params;
  const { openingUSD, openingVES } = req.body;
  
  // Check if there's already an open register
  const existingRegister = await prisma.cashRegister.findFirst({
    where: {
      storeId,
      status: 'OPEN',
    },
  });
  
  if (existingRegister) {
    throw new AppError('There is already an open register for this store', 400);
  }
  
  const register = await prisma.cashRegister.create({
    data: {
      storeId,
      openingUSD,
      openingVES,
      systemUSD: openingUSD,
      systemVES: openingVES,
      status: 'OPEN',
      openedById: req.user!.id,
    },
    include: {
      openedBy: {
        select: { id: true, name: true },
      },
    },
  });
  
  logger.info(`Cash register opened for store ${storeId}`);
  
  createdResponse(res, register, 'Register opened successfully');
});

// Close register
export const closeRegister = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { declaredUSD, declaredVES } = req.body;
  
  const register = await prisma.cashRegister.findUnique({
    where: { id },
    include: {
      expenses: true,
    },
  });
  
  if (!register) {
    throw new AppError('Register not found', 404);
  }
  
  if (register.status !== 'OPEN') {
    throw new AppError('Register is not open', 400);
  }
  
  // Calculate discrepancies
  const discrepancyUSD = declaredUSD - Number(register.systemUSD);
  const discrepancyVES = declaredVES - Number(register.systemVES);
  
  // Determine status
  let status = 'CLOSED';
  if (discrepancyUSD !== 0 || discrepancyVES !== 0) {
    status = 'DISCREPANCY';
  }
  
  const updatedRegister = await prisma.cashRegister.update({
    where: { id },
    data: {
      declaredUSD,
      declaredVES,
      discrepancyUSD,
      discrepancyVES,
      status,
      closedById: req.user!.id,
      closedAt: new Date(),
    },
  });
  
  logger.info(`Cash register closed: ${id} with status ${status}`);
  
  successResponse(res, updatedRegister, 'Register closed successfully');
});

// Add expense
export const addExpense = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { description, amount, currency, category, receiptPhoto } = req.body;
  
  const register = await prisma.cashRegister.findUnique({
    where: { id },
  });
  
  if (!register) {
    throw new AppError('Register not found', 404);
  }
  
  if (register.status !== 'OPEN') {
    throw new AppError('Register is not open', 400);
  }
  
  // Create expense
  const expense = await prisma.pettyCashExpense.create({
    data: {
      registerId: id,
      description,
      amount,
      currency,
      category,
      receiptPhoto,
      createdBy: req.user!.id,
    },
  });
  
  // Update system totals
  if (currency === 'USD') {
    await prisma.cashRegister.update({
      where: { id },
      data: {
        systemUSD: { decrement: amount },
      },
    });
  } else {
    await prisma.cashRegister.update({
      where: { id },
      data: {
        systemVES: { decrement: amount },
      },
    });
  }
  
  logger.info(`Expense added to register ${id}: ${description} - ${amount} ${currency}`);
  
  createdResponse(res, expense, 'Expense added successfully');
});

// Get register history
export const getRegisterHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { storeId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const [registers, total] = await Promise.all([
    prisma.cashRegister.findMany({
      where: { storeId },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        openedBy: {
          select: { id: true, name: true },
        },
        expenses: true,
        _count: {
          select: { expenses: true },
        },
      },
      orderBy: { openedAt: 'desc' },
    }),
    prisma.cashRegister.count({ where: { storeId } }),
  ]);
  
  successResponse(res, registers, 'Register history retrieved', 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// Get register summary (for dashboard)
export const getRegisterSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { storeId } = req.params;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [openRegister, todayStats] = await Promise.all([
    prisma.cashRegister.findFirst({
      where: {
        storeId,
        status: 'OPEN',
      },
      include: {
        expenses: true,
      },
    }),
    prisma.cashRegister.aggregate({
      where: {
        storeId,
        openedAt: {
          gte: today,
        },
      },
      _sum: {
        openingUSD: true,
        openingVES: true,
        systemUSD: true,
        systemVES: true,
      },
    }),
  ]);
  
  successResponse(res, {
    openRegister,
    todayStats,
  });
});
