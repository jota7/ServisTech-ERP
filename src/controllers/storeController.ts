import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { successResponse, createdResponse } from '@/utils/response';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

// Get all stores
export const getStores = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const stores = await prisma.store.findMany({
    include: {
      _count: {
        select: {
          users: true,
          orders: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
  
  successResponse(res, stores);
});

// Get store by ID
export const getStoreById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      _count: {
        select: {
          orders: true,
          safeKits: true,
          courtesyDevices: true,
        },
      },
    },
  });
  
  if (!store) {
    throw new AppError('Store not found', 404);
  }
  
  successResponse(res, store);
});

// Create store
export const createStore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, code, address, phone, email, rif, razonSocial, direccionFiscal } = req.body;
  
  // Check if code exists
  const existingStore = await prisma.store.findUnique({
    where: { code },
  });
  
  if (existingStore) {
    throw new AppError('Store with this code already exists', 409);
  }
  
  const store = await prisma.store.create({
    data: {
      name,
      code,
      address,
      phone,
      email,
      rif,
      razonSocial,
      direccionFiscal,
    },
  });
  
  logger.info(`Store created: ${store.name} (${store.code})`);
  
  createdResponse(res, store, 'Store created successfully');
});

// Update store
export const updateStore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const data = req.body;
  
  const store = await prisma.store.findUnique({
    where: { id },
  });
  
  if (!store) {
    throw new AppError('Store not found', 404);
  }
  
  const updatedStore = await prisma.store.update({
    where: { id },
    data,
  });
  
  logger.info(`Store updated: ${updatedStore.name}`);
  
  successResponse(res, updatedStore, 'Store updated successfully');
});

// Delete store
export const deleteStore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
          orders: true,
        },
      },
    },
  });
  
  if (!store) {
    throw new AppError('Store not found', 404);
  }
  
  if (store._count.users > 0 || store._count.orders > 0) {
    throw new AppError('Cannot delete store with users or orders', 400);
  }
  
  await prisma.store.delete({
    where: { id },
  });
  
  logger.info(`Store deleted: ${store.name}`);
  
  successResponse(res, null, 'Store deleted successfully');
});

// Get store stats
export const getStoreStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
  
  const store = await prisma.store.findUnique({
    where: { id },
  });
  
  if (!store) {
    throw new AppError('Store not found', 404);
  }
  
  const [
    ordersCount,
    ordersByStatus,
    invoicesTotal,
    activeOrders,
    completedOrders,
  ] = await Promise.all([
    prisma.serviceOrder.count({
      where: {
        storeId: id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
    prisma.serviceOrder.groupBy({
      by: ['status'],
      where: {
        storeId: id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        status: true,
      },
    }),
    prisma.invoice.aggregate({
      where: {
        storeId: id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['PAID', 'PARTIAL'],
        },
      },
      _sum: {
        total: true,
      },
    }),
    prisma.serviceOrder.count({
      where: {
        storeId: id,
        status: {
          not: 'ENTREGADO',
        },
      },
    }),
    prisma.serviceOrder.count({
      where: {
        storeId: id,
        status: 'ENTREGADO',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
  ]);
  
  successResponse(res, {
    period: { startDate, endDate },
    ordersCount,
    ordersByStatus,
    invoicesTotal: invoicesTotal._sum.total || 0,
    activeOrders,
    completedOrders,
  });
});
