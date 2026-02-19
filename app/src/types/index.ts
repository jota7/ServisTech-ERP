// SERVISTECH ERP - Type Definitions

// ==================== USER & ROLES ====================
export type UserRole = 'super-admin' | 'gerente' | 'encargada' | 'anfitrion' | 'tecnico' | 'qa' | 'almacen' | 'mensajero';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeId: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  // V4.0 - Commission settings per user
  commissionRate?: number;
  flatRatePerUnit?: number;
  accessoryRate?: number;
}

// ==================== STORES / SEDES ====================
export interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  isActive: boolean;
  fiscalData: FiscalData;
}

export interface FiscalData {
  rif: string;
  razonSocial: string;
  direccionFiscal: string;
}

// ==================== BCV RATE ====================
export interface BCVRate {
  id: string;
  rate: number;
  date: Date;
  source: 'automatic' | 'manual';
  updatedBy?: string;
  createdAt: Date;
}

// ==================== CUSTOMERS ====================
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  documentId: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== DEVICES ====================
export type DeviceType = 'iphone' | 'ipad' | 'android' | 'watch' | 'laptop' | 'other';
export type DeviceBrand = 'apple' | 'samsung' | 'xiaomi' | 'motorola' | 'huawei' | 'other';
export type LockType = 'pattern' | 'pin' | 'password' | 'none';

export interface DeviceCredentials {
  type: LockType;
  pattern?: number[]; // Array of dot indices (0-8) for pattern
  pin?: string;
  password?: string;
  notes?: string;
}

export interface Device {
  id: string;
  type: DeviceType;
  brand: DeviceBrand;
  model: string;
  serialNumber: string;
  imei?: string;
  color?: string;
  storage?: string;
  customerId: string;
  notes?: string;
  credentials?: DeviceCredentials;
  createdAt: Date;
}

// ==================== SERVICE ORDERS ====================
export type OrderStatus = 
  | 'triaje' 
  | 'diagnostico' 
  | 'espera-repuesto' 
  | 'micro-soldadura' 
  | 'qa' 
  | 'listo' 
  | 'entregado' 
  | 'garantia';

export type Priority = 'baja' | 'media' | 'alta' | 'urgente';

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  deviceId: string;
  storeId: string;
  status: OrderStatus;
  priority: Priority;
  
  // Reception
  reportedIssue: string;
  checklist: ChecklistItem[];
  photos: Photo[];
  customerSignature?: string;
  termsAccepted: boolean;
  
  // Technical
  diagnosis?: string;
  solution?: string;
  partsUsed: PartUsage[];
  internalPhotos: Photo[];
  timeTracking: TimeEntry[];
  
  // QA
  qaResults?: QAResult;
  
  // Financial
  estimatedCost: number;
  finalCost: number;
  paidAmount: number;
  grossProfit?: number; // V4.0 - COGS+ calculation
  
  // Logistics
  safeKitId?: string;
  courtesyDeviceId?: string;
  
  // Metadata
  createdBy: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // V4.0 - Extended fields for UI
  customerName?: string;
  technicianId?: string;
  technicianName?: string;
  technicianRole?: string;
  
  // V4.0 - Warranty fields
  warrantyId?: string;
  warrantyStatus?: string;
  warrantyCause?: string;
  warrantyNotes?: string;
  warrantyDate?: Date;
}

export interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  checked: boolean;
  notes?: string;
}

export interface Photo {
  id: string;
  url: string;
  type: 'exterior' | 'interior' | 'document' | 'other';
  description?: string;
  uploadedAt: Date;
}

export interface PartUsage {
  partId: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
}

export interface TimeEntry {
  id: string;
  technicianId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  description: string;
}

export interface QAResult {
  passed: boolean;
  testDate: Date;
  testedBy: string;
  tests: QATest[];
  notes?: string;
}

export interface QATest {
  id: string;
  name: string;
  passed: boolean;
  notes?: string;
}

// ==================== INVENTORY ====================
export interface Part {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  compatibleModels: string[];
  
  // Stock by store
  stock: StockByStore[];
  
  // Pricing
  costPrice: number;
  salePrice: number;
  
  // COGS+
  shippingCost: number;
  operationalCost: number;
  warrantyFund: number; // 10% default
  
  supplier?: string;
  minStock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockByStore {
  storeId: string;
  quantity: number;
  reserved: number;
}

export interface StockTransfer {
  id: string;
  partId: string;
  fromStoreId: string;
  toStoreId: string;
  quantity: number;
  status: 'pending' | 'in-transit' | 'received' | 'cancelled';
  requestedBy: string;
  approvedBy?: string;
  sentAt?: Date;
  receivedAt?: Date;
  createdAt: Date;
}

// ==================== SAFE KITS ====================
export interface SafeKit {
  id: string;
  code: string;
  name: string;
  storeId: string;
  status: 'available' | 'in-use' | 'maintenance';
  currentOrderId?: string;
  qrCode: string;
  createdAt: Date;
}

// ==================== COURTESY DEVICES ====================
export interface CourtesyDevice {
  id: string;
  type: DeviceType;
  brand: DeviceBrand;
  model: string;
  serialNumber: string;
  storeId: string;
  status: 'available' | 'loaned' | 'maintenance';
  currentLoan?: DeviceLoan;
  createdAt: Date;
}

export interface DeviceLoan {
  customerId: string;
  orderId: string;
  loanDate: Date;
  expectedReturnDate: Date;
  actualReturnDate?: Date;
  condition: string;
  notes?: string;
}

// ==================== POS & INVOICING ====================
export type PaymentMethod = 'zelle' | 'cash-usd' | 'cash-ves' | 'pago-movil' | 'binance' | 'transfer';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  storeId: string;
  orderId?: string;
  
  // Items
  items: InvoiceItem[];
  
  // Totals
  subtotal: number;
  igtfAmount: number; // 3% for cash foreign currency
  discount: number;
  total: number;
  totalVES: number; // Converted at BCV rate
  
  // Payments
  payments: Payment[];
  paidTotal: number;
  
  // Status
  status: 'pending' | 'paid' | 'partial' | 'cancelled';
  
  createdBy: string;
  createdAt: Date;
  paidAt?: Date;
}

export interface InvoiceItem {
  id: string;
  type: 'service' | 'part' | 'accessory';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  amountVES?: number;
  reference?: string;
  bankName?: string;
  phoneNumber?: string;
  email?: string;
  timestamp: Date;
}

// ==================== CASH REGISTER ====================
export interface CashRegister {
  id: string;
  storeId: string;
  openedBy: string;
  closedBy?: string;
  openedAt: Date;
  closedAt?: Date;
  
  // Opening amounts
  openingUSD: number;
  openingVES: number;
  
  // Declared amounts (blind close)
  declaredUSD?: number;
  declaredVES?: number;
  
  // System calculated
  systemUSD: number;
  systemVES: number;
  
  // Discrepancy
  discrepancyUSD?: number;
  discrepancyVES?: number;
  
  // Petty cash expenses
  expenses: PettyCashExpense[];
  
  // Status
  status: 'open' | 'closed' | 'discrepancy';
}

export interface PettyCashExpense {
  id: string;
  description: string;
  amount: number;
  currency: 'USD' | 'VES';
  category: string;
  receiptPhoto?: string;
  createdBy: string;
  createdAt: Date;
}

// ==================== AUDIT LOG ====================
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  timestamp: Date;
}

// ==================== NOTIFICATIONS ====================
export interface Notification {
  id: string;
  type: 'whatsapp' | 'email' | 'push';
  recipient: string;
  template: string;
  variables: Record<string, string>;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  error?: string;
  createdAt: Date;
}

// ==================== WHATSAPP TEMPLATES ====================
export interface WhatsAppTemplate {
  id: string;
  name: string;
  trigger: OrderStatus | 'custom';
  content: string;
  variables: string[];
  isActive: boolean;
}

// ==================== DASHBOARD KPIs ====================
export interface DashboardKPIs {
  // Financial
  totalRevenue: number;
  totalRevenueVES: number;
  netMargin: number;
  averageTicket: number;
  
  // Operations
  activeOrders: number;
  completedToday: number;
  avgTAT: number; // Turnaround Time in hours
  
  // Quality
  warrantyRate: number;
  qaPassRate: number;
  
  // Inventory
  lowStockItems: number;
  pendingTransfers: number;
  
  // Cash
  totalCashUSD: number;
  totalCashVES: number;
}

// ==================== FILTER & PAGINATION ====================
export interface FilterParams {
  storeId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

// ==================== SETTINGS ====================
export interface PrintFormat {
  id: string;
  name: string;
  type: 'receipt' | 'order' | 'invoice' | 'label';
  header: string;
  footer: string;
  showLogo: boolean;
  showQR: boolean;
  isDefault: boolean;
}

export interface AppSettings {
  companyName: string;
  logo?: string;
  defaultWarrantyDays: number;
  igtfPercentage: number;
  warrantyFundPercentage: number;
  bcvAutoSync: boolean;
  bcvSyncHour: number;
  whatsappEnabled: boolean;
  termsAndConditions: string;
  printFormats: PrintFormat[];
  useBinanceRate: boolean;
}

// ==================== BCV & BINANCE RATES ====================
export interface ExchangeRates {
  bcv: number;
  binance: number;
  lastUpdated: Date;
}
