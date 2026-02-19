import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { successResponse, createdResponse, paginate } from '@/utils/response';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

// Get all customers
export const getCustomers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { documentId: { contains: search } },
    ];
  }
  
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            orders: true,
            devices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);
  
  successResponse(res, customers, 'Customers retrieved successfully', 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// Get customer by ID
export const getCustomerById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      devices: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          device: {
            select: { model: true, brand: true },
          },
        },
      },
      _count: {
        select: {
          orders: true,
          devices: true,
        },
      },
    },
  });
  
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  
  successResponse(res, customer);
});

// Create customer
export const createCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, documentId, address } = req.body;
  
  // Check if document ID exists
  const existingCustomer = await prisma.customer.findUnique({
    where: { documentId },
  });
  
  if (existingCustomer) {
    throw new AppError('Customer with this document ID already exists', 409);
  }
  
  const customer = await prisma.customer.create({
    data: {
      name,
      email,
      phone,
      documentId,
      address,
    },
  });
  
  logger.info(`Customer created: ${customer.name} (${customer.documentId})`);
  
  createdResponse(res, customer, 'Customer created successfully');
});

// Update customer
export const updateCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, email, phone, address } = req.body;
  
  const customer = await prisma.customer.findUnique({
    where: { id },
  });
  
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  
  const updatedCustomer = await prisma.customer.update({
    where: { id },
    data: {
      name,
      email,
      phone,
      address,
    },
  });
  
  logger.info(`Customer updated: ${updatedCustomer.name}`);
  
  successResponse(res, updatedCustomer, 'Customer updated successfully');
});

// Delete customer
export const deleteCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: {
        select: { orders: true },
      },
    },
  });
  
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  
  if (customer._count.orders > 0) {
    throw new AppError('Cannot delete customer with existing orders', 400);
  }
  
  await prisma.customer.delete({
    where: { id },
  });
  
  logger.info(`Customer deleted: ${customer.name}`);
  
  successResponse(res, null, 'Customer deleted successfully');
});

// Get customer stats
export const getCustomerStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        select: {
          finalCost: true,
          status: true,
        },
      },
    },
  });
  
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  
  const stats = {
    totalOrders: customer.orders.length,
    completedOrders: customer.orders.filter((o) => o.status === 'ENTREGADO').length,
    totalSpent: customer.orders.reduce((sum, o) => sum + Number(o.finalCost), 0),
    averageOrderValue: customer.orders.length > 0
      ? customer.orders.reduce((sum, o) => sum + Number(o.finalCost), 0) / customer.orders.length
      : 0,
  };
  
  successResponse(res, stats);
});
