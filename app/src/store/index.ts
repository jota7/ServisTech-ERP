import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  Store,
  BCVRate,
  Customer,
  ServiceOrder,
  Part,
  StockTransfer,
  SafeKit,
  CourtesyDevice,
  Invoice,
  CashRegister,
  Notification,
  DashboardKPIs,
  AppSettings,
  PrintFormat,
} from '@/types';

// ==================== AUTH STORE ====================
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);

// ==================== STORE / SEDE STORE ====================
interface StoreState {
  stores: Store[];
  currentStore: Store | null;
  setStores: (stores: Store[]) => void;
  setCurrentStore: (store: Store) => void;
  addStore: (store: Store) => void;
  updateStore: (id: string, updates: Partial<Store>) => void;
}

export const useStoreStore = create<StoreState>()(
  persist(
    (set) => ({
      stores: [],
      currentStore: null,
      setStores: (stores) => set({ stores }),
      setCurrentStore: (store) => set({ currentStore: store }),
      addStore: (store) => set((state) => ({ stores: [...state.stores, store] })),
      updateStore: (id, updates) =>
        set((state) => ({
          stores: state.stores.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
    }),
    { name: 'store-storage' }
  )
);

// ==================== BCV RATE STORE ====================
interface BCVRateState {
  currentRate: BCVRate | null;
  binanceRate: number | null;
  rateHistory: BCVRate[];
  setCurrentRate: (rate: BCVRate) => void;
  setBinanceRate: (rate: number) => void;
  addRateHistory: (rate: BCVRate) => void;
  getRateVES: (usd: number, useBinance?: boolean) => number;
  syncBinanceRate: () => Promise<void>;
}

export const useBCVRateStore = create<BCVRateState>()(
  persist(
    (set, get) => ({
      currentRate: null,
      binanceRate: null,
      rateHistory: [],
      setCurrentRate: (rate) => set({ currentRate: rate }),
      setBinanceRate: (rate) => set({ binanceRate: rate }),
      addRateHistory: (rate) =>
        set((state) => ({ rateHistory: [rate, ...state.rateHistory].slice(0, 30) })),
      getRateVES: (usd, useBinance = false) => {
        const rate = useBinance ? get().binanceRate : get().currentRate?.rate;
        return rate ? usd * rate : 0;
      },
      syncBinanceRate: async () => {
        try {
          // Binance API for USDT/VES (using USDT/USD proxy with local rate)
          const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTUSD');
          const data = await response.json();
          // Approximate VES rate using parallel market indicator
          // In production, this would use a local parallel rate API
          const usdtUsdPrice = parseFloat(data.price);
          // Estimated parallel rate (this would come from a local source in production)
          const estimatedParallelRate = usdtUsdPrice * 45; // Approximation
          set({ binanceRate: estimatedParallelRate });
        } catch (error) {
          console.error('Error fetching Binance rate:', error);
        }
      },
    }),
    { name: 'bcv-storage' }
  )
);

// ==================== SERVICE ORDERS STORE ====================
interface ServiceOrderState {
  orders: ServiceOrder[];
  currentOrder: ServiceOrder | null;
  setOrders: (orders: ServiceOrder[]) => void;
  setCurrentOrder: (order: ServiceOrder | null) => void;
  addOrder: (order: ServiceOrder) => void;
  updateOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  updateOrderStatus: (id: string, status: ServiceOrder['status']) => void;
  getOrdersByStatus: (status: ServiceOrder['status']) => ServiceOrder[];
  getOrdersByStore: (storeId: string) => ServiceOrder[];
  getActiveOrders: () => ServiceOrder[];
}

export const useServiceOrderStore = create<ServiceOrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      setOrders: (orders) => set({ orders }),
      setCurrentOrder: (order) => set({ currentOrder: order }),
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      updateOrder: (id, updates) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, ...updates, updatedAt: new Date() } : o
          ),
        })),
      updateOrderStatus: (id, status) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? { ...o, status, updatedAt: new Date(), completedAt: status === 'entregado' ? new Date() : o.completedAt }
              : o
          ),
        })),
      getOrdersByStatus: (status) => get().orders.filter((o) => o.status === status),
      getOrdersByStore: (storeId) => get().orders.filter((o) => o.storeId === storeId),
      getActiveOrders: () => get().orders.filter((o) => o.status !== 'entregado'),
    }),
    { name: 'orders-storage' }
  )
);

// ==================== INVENTORY STORE ====================
interface InventoryState {
  parts: Part[];
  transfers: StockTransfer[];
  setParts: (parts: Part[]) => void;
  setTransfers: (transfers: StockTransfer[]) => void;
  addPart: (part: Part) => void;
  updatePart: (id: string, updates: Partial<Part>) => void;
  addTransfer: (transfer: StockTransfer) => void;
  updateTransfer: (id: string, updates: Partial<StockTransfer>) => void;
  getLowStock: (storeId?: string) => Part[];
  getStockByStore: (partId: string, storeId: string) => number;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      parts: [],
      transfers: [],
      setParts: (parts) => set({ parts }),
      setTransfers: (transfers) => set({ transfers }),
      addPart: (part) => set((state) => ({ parts: [...state.parts, part] })),
      updatePart: (id, updates) =>
        set((state) => ({
          parts: state.parts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      addTransfer: (transfer) =>
        set((state) => ({ transfers: [transfer, ...state.transfers] })),
      updateTransfer: (id, updates) =>
        set((state) => ({
          transfers: state.transfers.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      getLowStock: (storeId) =>
        get().parts.filter((p) =>
          p.stock.some(
            (s) =>
              (!storeId || s.storeId === storeId) &&
              s.quantity - s.reserved <= p.minStock
          )
        ),
      getStockByStore: (partId, storeId) => {
        const part = get().parts.find((p) => p.id === partId);
        const stock = part?.stock.find((s) => s.storeId === storeId);
        return stock ? stock.quantity - stock.reserved : 0;
      },
    }),
    { name: 'inventory-storage' }
  )
);

// ==================== CUSTOMERS STORE ====================
interface CustomerState {
  customers: Customer[];
  currentCustomer: Customer | null;
  setCustomers: (customers: Customer[]) => void;
  setCurrentCustomer: (customer: Customer | null) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  searchCustomers: (query: string) => Customer[];
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      currentCustomer: null,
      setCustomers: (customers) => set({ customers }),
      setCurrentCustomer: (customer) => set({ currentCustomer: customer }),
      addCustomer: (customer) =>
        set((state) => ({ customers: [customer, ...state.customers] })),
      updateCustomer: (id, updates) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        })),
      searchCustomers: (query) =>
        get().customers.filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.phone.includes(query) ||
            c.documentId.includes(query)
        ),
    }),
    { name: 'customers-storage' }
  )
);

// ==================== INVOICES STORE ====================
interface InvoiceState {
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  setInvoices: (invoices: Invoice[]) => void;
  setCurrentInvoice: (invoice: Invoice | null) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  getInvoicesByStore: (storeId: string) => Invoice[];
  getTodayInvoices: () => Invoice[];
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      invoices: [],
      currentInvoice: null,
      setInvoices: (invoices) => set({ invoices }),
      setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),
      addInvoice: (invoice) => set((state) => ({ invoices: [invoice, ...state.invoices] })),
      updateInvoice: (id, updates) =>
        set((state) => ({
          invoices: state.invoices.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),
      getInvoicesByStore: (storeId) => get().invoices.filter((i) => i.storeId === storeId),
      getTodayInvoices: () => {
        const today = new Date().toDateString();
        return get().invoices.filter((i) => i.createdAt.toDateString() === today);
      },
    }),
    { name: 'invoices-storage' }
  )
);

// ==================== CASH REGISTER STORE ====================
interface CashRegisterState {
  registers: CashRegister[];
  currentRegister: CashRegister | null;
  setRegisters: (registers: CashRegister[]) => void;
  setCurrentRegister: (register: CashRegister | null) => void;
  openRegister: (register: CashRegister) => void;
  closeRegister: (id: string, closingData: Partial<CashRegister>) => void;
  addExpense: (registerId: string, expense: CashRegister['expenses'][0]) => void;
  getOpenRegister: (storeId: string) => CashRegister | undefined;
}

export const useCashRegisterStore = create<CashRegisterState>()(
  persist(
    (set, get) => ({
      registers: [],
      currentRegister: null,
      setRegisters: (registers) => set({ registers }),
      setCurrentRegister: (register) => set({ currentRegister: register }),
      openRegister: (register) =>
        set((state) => ({
          registers: [register, ...state.registers],
          currentRegister: register,
        })),
      closeRegister: (id, closingData) =>
        set((state) => ({
          registers: state.registers.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...closingData,
                  status: 'closed',
                  closedAt: new Date(),
                }
              : r
          ),
          currentRegister: null,
        })),
      addExpense: (registerId, expense) =>
        set((state) => ({
          registers: state.registers.map((r) =>
            r.id === registerId
              ? { ...r, expenses: [...r.expenses, expense] }
              : r
          ),
        })),
      getOpenRegister: (storeId) =>
        get().registers.find((r) => r.storeId === storeId && r.status === 'open'),
    }),
    { name: 'cash-storage' }
  )
);

// ==================== LOGISTICS STORE ====================
interface LogisticsState {
  safeKits: SafeKit[];
  courtesyDevices: CourtesyDevice[];
  setSafeKits: (kits: SafeKit[]) => void;
  setCourtesyDevices: (devices: CourtesyDevice[]) => void;
  assignSafeKit: (kitId: string, orderId: string) => void;
  releaseSafeKit: (kitId: string) => void;
  loanCourtesyDevice: (deviceId: string, loan: CourtesyDevice['currentLoan']) => void;
  returnCourtesyDevice: (deviceId: string) => void;
  getAvailableKits: (storeId: string) => SafeKit[];
  getAvailableCourtesyDevices: (storeId: string) => CourtesyDevice[];
}

export const useLogisticsStore = create<LogisticsState>()(
  persist(
    (set, get) => ({
      safeKits: [],
      courtesyDevices: [],
      setSafeKits: (kits) => set({ safeKits: kits }),
      setCourtesyDevices: (devices) => set({ courtesyDevices: devices }),
      assignSafeKit: (kitId, orderId) =>
        set((state) => ({
          safeKits: state.safeKits.map((k) =>
            k.id === kitId ? { ...k, status: 'in-use', currentOrderId: orderId } : k
          ),
        })),
      releaseSafeKit: (kitId) =>
        set((state) => ({
          safeKits: state.safeKits.map((k) =>
            k.id === kitId ? { ...k, status: 'available', currentOrderId: undefined } : k
          ),
        })),
      loanCourtesyDevice: (deviceId, loan) =>
        set((state) => ({
          courtesyDevices: state.courtesyDevices.map((d) =>
            d.id === deviceId ? { ...d, status: 'loaned', currentLoan: loan } : d
          ),
        })),
      returnCourtesyDevice: (deviceId) =>
        set((state) => ({
          courtesyDevices: state.courtesyDevices.map((d) =>
            d.id === deviceId
              ? {
                  ...d,
                  status: 'available',
                  currentLoan: undefined,
                }
              : d
          ),
        })),
      getAvailableKits: (storeId) =>
        get().safeKits.filter((k) => k.storeId === storeId && k.status === 'available'),
      getAvailableCourtesyDevices: (storeId) =>
        get().courtesyDevices.filter(
          (d) => d.storeId === storeId && d.status === 'available'
        ),
    }),
    { name: 'logistics-storage' }
  )
);

// ==================== UI STORE ====================
interface UIState {
  sidebarOpen: boolean;
  currentModule: string;
  notifications: Notification[];
  setSidebarOpen: (open: boolean) => void;
  setCurrentModule: (module: string) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      currentModule: 'dashboard',
      notifications: [],
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setCurrentModule: (module) => set({ currentModule: module }),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50),
        })),
      markNotificationAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    { name: 'ui-storage' }
  )
);

// ==================== SETTINGS STORE ====================
interface SettingsState {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  addPrintFormat: (format: PrintFormat) => void;
  updatePrintFormat: (id: string, updates: Partial<PrintFormat>) => void;
  deletePrintFormat: (id: string) => void;
  setLogo: (logo: string) => void;
}

const defaultPrintFormats: PrintFormat[] = [
  {
    id: 'default-receipt',
    name: 'Recibo Estándar',
    type: 'receipt',
    header: 'SERVISTECH\nRIF: J-12345678-9\nDirección: Caracas, Venezuela',
    footer: 'Gracias por preferirnos\nGarantía de 90 días',
    showLogo: true,
    showQR: true,
    isDefault: true,
  },
  {
    id: 'default-order',
    name: 'Orden de Servicio',
    type: 'order',
    header: 'ORDEN DE SERVICIO\nSERVISTECH',
    footer: 'Términos y condiciones aplican',
    showLogo: true,
    showQR: true,
    isDefault: true,
  },
];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        companyName: 'SERVISTECH',
        logo: undefined,
        defaultWarrantyDays: 90,
        igtfPercentage: 3,
        warrantyFundPercentage: 10,
        bcvAutoSync: true,
        bcvSyncHour: 8,
        whatsappEnabled: true,
        termsAndConditions: `TÉRMINOS Y CONDICIONES DE SERVICIO

1. RESPONSABILIDAD DE DATOS: El cliente es responsable de realizar copias de seguridad de toda la información antes de entregar el equipo. SERVISTECH no se hace responsable por pérdida de datos.

2. GARANTÍA: Todos los servicios tienen una garantía de 90 días sobre repuestos y mano de obra, excepto daños por líquidos o golpes.

3. DIAGNÓSTICO: El diagnóstico tiene un costo que será descontado del servicio si se aprueba la reparación.

4. ABANDONO: Los equipos no reclamados después de 30 días serán considerados abandonados.

5. PAGO: El pago debe realizarse al momento de la entrega del equipo reparado.`,
        printFormats: defaultPrintFormats,
        useBinanceRate: false,
      },
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
      addPrintFormat: (format) =>
        set((state) => ({
          settings: {
            ...state.settings,
            printFormats: [...state.settings.printFormats, format],
          },
        })),
      updatePrintFormat: (id, updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            printFormats: state.settings.printFormats.map((f) =>
              f.id === id ? { ...f, ...updates } : f
            ),
          },
        })),
      deletePrintFormat: (id) =>
        set((state) => ({
          settings: {
            ...state.settings,
            printFormats: state.settings.printFormats.filter((f) => f.id !== id),
          },
        })),
      setLogo: (logo) =>
        set((state) => ({
          settings: { ...state.settings, logo },
        })),
    }),
    { name: 'settings-storage' }
  )
);

// ==================== DASHBOARD STORE ====================
interface DashboardState {
  kpis: DashboardKPIs;
  isLoading: boolean;
  setKPIs: (kpis: DashboardKPIs) => void;
  setLoading: (loading: boolean) => void;
  refreshKPIs: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  kpis: {
    totalRevenue: 0,
    totalRevenueVES: 0,
    netMargin: 0,
    averageTicket: 0,
    activeOrders: 0,
    completedToday: 0,
    avgTAT: 0,
    warrantyRate: 0,
    qaPassRate: 0,
    lowStockItems: 0,
    pendingTransfers: 0,
    totalCashUSD: 0,
    totalCashVES: 0,
  },
  isLoading: false,
  setKPIs: (kpis) => set({ kpis }),
  setLoading: (loading) => set({ isLoading: loading }),
  refreshKPIs: async () => {
    set({ isLoading: true });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Calculate KPIs from other stores
    set({ isLoading: false });
  },
}));
