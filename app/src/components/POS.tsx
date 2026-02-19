import { useState } from 'react';
import { useInvoiceStore, useServiceOrderStore, useBCVRateStore, useStoreStore, useSettingsStore } from '@/store';
import type { Invoice, Payment, PaymentMethod } from '@/types';
import {
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone,
  QrCode,
  CheckCircle,
  X,
  User,
  Bitcoin,
  RefreshCw,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: 'zelle', label: 'Zelle', icon: DollarSign },
  { id: 'cash-usd', label: 'Efectivo USD', icon: DollarSign },
  { id: 'cash-ves', label: 'Efectivo Bs', icon: DollarSign },
  { id: 'pago-movil', label: 'Pago Móvil', icon: Smartphone },
  { id: 'binance', label: 'Binance Pay', icon: QrCode },
  { id: 'transfer', label: 'Transferencia', icon: CreditCard },
];

interface CartItem {
  id: string;
  type: 'service' | 'part' | 'accessory';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export function POS() {
  const { invoices, addInvoice } = useInvoiceStore();
  const { orders: _orders } = useServiceOrderStore();
  const { currentRate, binanceRate, syncBinanceRate } = useBCVRateStore();
  const { currentStore } = useStoreStore();
  const { settings, updateSettings } = useSettingsStore();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showQuickSale, setShowQuickSale] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerDoc, setCustomerDoc] = useState('');

  // Payment state
  const [payments, setPayments] = useState<Partial<Payment>[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethod>('zelle');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState('');
  const [currentPaymentReference, setCurrentPaymentReference] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const igtfRate = 0.03; // 3% IGTF
  const hasCashUSD = payments.some((p) => p.method === 'cash-usd');
  const igtfAmount = hasCashUSD ? subtotal * igtfRate : 0;
  const total = subtotal + igtfAmount;
  
  // Use Binance rate if enabled, otherwise use BCV rate
  const useBinanceRate = settings.useBinanceRate;
  const conversionRate = useBinanceRate ? binanceRate : currentRate?.rate;
  const totalVES = conversionRate ? total * conversionRate : 0;
  const paidAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = Math.max(0, total - paidAmount);

  const addToCart = (item: Omit<CartItem, 'id' | 'total'>) => {
    setCart([...cart, { ...item, id: `item-${Date.now()}`, total: item.quantity * item.unitPrice }]);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const addPayment = () => {
    const amount = parseFloat(currentPaymentAmount);
    if (amount > 0) {
      setPayments([
        ...payments,
        {
          id: `pay-${Date.now()}`,
          method: currentPaymentMethod,
          amount,
          reference: currentPaymentReference || undefined,
          timestamp: new Date(),
        },
      ]);
      setCurrentPaymentAmount('');
      setCurrentPaymentReference('');
    }
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const completeSale = () => {
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `F-2024-${String(invoices.length + 1).padStart(4, '0')}`,
      customerId: customerDoc || 'walk-in',
      storeId: currentStore?.id || 's1',
      items: cart.map((item) => ({
        id: item.id,
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),
      subtotal,
      igtfAmount,
      discount: 0,
      total,
      totalVES,
      payments: payments as Payment[],
      paidTotal: paidAmount,
      status: paidAmount >= total ? 'paid' : 'partial',
      createdBy: 'u3',
      createdAt: new Date(),
      paidAt: paidAmount >= total ? new Date() : undefined,
    };

    // Store rate info for reference
    const rateInfo = {
      rateType: useBinanceRate ? 'binance' : 'bcv',
      rateValue: conversionRate,
      timestamp: new Date(),
    };
    console.log('Invoice created with rate:', rateInfo);

    addInvoice(newInvoice);
    setCart([]);
    setPayments([]);
    setShowPayment(false);
    setCustomerName('');
    setCustomerDoc('');
  };

  const quickAccessItems = [
    { description: 'Cargador 20W', price: 25 },
    { description: 'Cable Lightning', price: 20 },
    { description: 'Cable USB-C', price: 18 },
    { description: 'Case iPhone 14', price: 15 },
    { description: 'Mica Vidrio', price: 12 },
    { description: 'Auriculares', price: 35 },
    { description: 'Power Bank', price: 45 },
    { description: 'Soporte Auto', price: 22 },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">POS & Facturación</h1>
          <p className="text-[#A0AEC0] mt-1">Ventas rápidas y facturación multimoneda</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowQuickSale(true)} className="btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Venta Rápida
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Cart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Orders */}
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-servistech w-full pl-10"
                placeholder="Buscar orden de servicio para facturar..."
              />
            </div>
          </div>

          {/* Cart Items */}
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg">
            <div className="p-4 border-b border-[#2D3748]">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#39FF14]" />
                Carrito
              </h3>
            </div>

            {cart.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingCart className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
                <p className="text-[#A0AEC0]">El carrito está vacío</p>
                <p className="text-sm text-[#6B7280] mt-1">
                  Agrega productos o busca una orden de servicio
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#2D3748]">
                {cart.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{item.description}</p>
                      <p className="text-sm text-[#A0AEC0]">
                        {item.quantity} x ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[#39FF14] font-mono font-medium">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 hover:bg-[#FF4D4D]/20 rounded text-[#FF4D4D]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg">
            <div className="p-4 border-b border-[#2D3748]">
              <h3 className="text-lg font-semibold text-white">Facturas Recientes</h3>
            </div>
            <table className="table-servistech">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <span className="font-mono text-sm text-[#39FF14]">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td>
                      <span className="text-white text-sm">{invoice.customerId}</span>
                    </td>
                    <td>
                      <span className="text-[#39FF14] font-mono">${invoice.total.toFixed(2)}</span>
                    </td>
                    <td>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          invoice.status === 'paid'
                            ? 'bg-[rgba(57,255,20,0.15)] text-[#39FF14]'
                            : invoice.status === 'partial'
                            ? 'bg-[rgba(255,176,32,0.15)] text-[#FFB020]'
                            : 'bg-[rgba(255,77,77,0.15)] text-[#FF4D4D]'
                        }`}
                      >
                        {invoice.status === 'paid'
                          ? 'Pagada'
                          : invoice.status === 'partial'
                          ? 'Parcial'
                          : 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <span className="text-[#A0AEC0] text-sm">
                        {invoice.createdAt.toLocaleDateString('es-VE')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-4">
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Resumen</h3>

            {/* Customer Info */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-[#A0AEC0] mb-1 block">Cliente</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input-servistech w-full pl-10 text-sm"
                    placeholder="Nombre del cliente"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#A0AEC0] mb-1 block">Documento</label>
                <input
                  type="text"
                  value={customerDoc}
                  onChange={(e) => setCustomerDoc(e.target.value)}
                  className="input-servistech w-full text-sm"
                  placeholder="V-12345678"
                />
              </div>
            </div>

            {/* Rate Selector */}
            <div className="bg-[#0D0F12] rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#A0AEC0]">Tasa de conversión</span>
                <button
                  onClick={syncBinanceRate}
                  className="p-1 hover:bg-white/10 rounded text-[#6B7280] hover:text-[#39FF14]"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSettings({ useBinanceRate: false })}
                  className={`flex-1 py-1.5 px-2 rounded text-xs transition-all ${
                    !useBinanceRate
                      ? 'bg-[#39FF14]/20 text-[#39FF14]'
                      : 'bg-[#2D3748] text-[#A0AEC0]'
                  }`}
                >
                  BCV: {currentRate?.rate.toFixed(2) || '---'}
                </button>
                <button
                  onClick={() => updateSettings({ useBinanceRate: true })}
                  className={`flex-1 py-1.5 px-2 rounded text-xs transition-all ${
                    useBinanceRate
                      ? 'bg-[#F7931A]/20 text-[#F7931A]'
                      : 'bg-[#2D3748] text-[#A0AEC0]'
                  }`}
                >
                  <Bitcoin className="w-3 h-3 inline mr-1" />
                  {binanceRate?.toFixed(2) || '---'}
                </button>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#A0AEC0]">Subtotal</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>
              {igtfAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#A0AEC0]">IGTF (3%)</span>
                  <span className="text-[#FFB020]">${igtfAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-[#2D3748] pt-2">
                <div className="flex justify-between">
                  <span className="text-white font-medium">Total USD</span>
                  <span className="text-[#39FF14] font-mono font-bold text-lg">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[#A0AEC0] text-sm">Total Bs</span>
                  <span className={`font-mono text-sm ${useBinanceRate ? 'text-[#F7931A]' : 'text-[#00B2FF]'}`}>
                    Bs. {totalVES.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1 text-right">
                  {useBinanceRate ? 'Tasa Binance USDT' : 'Tasa BCV oficial'}
                </p>
              </div>
            </div>

            {/* Payment Status */}
            {payments.length > 0 && (
              <div className="bg-[#0D0F12] rounded-lg p-3 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#A0AEC0]">Pagado</span>
                  <span className="text-[#39FF14]">${paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#A0AEC0]">Restante</span>
                  <span className={remaining > 0 ? 'text-[#FFB020]' : 'text-[#39FF14]'}>
                    ${remaining.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className="btn-primary w-full disabled:opacity-50"
            >
              <DollarSign className="w-4 h-4 inline mr-1" />
              Procesar Pago
            </button>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-lg bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-[#39FF14]" />
              Procesar Pago
            </DialogTitle>
          </DialogHeader>

          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setCurrentPaymentMethod(method.id)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    currentPaymentMethod === method.id
                      ? 'border-[#39FF14] bg-[rgba(57,255,20,0.1)]'
                      : 'border-[#2D3748] hover:border-[#39FF14]/50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mx-auto mb-1 ${
                      currentPaymentMethod === method.id ? 'text-[#39FF14]' : 'text-[#A0AEC0]'
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      currentPaymentMethod === method.id ? 'text-[#39FF14]' : 'text-[#A0AEC0]'
                    }`}
                  >
                    {method.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Payment Input */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Monto (USD)</label>
              <input
                type="number"
                value={currentPaymentAmount}
                onChange={(e) => setCurrentPaymentAmount(e.target.value)}
                className="input-servistech w-full"
                placeholder="0.00"
              />
            </div>
            {currentPaymentMethod !== 'cash-usd' && currentPaymentMethod !== 'cash-ves' && (
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Referencia</label>
                <input
                  type="text"
                  value={currentPaymentReference}
                  onChange={(e) => setCurrentPaymentReference(e.target.value)}
                  className="input-servistech w-full"
                  placeholder="Número de referencia"
                />
              </div>
            )}
            <button onClick={addPayment} className="btn-secondary w-full">
              <Plus className="w-4 h-4 inline mr-1" />
              Agregar Pago
            </button>
          </div>

          {/* Added Payments */}
          {payments.length > 0 && (
            <div className="bg-[#0D0F12] rounded-lg p-3 mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Pagos Agregados</h4>
              <div className="space-y-2">
                {payments.map((payment, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm p-2 bg-[#1A1D23] rounded"
                  >
                    <div>
                      <span className="text-white">
                        {paymentMethods.find((m) => m.id === payment.method)?.label}
                      </span>
                      {payment.reference && (
                        <span className="text-[#6B7280] ml-2">Ref: {payment.reference}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#39FF14] font-mono">
                        ${payment.amount?.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removePayment(idx)}
                        className="p-1 hover:bg-[#FF4D4D]/20 rounded text-[#FF4D4D]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rate Selection */}
          <div className="bg-[#0D0F12] rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#A0AEC0]">Tasa de conversión</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={syncBinanceRate}
                  className="p-1.5 hover:bg-white/10 rounded text-[#A0AEC0] hover:text-[#39FF14]"
                  title="Sincronizar tasa"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateSettings({ useBinanceRate: false })}
                className={`flex-1 p-2 rounded-lg border text-sm transition-all ${
                  !useBinanceRate
                    ? 'border-[#39FF14] bg-[rgba(57,255,20,0.1)] text-[#39FF14]'
                    : 'border-[#2D3748] text-[#A0AEC0] hover:border-[#39FF14]/50'
                }`}
              >
                <DollarSign className="w-4 h-4 inline mr-1" />
                BCV: Bs. {currentRate?.rate.toFixed(2) || '---'}
              </button>
              <button
                onClick={() => updateSettings({ useBinanceRate: true })}
                className={`flex-1 p-2 rounded-lg border text-sm transition-all ${
                  useBinanceRate
                    ? 'border-[#F7931A] bg-[rgba(247,147,26,0.1)] text-[#F7931A]'
                    : 'border-[#2D3748] text-[#A0AEC0] hover:border-[#F7931A]/50'
                }`}
              >
                <Bitcoin className="w-4 h-4 inline mr-1" />
                Binance: Bs. {binanceRate?.toFixed(2) || '---'}
              </button>
            </div>
            <p className="text-xs text-[#6B7280] mt-2">
              {useBinanceRate 
                ? 'Usando tasa Binance USDT (paralelo)' 
                : 'Usando tasa oficial BCV'}
            </p>
          </div>

          {/* Summary */}
          <div className="border-t border-[#2D3748] pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-white font-medium">Total a Pagar</span>
              <span className="text-[#39FF14] font-mono font-bold">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-[#A0AEC0]">En Bolívares</span>
              <span className={useBinanceRate ? 'text-[#F7931A] font-mono' : 'text-[#00B2FF] font-mono'}>
                Bs. {totalVES.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-[#A0AEC0]">Restante</span>
              <span className={remaining > 0 ? 'text-[#FFB020]' : 'text-[#39FF14]'}>
                ${remaining.toFixed(2)}
              </span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowPayment(false)} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button
                onClick={completeSale}
                disabled={paidAmount <= 0}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 inline mr-1" />
                {paidAmount >= total ? 'Completar Venta' : 'Pago Parcial'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Sale Dialog */}
      <Dialog open={showQuickSale} onOpenChange={setShowQuickSale}>
        <DialogContent className="max-w-lg bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Venta Rápida</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            {quickAccessItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  addToCart({
                    type: 'accessory',
                    description: item.description,
                    quantity: 1,
                    unitPrice: item.price,
                  });
                  setShowQuickSale(false);
                }}
                className="p-4 bg-[#0D0F12] border border-[#2D3748] rounded-lg hover:border-[#39FF14] transition-colors text-left"
              >
                <p className="text-white font-medium">{item.description}</p>
                <p className="text-[#39FF14] font-mono mt-1">${item.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
