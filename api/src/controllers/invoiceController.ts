import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { successResponse, createdResponse, paginate } from '@/utils/response';
import { asyncHandler, AppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { bcvScraper } from '@/services/bcvScraper';

// Generate invoice number
const generateInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      createdAt: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  });
  return `F-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Get all invoices
export const getInvoices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const search = req.query.search as string;
  const storeId = req.query.storeId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  
  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (storeId) {
    where.storeId = storeId;
  }
  
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }
  
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: {
          select: { id: true, name: true, documentId: true },
        },
        order: {
          select: { orderNumber: true },
        },
        _count: {
          select: { payments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.count({ where }),
  ]);
  
  successResponse(res, invoices, 'Invoices retrieved successfully', 200, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// Get invoice by ID
export const getInvoiceById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      store: {
        select: { id: true, name: true, code: true },
      },
      order: {
        select: { id: true, orderNumber: true },
      },
      items: true,
      payments: true,
    },
  });
  
  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }
  
  successResponse(res, invoice);
});

// Create invoice
export const createInvoice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { customerId, storeId, orderId, items, discount = 0 } = req.body;
  
  // Calculate totals
  const subtotal = items.reduce((sum: number, item: any) => 
    sum + (item.quantity * item.unitPrice), 0
  );
  
  // Check if any cash USD payment to calculate IGTF
  const hasCashUSD = false; // Will be determined by payments
  const igtfRate = 0.03;
  const igtfAmount = hasCashUSD ? subtotal * igtfRate : 0;
  
  const total = subtotal + igtfAmount - discount;
  
  // Convert to VES
  const bcvRate = await bcvScraper.getCurrentRate();
  const totalVES = bcvRate ? total * bcvRate : 0;
  
  const invoiceNumber = await generateInvoiceNumber();
  
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerId,
      storeId,
      orderId,
      subtotal,
      igtfAmount,
      discount,
      total,
      totalVES,
      paidTotal: 0,
      status: 'PENDING',
      createdBy: req.user!.id,
      items: {
        create: items.map((item: any) => ({
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
    include: {
      customer: {
        select: { id: true, name: true, documentId: true },
      },
      items: true,
    },
  });
  
  logger.info(`Invoice created: ${invoice.invoiceNumber}`);
  
  createdResponse(res, invoice, 'Invoice created successfully');
});

// Add payment
export const addPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { method, amount, reference, bankName, phoneNumber, email } = req.body;
  
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true },
  });
  
  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }
  
  if (invoice.status === 'PAID') {
    throw new AppError('Invoice is already fully paid', 400);
  }
  
  // Calculate remaining amount
  const paidSoFar = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Number(invoice.total) - paidSoFar;
  
  if (amount > remaining) {
    throw new AppError(`Payment exceeds remaining amount. Remaining: ${remaining}`, 400);
  }
  
  // Convert to VES if needed
  let amountVES: number | undefined;
  const bcvRate = await bcvScraper.getCurrentRate();
  if (bcvRate && (method === 'CASH_VES' || method === 'PAGO_MOVIL')) {
    amountVES = amount * bcvRate;
  }
  
  // Create payment
  const payment = await prisma.payment.create({
    data: {
      invoiceId: id,
      method,
      amount,
      amountVES,
      reference,
      bankName,
      phoneNumber,
      email,
    },
  });
  
  // Update invoice paid total
  const newPaidTotal = paidSoFar + amount;
  const newStatus = newPaidTotal >= Number(invoice.total) ? 'PAID' : 'PARTIAL';
  
  await prisma.invoice.update({
    where: { id },
    data: {
      paidTotal: newPaidTotal,
      status: newStatus,
      paidAt: newStatus === 'PAID' ? new Date() : null,
    },
  });
  
  // Recalculate IGTF if cash USD
  if (method === 'CASH_USD') {
    const igtfAmount = amount * 0.03;
    await prisma.invoice.update({
      where: { id },
      data: {
        igtfAmount: { increment: igtfAmount },
        total: { increment: igtfAmount },
      },
    });
  }
  
  logger.info(`Payment added to invoice ${invoice.invoiceNumber}: ${method} - ${amount}`);
  
  successResponse(res, payment, 'Payment added successfully');
});

// Cancel invoice
export const cancelInvoice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  const invoice = await prisma.invoice.findUnique({
    where: { id },
  });
  
  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }
  
  if (invoice.status === 'PAID') {
    throw new AppError('Cannot cancel a paid invoice', 400);
  }
  
  await prisma.invoice.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
  
  logger.info(`Invoice cancelled: ${invoice.invoiceNumber}`);
  
  successResponse(res, null, 'Invoice cancelled successfully');
});

// Get daily sales report
export const getDailyReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const storeId = req.query.storeId as string;
  const date = req.query.date ? new Date(req.query.date as string) : new Date();
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const where: any = {
    createdAt: {
      gte: startOfDay,
      lte: endOfDay,
    },
    status: {
      in: ['PAID', 'PARTIAL'],
    },
  };
  
  if (storeId) {
    where.storeId = storeId;
  }
  
  const [invoices, paymentSummary] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: { name: true },
        },
        payments: true,
      },
    }),
    prisma.payment.groupBy({
      by: ['method'],
      where: {
        invoice: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          storeId,
        },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);
  
  const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidTotal), 0);
  
  successResponse(res, {
    date: startOfDay,
    invoiceCount: invoices.length,
    totalSales,
    totalPaid,
    paymentMethods: paymentSummary,
    invoices,
  });
});
