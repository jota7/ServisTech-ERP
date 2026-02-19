import { useState } from 'react';
import { useUIStore, useAuthStore, useStoreStore, useBCVRateStore } from '@/store';
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  Store,
  TrendingUp,
  QrCode,
  Truck,
  Bell,
  Search,
  MapPin,
  Shield,
  Target,
  Percent,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentModule: string;
  onModuleChange: (module: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'recepcion', label: 'Recepción', icon: ClipboardList },
  { id: 'laboratorio', label: 'Laboratorio', icon: Wrench },
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'qa', label: 'QA & Salida', icon: QrCode },
  { id: 'pos', label: 'POS & Facturación', icon: ShoppingCart },
  { id: 'caja', label: 'Cierre de Caja', icon: DollarSign },
  { id: 'logistica', label: 'Logística VIP', icon: Truck },
  { id: 'clientes', label: 'Clientes', icon: Users },
  // V4.0 Modules
  { id: 'garantias', label: 'Garantías', icon: Shield },
  { id: 'comisiones', label: 'Comisiones', icon: Percent },
  { id: 'metas', label: 'Metas & Gastos', icon: Target },
  { id: 'tracking', label: 'Tracking Mensajeros', icon: MapPin },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
];

export function Layout({ children, currentModule, onModuleChange }: LayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user, logout } = useAuthStore();
  const { stores, currentStore, setCurrentStore } = useStoreStore();
  const { currentRate, binanceRate } = useBCVRateStore();
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0D0F12] flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0D0F12] border-r border-[#2D3748] transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20 xl:w-64'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-[#2D3748]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#39FF14] flex items-center justify-center">
              <Wrench className="w-5 h-5 text-[#0D0F12]" />
            </div>
            <div className={`${!sidebarOpen && 'lg:hidden xl:block'}`}>
              <h1 className="font-['Michroma'] text-lg text-white tracking-wider">SERVIS</h1>
              <p className="text-[10px] text-[#39FF14] -mt-1">TECH</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-64px)] scrollbar-dark">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onModuleChange(item.id)}
                className={`sidebar-item w-full rounded-lg ${
                  isActive ? 'active' : ''
                } ${!sidebarOpen && 'lg:justify-center xl:justify-start'}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`${!sidebarOpen && 'lg:hidden xl:block'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#0D0F12] border-b border-[#2D3748] flex items-center justify-between px-4 lg:px-6">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/5 text-[#A0AEC0] hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Exchange Rates */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1D23] rounded-lg border border-[#2D3748]">
                <TrendingUp className="w-4 h-4 text-[#39FF14]" />
                <span className="text-xs text-[#A0AEC0]">BCV:</span>
                <span className="text-sm font-mono font-medium text-[#39FF14]">
                  {currentRate ? currentRate.rate.toFixed(2) : '--'}
                </span>
              </div>
              {binanceRate && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1D23] rounded-lg border border-[#2D3748]">
                  <span className="text-xs text-[#F7931A]">USDT:</span>
                  <span className="text-sm font-mono font-medium text-[#F7931A]">
                    {binanceRate.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#1A1D23] rounded-lg border border-[#2D3748] w-64">
              <Search className="w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Buscar orden, cliente..."
                className="bg-transparent text-sm text-white placeholder:text-[#6B7280] focus:outline-none w-full"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-white/5 text-[#A0AEC0] hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF4D4D] rounded-full"></span>
            </button>

            {/* Store Selector */}
            <div className="relative">
              <button
                onClick={() => setShowStoreSelector(!showStoreSelector)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1D23] rounded-lg border border-[#2D3748] hover:border-[#39FF14] transition-colors"
              >
                <Store className="w-4 h-4 text-[#39FF14]" />
                <span className="text-sm text-white hidden sm:block">{currentStore?.name}</span>
                <ChevronDown className="w-4 h-4 text-[#A0AEC0]" />
              </button>

              {showStoreSelector && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#1A1D23] border border-[#2D3748] rounded-lg shadow-xl z-50">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        setCurrentStore(store);
                        setShowStoreSelector(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        currentStore?.id === store.id ? 'text-[#39FF14]' : 'text-white'
                      }`}
                    >
                      <p className="text-sm font-medium">{store.name}</p>
                      <p className="text-xs text-[#A0AEC0]">{store.code}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#39FF14] to-[#00B2FF] flex items-center justify-center">
                  <span className="text-sm font-semibold text-[#0D0F12]">
                    {user?.name.charAt(0)}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm text-white">{user?.name}</p>
                  <p className="text-xs text-[#A0AEC0] capitalize">{user?.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-[#A0AEC0]" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A1D23] border border-[#2D3748] rounded-lg shadow-xl z-50">
                  <div className="px-4 py-3 border-b border-[#2D3748]">
                    <p className="text-sm text-white">{user?.name}</p>
                    <p className="text-xs text-[#A0AEC0]">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-[#FF4D4D] hover:bg-white/5 transition-colors rounded-b-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 scrollbar-dark">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
