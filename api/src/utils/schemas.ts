import { z } from 'zod';

// ==================== USER SCHEMAS ====================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SUPER_ADMIN', 'GERENTE', 'ANFITRION', 'TECNICO', 'QA', 'ALMACEN']),
  storeId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['SUPER_ADMIN', 'GERENTE', 'ANFITRION', 'TECNICO', 'QA', 'ALMACEN']).optional(),
  storeId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

// ==================== CUSTOMER SCHEMAS ====================

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(10, 'Valid phone number required'),
  documentId: z.string().min(5, 'Document ID is required'),
  address: z.string().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ==================== DEVICE SCHEMAS ====================

export const createDeviceSchema = z.object({
  type: z.enum(['IPHONE', 'IPAD', 'ANDROID', 'WATCH', 'LAPTOP', 'OTHER']),
  brand: z.enum(['APPLE', 'SAMSUNG', 'XIAOMI', 'MOTOROLA', 'HUAWEI', 'OTHER']),
  model: z.string().min(1, 'Model is required'),
  serialNumber: z.string().min(5, 'Serial number is required'),
  imei: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  storage: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  customerId: z.string().uuid(),
});

// ==================== SERVICE ORDER SCHEMAS ====================

export const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  deviceId: z.string().uuid(),
  storeId: z.string().uuid(),
  reportedIssue: z.string().min(5, 'Issue description is required'),
  priority: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).default('MEDIA'),
  estimatedCost: z.number().min(0).default(0),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'TRIAJE',
    'DIAGNOSTICO',
    'ESPERA_REPUESTO',
    'MICRO_SOLDADURA',
    'QA',
    'LISTO',
    'ENTREGADO',
    'GARANTIA',
  ]),
});

export const updateOrderSchema = z.object({
  diagnosis: z.string().optional().nullable(),
  solution: z.string().optional().nullable(),
  estimatedCost: z.number().min(0).optional(),
  finalCost: z.number().min(0).optional(),
  priority: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
});

// ==================== PART SCHEMAS ====================

export const createPartSchema = z.object({
  sku: z.string().min(3, 'SKU is required'),
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  compatibleModels: z.array(z.string()).default([]),
  costPrice: z.number().min(0),
  salePrice: z.number().min(0),
  shippingCost: z.number().min(0).default(0),
  operationalCost: z.number().min(0).default(0),
  minStock: z.number().int().min(0).default(3),
  supplier: z.string().optional().nullable(),
});

export const updateStockSchema = z.object({
  storeId: z.string().uuid(),
  quantity: z.number().int(),
});

export const createTransferSchema = z.object({
  partId: z.string().uuid(),
  fromStoreId: z.string().uuid(),
  toStoreId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

// ==================== INVOICE SCHEMAS ====================

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  storeId: z.string().uuid(),
  orderId: z.string().uuid().optional().nullable(),
  items: z.array(
    z.object({
      type: z.enum(['service', 'part', 'accessory']),
      description: z.string(),
      quantity: z.number().int().min(1),
      unitPrice: z.number().min(0),
    })
  ).min(1),
  discount: z.number().min(0).default(0),
});

export const addPaymentSchema = z.object({
  method: z.enum(['ZELLE', 'CASH_USD', 'CASH_VES', 'PAGO_MOVIL', 'BINANCE', 'TRANSFER']),
  amount: z.number().min(0),
  reference: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

// ==================== CASH REGISTER SCHEMAS ====================

export const openRegisterSchema = z.object({
  openingUSD: z.number().min(0),
  openingVES: z.number().min(0),
});

export const closeRegisterSchema = z.object({
  declaredUSD: z.number().min(0),
  declaredVES: z.number().min(0),
});

export const addExpenseSchema = z.object({
  description: z.string().min(3),
  amount: z.number().min(0),
  currency: z.enum(['USD', 'VES']),
  category: z.string().default('Gasto Operativo'),
  receiptPhoto: z.string().optional().nullable(),
});

// ==================== STORE SCHEMAS ====================

export const createStoreSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  address: z.string(),
  phone: z.string(),
  email: z.string().email(),
  rif: z.string().optional().nullable(),
  razonSocial: z.string().optional().nullable(),
  direccionFiscal: z.string().optional().nullable(),
});

// ==================== UUID PARAM SCHEMA ====================

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// ==================== QUERY SCHEMAS ====================

export const paginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
