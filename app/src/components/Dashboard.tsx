import { useEffect, useState } from 'react';
import {
  useServiceOrderStore,
  useInvoiceStore,
  useInventoryStore,
  useCashRegisterStore,
  useBCVRateStore,
  useStoreStore,
} from '@/store';
import {
  DollarSign,
  Clock,
  Package,
  CheckCircle,
  Users,
  Wrench,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: React.ElementType;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
}

function MetricCard({ title, value, subtitle, trend, icon: Icon, color }: MetricCardProps) {
  const colorClasses = {
    green: 'text-[#39FF14] bg-[rgba(57,255,20,0.15)]',
    blue: 'text-[#00B2FF] bg-[rgba(0,178,255,0.15)]',
    yellow: 'text-[#FFB020] bg-[rgba(255,176,32,0.15)]',
    red: 'text-[#FF4D4D] bg-[rgba(255,77,77,0.15)]',
    purple: 'text-purple-400 bg-purple-400/15',
  };

  return (
    <div className="metric-card card-servistech-hover">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs ${
              trend >= 0 ? 'text-[#39FF14]' : 'text-[#FF4D4D]'
            }`}
          >
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[#A0AEC0] text-sm">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {subtitle && <p className="text-xs text-[#6B7280] mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

// Mock chart data
const revenueData = [
  { name: 'Lun', usd: 1200, ves: 78000 },
  { name: 'Mar', usd: 1900, ves: 123500 },
  { name: 'Mie', usd: 1500, ves: 97500 },
  { name: 'Jue', usd: 2200, ves: 143000 },
  { name: 'Vie', usd: 2800, ves: 182000 },
  { name: 'Sab', usd: 2400, ves: 156000 },
  { name: 'Dom', usd: 1800, ves: 117000 },
];

const ordersByStatusData = [
  { name: 'Triaje', value: 5, color: '#A0AEC0' },
  { name: 'Diagnóstico', value: 8, color: '#00B2FF' },
  { name: 'Espera', value: 3, color: '#FFB020' },
  { name: 'Micro-sold', value: 4, color: '#8B5CF6' },
  { name: 'QA', value: 6, color: '#F472B6' },
  { name: 'Listos', value: 12, color: '#39FF14' },
];

const topServicesData = [
  { name: 'Cambio Pantalla', count: 45, revenue: 9450 },
  { name: 'Batería', count: 32, revenue: 2720 },
  { name: 'Puerto Carga', count: 28, revenue: 1540 },
  { name: 'Software', count: 25, revenue: 750 },
  { name: 'Cámara', count: 18, revenue: 2250 },
];

export function Dashboard() {
  const { orders, getActiveOrders } = useServiceOrderStore();
  const { invoices } = useInvoiceStore();
  const { getLowStock } = useInventoryStore();
  const { registers } = useCashRegisterStore();
  const { currentRate } = useBCVRateStore();
  const { currentStore } = useStoreStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate KPIs
  const activeOrders = getActiveOrders().length;
  const todayInvoices = invoices.filter(
    (i) => i.createdAt.toDateString() === new Date().toDateString()
  );
  const todayRevenue = todayInvoices.reduce((sum, i) => sum + i.total, 0);
  const todayRevenueVES = currentRate ? todayRevenue * currentRate.rate : 0;
  const lowStockCount = getLowStock(currentStore?.id).length;
  
  const completedOrders = orders.filter((o) => o.status === 'entregado');
  const avgTAT = completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => {
        if (o.completedAt && o.createdAt) {
          return sum + (o.completedAt.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60);
        }
        return sum;
      }, 0) / completedOrders.length
    : 0;

  const warrantyOrders = orders.filter((o) => o.status === 'garantia').length;
  const warrantyRate = orders.length > 0 ? (warrantyOrders / orders.length) * 100 : 0;

  const openRegister = registers.find(
    (r) => r.storeId === currentStore?.id && r.status === 'open'
  );
  const cashInRegister = openRegister?.systemUSD || 0;

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#A0AEC0] mt-1">
            Bienvenido de vuelta, {currentStore?.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#A0AEC0]">
            {new Date().toLocaleDateString('es-VE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ingresos Hoy"
          value={`$${todayRevenue.toFixed(2)}`}
          subtitle={`Bs. ${todayRevenueVES.toFixed(2)}`}
          trend={12.5}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Órdenes Activas"
          value={activeOrders.toString()}
          subtitle={`${orders.filter((o) => o.status === 'listo').length} listas para entrega`}
          icon={Wrench}
          color="blue"
        />
        <MetricCard
          title="TAT Promedio"
          value={`${avgTAT.toFixed(1)}h`}
          subtitle="Tiempo de respuesta"
          trend={-5.2}
          icon={Clock}
          color="yellow"
        />
        <MetricCard
          title="Ratio Garantías"
          value={`${warrantyRate.toFixed(1)}%`}
          subtitle="Objetivo: <2%"
          trend={warrantyRate > 2 ? 0.5 : -0.3}
          icon={CheckCircle}
          color={warrantyRate > 2 ? 'red' : 'green'}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#A0AEC0] mb-2">
            <Package className="w-4 h-4" />
            <span className="text-xs">Stock Crítico</span>
          </div>
          <p className={`text-xl font-bold ${lowStockCount > 0 ? 'text-[#FF4D4D]' : 'text-[#39FF14]'}`}>
            {lowStockCount}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">repuestos</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#A0AEC0] mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Efectivo Caja</span>
          </div>
          <p className="text-xl font-bold text-white">${cashInRegister.toFixed(2)}</p>
          <p className="text-xs text-[#6B7280] mt-1">
            {openRegister ? 'Caja abierta' : 'Caja cerrada'}
          </p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#A0AEC0] mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs">Clientes Hoy</span>
          </div>
          <p className="text-xl font-bold text-white">{todayInvoices.length}</p>
          <p className="text-xs text-[#6B7280] mt-1">atendidos</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#A0AEC0] mb-2">
            <ShoppingCart className="w-4 h-4" />
            <span className="text-xs">Ticket Promedio</span>
          </div>
          <p className="text-xl font-bold text-white">
            ${todayInvoices.length > 0 ? (todayRevenue / todayInvoices.length).toFixed(2) : '0.00'}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">por factura</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Ingresos Semanales</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#39FF14]"></div>
                <span className="text-[#A0AEC0]">USD</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39FF14" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#39FF14" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1D23',
                    border: '1px solid #2D3748',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#FFFFFF' }}
                  itemStyle={{ color: '#39FF14' }}
                />
                <Area
                  type="monotone"
                  dataKey="usd"
                  stroke="#39FF14"
                  fillOpacity={1}
                  fill="url(#colorUsd)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Órdenes por Estado</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersByStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {ordersByStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1D23',
                    border: '1px solid #2D3748',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {ordersByStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-[#A0AEC0]">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Servicios Más Solicitados</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topServicesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" horizontal={false} />
                <XAxis type="number" stroke="#6B7280" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#A0AEC0" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1D23',
                    border: '1px solid #2D3748',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value} servicios`, 'Cantidad']}
                />
                <Bar dataKey="count" fill="#39FF14" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-[#0D0F12] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      order.status === 'listo'
                        ? 'bg-[#39FF14]'
                        : order.status === 'entregado'
                        ? 'bg-[#00B2FF]'
                        : 'bg-[#FFB020]'
                    }`}
                  ></div>
                  <div>
                    <p className="text-sm text-white font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-[#A0AEC0]">
                      {order.status === 'triaje'
                        ? 'En Triaje'
                        : order.status === 'diagnostico'
                        ? 'En Diagnóstico'
                        : order.status === 'espera-repuesto'
                        ? 'Esperando Repuesto'
                        : order.status === 'micro-soldadura'
                        ? 'Micro-soldadura'
                        : order.status === 'qa'
                        ? 'En QA'
                        : order.status === 'listo'
                        ? 'Listo para Entrega'
                        : 'Entregado'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">${order.finalCost || order.estimatedCost}</p>
                  <p className="text-xs text-[#6B7280]">
                    {order.createdAt.toLocaleDateString('es-VE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
