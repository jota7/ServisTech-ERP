import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { successResponse } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import { bcvScraper } from '@/services/bcvScraper';

// Get dashboard KPIs
export const getDashboardKPIs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const storeId = req.query.storeId as string;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const where: any = {};
  if (storeId) {
    where.storeId = storeId;
  }
  
  const [
    // Financial
    todayRevenue,
    monthRevenue,
    totalRevenue,
    
    // Orders
    activeOrders,
    todayOrders,
    monthOrders,
    completedToday,
    
    // Quality
    warrantyOrders,
    qaResults,
    
    // Inventory
    lowStockItems,
    pendingTransfers,
    
    // Cash
    openRegister,
    
    // BCV Rate
    bcvRate,
  ] = await Promise.all([
    // Today revenue
    prisma.invoice.aggregate({
      where: {
        ...where,
        createdAt: { gte: today },
        status: { in: ['PAID', 'PARTIAL'] },
      },
      _sum: { total: true },
    }),
    
    // Month revenue
    prisma.invoice.aggregate({
      where: {
        ...where,
        createdAt: { gte: startOfMonth },
        status: { in: ['PAID', 'PARTIAL'] },
      },
      _sum: { total: true },
    }),
    
    // Total revenue
    prisma.invoice.aggregate({
      where: {
        ...where,
        status: { in: ['PAID', 'PARTIAL'] },
      },
      _sum: { total: true },
    }),
    
    // Active orders
    prisma.serviceOrder.count({
      where: {
        ...where,
        status: { not: 'ENTREGADO' },
      },
    }),
    
    // Today orders
    prisma.serviceOrder.count({
      where: {
        ...where,
        createdAt: { gte: today },
      },
    }),
    
    // Month orders
    prisma.serviceOrder.count({
      where: {
        ...where,
        createdAt: { gte: startOfMonth },
      },
    }),
    
    // Completed today
    prisma.serviceOrder.count({
      where: {
        ...where,
        status: 'ENTREGADO',
        completedAt: { gte: today },
      },
    }),
    
    // Warranty orders
    prisma.serviceOrder.count({
      where: {
        ...where,
        status: 'GARANTIA',
      },
    }),
    
    // QA results
    prisma.qAResult.groupBy({
      by: ['passed'],
      where: {
        order: where,
      },
      _count: {
        passed: true,
      },
    }),
    
    // Low stock items
    prisma.part.findMany({
      where: {
        stock: {
          some: {
            quantity: { lte: prisma.part.fields.minStock },
          },
        },
      },
      select: { id: true },
    }),
    
    // Pending transfers
    prisma.stockTransfer.count({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'IN_TRANSIT' },
        ],
      },
    }),
    
    // Open register
    prisma.cashRegister.findFirst({
      where: {
        storeId,
        status: 'OPEN',
      },
      select: {
        systemUSD: true,
        systemVES: true,
      },
    }),
    
    // BCV Rate
    bcvScraper.getCurrentRate(),
  ]);
  
  // Calculate metrics
  const totalOrders = await prisma.serviceOrder.count({ where });
  const warrantyRate = totalOrders > 0 ? (warrantyOrders / totalOrders) * 100 : 0;
  
  const totalQATests = qaResults.reduce((sum, r) => sum + r._count.passed, 0);
  const passedQATests = qaResults.find((r) => r.passed)?._count.passed || 0;
  const qaPassRate = totalQATests > 0 ? (passedQATests / totalQATests) * 100 : 0;
  
  // Calculate TAT (Turnaround Time)
  const completedOrders = await prisma.serviceOrder.findMany({
    where: {
      ...where,
      status: 'ENTREGADO',
      completedAt: { gte: startOfMonth },
    },
    select: {
      createdAt: true,
      completedAt: true,
    },
  });
  
  const avgTAT = completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => {
        const hours = (o.completedAt!.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0) / completedOrders.length
    : 0;
  
  // Average ticket
  const paidInvoices = await prisma.invoice.count({
    where: {
      ...where,
      status: { in: ['PAID', 'PARTIAL'] },
    },
  });
  
  const averageTicket = paidInvoices > 0
    ? Number(totalRevenue._sum.total || 0) / paidInvoices
    : 0;
  
  successResponse(res, {
    // Financial
    todayRevenue: Number(todayRevenue._sum.total || 0),
    monthRevenue: Number(monthRevenue._sum.total || 0),
    totalRevenue: Number(totalRevenue._sum.total || 0),
    averageTicket,
    
    // Operations
    activeOrders,
    todayOrders,
    monthOrders,
    completedToday,
    avgTAT: Math.round(avgTAT * 10) / 10,
    
    // Quality
    warrantyRate: Math.round(warrantyRate * 100) / 100,
    qaPassRate: Math.round(qaPassRate * 100) / 100,
    
    // Inventory
    lowStockItems: lowStockItems.length,
    pendingTransfers,
    
    // Cash
    cashInRegister: openRegister ? {
      usd: Number(openRegister.systemUSD),
      ves: Number(openRegister.systemVES),
    } : null,
    
    // BCV
    bcvRate,
  });
});

// Get revenue chart data
export const getRevenueChart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const storeId = req.query.storeId as string;
  const days = parseInt(req.query.days as string) || 7;
  
  const dates: Date[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }
  
  const data = await Promise.all(
    dates.map(async (date) => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const result = await prisma.invoice.aggregate({
        where: {
          storeId: storeId || undefined,
          createdAt: {
            gte: date,
            lt: nextDate,
          },
          status: { in: ['PAID', 'PARTIAL'] },
        },
        _sum: { total: true },
      });
      
      return {
        date: date.toISOString().split('T')[0],
        usd: Number(result._sum.total || 0),
      };
    })
  );
  
  successResponse(res, data);
});

// Get orders by status
export const getOrdersByStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const storeId = req.query.storeId as string;
  
  const where: any = {};
  if (storeId) {
    where.storeId = storeId;
  }
  
  const ordersByStatus = await prisma.serviceOrder.groupBy({
    by: ['status'],
    where: {
      ...where,
      status: { not: 'ENTREGADO' },
    },
    _count: {
      status: true,
    },
  });
  
  const formatted = ordersByStatus.map((item) => ({
    name: item.status,
    value: item._count.status,
  }));
  
  successResponse(res, formatted);
});

// Get top services
export const getTopServices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const storeId = req.query.storeId as string;
  const limit = parseInt(req.query.limit as string) || 5;
  
  const where: any = {};
  if (storeId) {
    where.storeId = storeId;
  }
  
  // Get parts usage
  const topParts = await prisma.partUsage.groupBy({
    by: ['partId'],
    where: {
      order: where,
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: limit,
  });
  
  // Get part details
  const partsWithDetails = await Promise.all(
    topParts.map(async (item) => {
      const part = await prisma.part.findUnique({
        where: { id: item.partId },
        select: { name: true, salePrice: true },
      });
      
      return {
        name: part?.name || 'Unknown',
        count: item._sum.quantity || 0,
        revenue: (item._sum.quantity || 0) * Number(part?.salePrice || 0),
      };
    })
  );
  
  successResponse(res, partsWithDetails);
});

// Get recent activity
export const getRecentActivity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const storeId = req.query.storeId as string;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const where: any = {};
  if (storeId) {
    where.storeId = storeId;
  }
  
  const [recentOrders, recentInvoices] = await Promise.all([
    prisma.serviceOrder.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { name: true },
        },
        device: {
          select: { model: true },
        },
      },
    }),
    prisma.invoice.findMany({
      where: {
        storeId: storeId || undefined,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { name: true },
        },
      },
    }),
  ]);
  
  // Combine and sort
  const activity = [
    ...recentOrders.map((o) => ({
      type: 'order',
      id: o.id,
      title: o.orderNumber,
      description: o.reportedIssue.substring(0, 50),
      status: o.status,
      amount: Number(o.finalCost),
      date: o.createdAt,
    })),
    ...recentInvoices.map((i) => ({
      type: 'invoice',
      id: i.id,
      title: i.invoiceNumber,
      description: i.customer.name,
      status: i.status,
      amount: Number(i.total),
      date: i.createdAt,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
  
  successResponse(res, activity);
});
