import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { successResponse, createdResponse, paginate } from '@/utils/response';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

// Generate order number
const generateOrderNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.serviceOrder.count({
    where: {
      createdAt: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  });
  return `ST-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Get all orders
export const getOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const search = req.query.search as string;
  const storeId = req.query.storeId as string;
  
  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (storeId) {
    where.storeId = storeId;
  }
  
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { reportedIssue: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  
  const [orders, total] = await Promise.all([
    prisma.serviceOrder.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: {
          select: { id: true, name: true, phone: true, documentId: true },
        },
        device: {
          select: { id: true, model: true, brand: true, type: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
        _count: {
          select: { partsUsed: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.serviceOrder.count({ where }),
  ]);
  
  successResponse(res, orders, 'Orders retrieved successfully', 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// Get order by ID
export const getOrderById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      device: true,
      store: {
        select: { id: true, name: true, code: true },
      },
      createdBy: {
        select: { id: true, name: true },
      },
      assignedTo: {
        select: { id: true, name: true },
      },
      checklist: true,
      photos: true,
      internalPhotos: true,
      partsUsed: {
        include: {
          part: {
            select: { sku: true, name: true },
          },
        },
      },
      timeEntries: {
        include: {
          technician: {
            select: { id: true, name: true },
          },
        },
      },
      qaResult: {
        include: {
          tests: true,
        },
      },
      safeKit: true,
    },
  });
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  successResponse(res, order);
});

// Create order
export const createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { customerId, deviceId, storeId, reportedIssue, priority, estimatedCost } = req.body;
  
  const orderNumber = await generateOrderNumber();
  
  const order = await prisma.serviceOrder.create({
    data: {
      orderNumber,
      customerId,
      deviceId,
      storeId,
      reportedIssue,
      priority,
      estimatedCost,
      createdById: req.user!.id,
    },
    include: {
      customer: {
        select: { id: true, name: true, phone: true },
      },
      device: {
        select: { id: true, model: true, brand: true },
      },
    },
  });
  
  logger.info(`Order created: ${order.orderNumber}`);
  
  createdResponse(res, order, 'Order created successfully');
});

// Update order
export const updateOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { diagnosis, solution, estimatedCost, finalCost, priority, assignedToId } = req.body;
  
  const order = await prisma.serviceOrder.findUnique({
    where: { id },
  });
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  const updatedOrder = await prisma.serviceOrder.update({
    where: { id },
    data: {
      diagnosis,
      solution,
      estimatedCost,
      finalCost,
      priority,
      assignedToId,
    },
    include: {
      customer: {
        select: { id: true, name: true },
      },
      assignedTo: {
        select: { id: true, name: true },
      },
    },
  });
  
  logger.info(`Order updated: ${updatedOrder.orderNumber}`);
  
  successResponse(res, updatedOrder, 'Order updated successfully');
});

// Update order status
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  
  const order = await prisma.serviceOrder.findUnique({
    where: { id },
  });
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  const updateData: any = { status };
  
  // Set completed date if status is ENTREGADO
  if (status === 'ENTREGADO') {
    updateData.completedAt = new Date();
  }
  
  const updatedOrder = await prisma.serviceOrder.update({
    where: { id },
    data: updateData,
  });
  
  logger.info(`Order ${order.orderNumber} status changed to ${status}`);
  
  successResponse(res, updatedOrder, 'Order status updated successfully');
});

// Add part usage
export const addPartUsage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { partId, quantity, costPrice, salePrice } = req.body;
  
  const order = await prisma.serviceOrder.findUnique({
    where: { id },
  });
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  // Check stock availability
  const stock = await prisma.partStock.findUnique({
    where: {
      partId_storeId: {
        partId,
        storeId: order.storeId,
      },
    },
  });
  
  if (!stock || stock.quantity - stock.reserved < quantity) {
    throw new AppError('Insufficient stock', 400);
  }
  
  // Create usage and update stock in transaction
  const [usage] = await prisma.$transaction([
    prisma.partUsage.create({
      data: {
        partId,
        orderId: id,
        quantity,
        costPrice,
        salePrice,
      },
    }),
    prisma.partStock.update({
      where: {
        partId_storeId: {
          partId,
          storeId: order.storeId,
        },
      },
      data: {
        reserved: { increment: quantity },
      },
    }),
  ]);
  
  successResponse(res, usage, 'Part usage added successfully');
});

// Add time entry
export const addTimeEntry = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { description } = req.body;
  
  const order = await prisma.serviceOrder.findUnique({
    where: { id },
  });
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  
  const timeEntry = await prisma.timeEntry.create({
    data: {
      orderId: id,
      technicianId: req.user!.id,
      startTime: new Date(),
      description,
    },
  });
  
  successResponse(res, timeEntry, 'Time entry started', 201);
});

// End time entry
export const endTimeEntry = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id, entryId } = req.params;
  
  const timeEntry = await prisma.timeEntry.findFirst({
    where: {
      id: entryId,
      orderId: id,
      endTime: null,
    },
  });
  
  if (!timeEntry) {
    throw new AppError('Active time entry not found', 404);
  }
  
  const endTime = new Date();
  const duration = Math.round((endTime.getTime() - timeEntry.startTime.getTime()) / 60000);
  
  const updatedEntry = await prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      endTime,
      duration,
    },
  });
  
  successResponse(res, updatedEntry, 'Time entry ended');
});

// Get kanban board data
export const getKanbanBoard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const storeId = req.query.storeId as string;
  
  const where: any = {
    status: {
      not: 'ENTREGADO',
    },
  };
  
  if (storeId) {
    where.storeId = storeId;
  }
  
  const orders = await prisma.serviceOrder.findMany({
    where,
    include: {
      customer: {
        select: { id: true, name: true },
      },
      device: {
        select: { model: true, brand: true },
      },
      assignedTo: {
        select: { id: true, name: true },
      },
      _count: {
        select: { partsUsed: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  // Group by status
  const board = {
    TRIAJE: orders.filter((o) => o.status === 'TRIAJE'),
    DIAGNOSTICO: orders.filter((o) => o.status === 'DIAGNOSTICO'),
    ESPERA_REPUESTO: orders.filter((o) => o.status === 'ESPERA_REPUESTO'),
    MICRO_SOLDADURA: orders.filter((o) => o.status === 'MICRO_SOLDADURA'),
    QA: orders.filter((o) => o.status === 'QA'),
    LISTO: orders.filter((o) => o.status === 'LISTO'),
  };
  
  successResponse(res, board);
});
