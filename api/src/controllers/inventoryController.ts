import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { successResponse, createdResponse, paginate } from '@/utils/response';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

// Get all parts
export const getParts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const category = req.query.category as string;
  const lowStock = req.query.lowStock === 'true';
  const storeId = req.query.storeId as string;
  
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (category) {
    where.category = category;
  }
  
  const [parts, total] = await Promise.all([
    prisma.part.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        stock: {
          where: storeId ? { storeId } : undefined,
          include: {
            store: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        _count: {
          select: { usages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.part.count({ where }),
  ]);
  
  // Filter low stock if requested
  let filteredParts = parts;
  if (lowStock) {
    filteredParts = parts.filter((part) =>
      part.stock.some((s) => s.quantity - s.reserved <= part.minStock)
    );
  }
  
  // Calculate COGS for each part
  const partsWithCOGS = filteredParts.map((part) => ({
    ...part,
    cogs: Number(part.costPrice) + Number(part.shippingCost) + Number(part.operationalCost) + 
          (Number(part.costPrice) * 0.1), // 10% warranty fund
    margin: ((Number(part.salePrice) - (Number(part.costPrice) + Number(part.shippingCost) + 
          Number(part.operationalCost) + (Number(part.costPrice) * 0.1))) / Number(part.salePrice)) * 100,
  }));
  
  successResponse(res, partsWithCOGS, 'Parts retrieved successfully', 200, {
    page,
    limit,
    total: lowStock ? filteredParts.length : total,
    totalPages: Math.ceil((lowStock ? filteredParts.length : total) / limit),
  });
});

// Get part by ID
export const getPartById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const part = await prisma.part.findUnique({
    where: { id },
    include: {
      stock: {
        include: {
          store: {
            select: { id: true, name: true, code: true },
          },
        },
      },
      usages: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: { orderNumber: true },
          },
        },
      },
    },
  });
  
  if (!part) {
    throw new AppError('Part not found', 404);
  }
  
  // Calculate COGS
  const partWithCOGS = {
    ...part,
    cogs: Number(part.costPrice) + Number(part.shippingCost) + Number(part.operationalCost) + 
          (Number(part.costPrice) * 0.1),
    margin: ((Number(part.salePrice) - (Number(part.costPrice) + Number(part.shippingCost) + 
          Number(part.operationalCost) + (Number(part.costPrice) * 0.1))) / Number(part.salePrice)) * 100,
  };
  
  successResponse(res, partWithCOGS);
});

// Create part
export const createPart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    sku,
    name,
    description,
    category,
    compatibleModels,
    costPrice,
    salePrice,
    shippingCost,
    operationalCost,
    minStock,
    supplier,
  } = req.body;
  
  // Check if SKU exists
  const existingPart = await prisma.part.findUnique({
    where: { sku },
  });
  
  if (existingPart) {
    throw new AppError('Part with this SKU already exists', 409);
  }
  
  // Calculate warranty fund (10% of cost)
  const warrantyFund = costPrice * 0.1;
  
  const part = await prisma.part.create({
    data: {
      sku,
      name,
      description,
      category,
      compatibleModels,
      costPrice,
      salePrice,
      shippingCost,
      operationalCost,
      warrantyFund,
      minStock,
      supplier,
    },
  });
  
  logger.info(`Part created: ${part.sku} - ${part.name}`);
  
  createdResponse(res, part, 'Part created successfully');
});

// Update part
export const updatePart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const data = req.body;
  
  const part = await prisma.part.findUnique({
    where: { id },
  });
  
  if (!part) {
    throw new AppError('Part not found', 404);
  }
  
  // Recalculate warranty fund if costPrice changes
  if (data.costPrice !== undefined) {
    data.warrantyFund = data.costPrice * 0.1;
  }
  
  const updatedPart = await prisma.part.update({
    where: { id },
    data,
  });
  
  logger.info(`Part updated: ${updatedPart.sku}`);
  
  successResponse(res, updatedPart, 'Part updated successfully');
});

// Update stock
export const updateStock = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { storeId, quantity } = req.body;
  
  const part = await prisma.part.findUnique({
    where: { id },
  });
  
  if (!part) {
    throw new AppError('Part not found', 404);
  }
  
  const stock = await prisma.partStock.upsert({
    where: {
      partId_storeId: {
        partId: id,
        storeId,
      },
    },
    update: {
      quantity,
    },
    create: {
      partId: id,
      storeId,
      quantity,
    },
  });
  
  logger.info(`Stock updated: ${part.sku} at store ${storeId} = ${quantity}`);
  
  successResponse(res, stock, 'Stock updated successfully');
});

// Create stock transfer
export const createTransfer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { partId, fromStoreId, toStoreId, quantity } = req.body;
  
  // Check source stock
  const sourceStock = await prisma.partStock.findUnique({
    where: {
      partId_storeId: {
        partId,
        storeId: fromStoreId,
      },
    },
  });
  
  if (!sourceStock || sourceStock.quantity - sourceStock.reserved < quantity) {
    throw new AppError('Insufficient stock at source store', 400);
  }
  
  const transfer = await prisma.stockTransfer.create({
    data: {
      partId,
      fromStoreId,
      toStoreId,
      quantity,
      requestedBy: req.user!.id,
      status: 'PENDING',
    },
    include: {
      part: {
        select: { sku: true, name: true },
      },
      fromStore: {
        select: { name: true, code: true },
      },
      toStore: {
        select: { name: true, code: true },
      },
    },
  });
  
  logger.info(`Transfer created: ${transfer.part?.sku} from ${transfer.fromStore?.code} to ${transfer.toStore?.code}`);
  
  createdResponse(res, transfer, 'Transfer created successfully');
});

// Get transfers
export const getTransfers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  
  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  const [transfers, total] = await Promise.all([
    prisma.stockTransfer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        part: {
          select: { sku: true, name: true },
        },
        fromStore: {
          select: { name: true, code: true },
        },
        toStore: {
          select: { name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.stockTransfer.count({ where }),
  ]);
  
  successResponse(res, transfers, 'Transfers retrieved successfully', 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// Update transfer status
export const updateTransferStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  
  const transfer = await prisma.stockTransfer.findUnique({
    where: { id },
  });
  
  if (!transfer) {
    throw new AppError('Transfer not found', 404);
  }
  
  const updateData: any = { status };
  
  if (status === 'IN_TRANSIT') {
    updateData.sentAt = new Date();
  } else if (status === 'RECEIVED') {
    updateData.receivedAt = new Date();
    
    // Update stock quantities
    await prisma.$transaction([
      // Decrease source stock
      prisma.partStock.update({
        where: {
          partId_storeId: {
            partId: transfer.partId,
            storeId: transfer.fromStoreId,
          },
        },
        data: {
          quantity: { decrement: transfer.quantity },
        },
      }),
      // Increase destination stock
      prisma.partStock.upsert({
        where: {
          partId_storeId: {
            partId: transfer.partId,
            storeId: transfer.toStoreId,
          },
        },
        update: {
          quantity: { increment: transfer.quantity },
        },
        create: {
          partId: transfer.partId,
          storeId: transfer.toStoreId,
          quantity: transfer.quantity,
        },
      }),
    ]);
  }
  
  const updatedTransfer = await prisma.stockTransfer.update({
    where: { id },
    data: updateData,
  });
  
  successResponse(res, updatedTransfer, 'Transfer status updated');
});

// Get categories
export const getCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const categories = await prisma.part.groupBy({
    by: ['category'],
    _count: {
      category: true,
    },
  });
  
  successResponse(res, categories.map((c) => c.category));
});
