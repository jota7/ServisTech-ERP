import { useState } from 'react';
import { useCashRegisterStore, useInvoiceStore, useStoreStore, useBCVRateStore } from '@/store';
import type { CashRegister, PettyCashExpense } from '@/types';
import {
  DollarSign,
  Lock,
  Unlock,
  Camera,
  Plus,
  AlertTriangle,
  CheckCircle,
  Receipt,
  TrendingDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function CierreCaja() {
  const { registers, currentRegister, openRegister, closeRegister, addExpense } = useCashRegisterStore();
  const { invoices } = useInvoiceStore();
  const { currentStore } = useStoreStore();
  const { currentRate } = useBCVRateStore();

  const [showOpenRegister, setShowOpenRegister] = useState(false);
  const [showCloseRegister, setShowCloseRegister] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [blindMode, setBlindMode] = useState(true);

  // Open register form
  const [openingUSD, setOpeningUSD] = useState('');
  const [openingVES, setOpeningVES] = useState('');

  // Close register form
  const [declaredUSD, setDeclaredUSD] = useState('');
  const [declaredVES, setDeclaredVES] = useState('');

  // Expense form
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCurrency, setExpenseCurrency] = useState<'USD' | 'VES'>('USD');

  const storeRegisters = registers.filter((r) => r.storeId === currentStore?.id);
  const todayInvoices = invoices.filter(
    (i) =>
      i.storeId === currentStore?.id &&
      i.createdAt.toDateString() === new Date().toDateString()
  );

  const todayRevenue = todayInvoices.reduce((sum, i) => sum + i.total, 0);

  const handleOpenRegister = () => {
    const newRegister: CashRegister = {
      id: `cr-${Date.now()}`,
      storeId: currentStore?.id || 's1',
      openedBy: 'u3',
      openedAt: new Date(),
      openingUSD: parseFloat(openingUSD) || 0,
      openingVES: parseFloat(openingVES) || 0,
      systemUSD: parseFloat(openingUSD) || 0,
      systemVES: parseFloat(openingVES) || 0,
      expenses: [],
      status: 'open',
    };
    openRegister(newRegister);
    setShowOpenRegister(false);
    setOpeningUSD('');
    setOpeningVES('');
  };

  const handleCloseRegister = () => {
    if (!currentRegister) return;

    const declaredUSDNum = parseFloat(declaredUSD) || 0;
    const declaredVESNum = parseFloat(declaredVES) || 0;
    const discrepancyUSD = declaredUSDNum - currentRegister.systemUSD;
    const discrepancyVES = declaredVESNum - currentRegister.systemVES;

    closeRegister(currentRegister.id, {
      declaredUSD: declaredUSDNum,
      declaredVES: declaredVESNum,
      discrepancyUSD,
      discrepancyVES,
      closedBy: 'u3',
    });

    setShowCloseRegister(false);
    setDeclaredUSD('');
    setDeclaredVES('');
  };

  const handleAddExpense = () => {
    if (!currentRegister) return;

    const expense: PettyCashExpense = {
      id: `exp-${Date.now()}`,
      description: expenseDescription,
      amount: parseFloat(expenseAmount) || 0,
      currency: expenseCurrency,
      category: 'Gasto Operativo',
      createdBy: 'u3',
      createdAt: new Date(),
    };

    addExpense(currentRegister.id, expense);
    setShowAddExpense(false);
    setExpenseDescription('');
    setExpenseAmount('');
  };

  const getPaymentMethodBreakdown = () => {
    const breakdown: Record<string, number> = {};
    todayInvoices.forEach((inv) => {
      inv.payments.forEach((pay) => {
        breakdown[pay.method] = (breakdown[pay.method] || 0) + pay.amount;
      });
    });
    return breakdown;
  };

  const paymentBreakdown = getPaymentMethodBreakdown();

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Cierre de Caja</h1>
          <p className="text-[#A0AEC0] mt-1">Control de efectivo y gastos</p>
        </div>
        <div className="flex items-center gap-3">
          {!currentRegister ? (
            <button onClick={() => setShowOpenRegister(true)} className="btn-primary flex items-center gap-2">
              <Unlock className="w-4 h-4" />
              Abrir Caja
            </button>
          ) : (
            <>
              <button onClick={() => setShowAddExpense(true)} className="btn-secondary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Gasto
              </button>
              <button onClick={() => setShowCloseRegister(true)} className="btn-primary flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Cerrar Caja
              </button>
            </>
          )}
        </div>
      </div>

      {/* Current Register Status */}
      {currentRegister ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cash Summary */}
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#39FF14]" />
                Efectivo en Caja
              </h3>
              <span className="badge-success">Abierta</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#A0AEC0]">Apertura USD</span>
                <span className="text-white font-mono">${currentRegister.openingUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#A0AEC0]">Ventas Efectivo</span>
                <span className="text-[#39FF14] font-mono">
                  +${(paymentBreakdown['cash-usd'] || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#A0AEC0]">Gastos</span>
                <span className="text-[#FF4D4D] font-mono">
                  -${currentRegister.expenses
                    .filter((e) => e.currency === 'USD')
                    .reduce((sum, e) => sum + e.amount, 0)
                    .toFixed(2)}
                </span>
              </div>
              <div className="border-t border-[#2D3748] pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Total Sistema</span>
                  <span className="text-[#39FF14] font-mono font-bold text-lg">
                    ${currentRegister.systemUSD.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Sales */}
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#00B2FF]" />
                Ventas del Día
              </h3>
              <span className="text-sm text-[#A0AEC0]">{todayInvoices.length} facturas</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#A0AEC0]">Total Ventas</span>
                <span className="text-[#39FF14] font-mono font-bold text-lg">
                  ${todayRevenue.toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-[#A0AEC0]">
                Bs. {currentRate ? (todayRevenue * currentRate.rate).toFixed(2) : '0.00'}
              </div>

              <div className="border-t border-[#2D3748] pt-3 mt-3">
                <p className="text-sm text-[#A0AEC0] mb-2">Desglose por método:</p>
                {Object.entries(paymentBreakdown).map(([method, amount]) => (
                  <div key={method} className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">
                      {method === 'zelle'
                        ? 'Zelle'
                        : method === 'cash-usd'
                        ? 'Efectivo USD'
                        : method === 'cash-ves'
                        ? 'Efectivo Bs'
                        : method === 'pago-movil'
                        ? 'Pago Móvil'
                        : method === 'binance'
                        ? 'Binance'
                        : 'Transferencia'}
                    </span>
                    <span className="text-white font-mono">${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-[#FF4D4D]" />
                Gastos (Petty Cash)
              </h3>
              <span className="text-sm text-[#A0AEC0]">{currentRegister.expenses.length} registros</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-dark">
              {currentRegister.expenses.length === 0 ? (
                <p className="text-[#6B7280] text-sm text-center py-4">Sin gastos registrados</p>
              ) : (
                currentRegister.expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-2 bg-[#0D0F12] rounded">
                    <div>
                      <p className="text-white text-sm">{expense.description}</p>
                      <p className="text-xs text-[#6B7280]">
                        {expense.createdAt.toLocaleTimeString('es-VE')}
                      </p>
                    </div>
                    <span className="text-[#FF4D4D] font-mono text-sm">
                      {expense.currency === 'USD' ? '$' : 'Bs.'}
                      {expense.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[rgba(255,176,32,0.1)] border border-[#FFB020]/30 rounded-lg p-6 text-center">
          <Lock className="w-12 h-12 text-[#FFB020] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Caja Cerrada</h3>
          <p className="text-[#A0AEC0] mb-4">La caja de {currentStore?.name} está cerrada</p>
          <button onClick={() => setShowOpenRegister(true)} className="btn-primary">
            <Unlock className="w-4 h-4 inline mr-1" />
            Abrir Caja Ahora
          </button>
        </div>
      )}

      {/* Register History */}
      <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg">
        <div className="p-4 border-b border-[#2D3748]">
          <h3 className="text-lg font-semibold text-white">Historial de Cajas</h3>
        </div>
        <table className="table-servistech">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Apertura</th>
              <th>Cierre</th>
              <th>Declarado</th>
              <th>Sistema</th>
              <th>Discrepancia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {storeRegisters.slice(0, 10).map((register) => (
              <tr key={register.id}>
                <td>
                  <span className="text-white text-sm">
                    {register.openedAt.toLocaleDateString('es-VE')}
                  </span>
                </td>
                <td>
                  <span className="text-[#A0AEC0] text-sm">
                    ${register.openingUSD.toFixed(2)}
                  </span>
                </td>
                <td>
                  <span className="text-[#A0AEC0] text-sm">
                    {register.closedAt
                      ? register.closedAt.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </span>
                </td>
                <td>
                  <span className="text-white text-sm font-mono">
                    {register.declaredUSD !== undefined
                      ? `$${register.declaredUSD.toFixed(2)}`
                      : '-'}
                  </span>
                </td>
                <td>
                  <span className="text-[#39FF14] text-sm font-mono">
                    ${register.systemUSD.toFixed(2)}
                  </span>
                </td>
                <td>
                  {register.discrepancyUSD !== undefined && register.discrepancyUSD !== 0 ? (
                    <span
                      className={`text-sm font-mono ${
                        register.discrepancyUSD < 0 ? 'text-[#FF4D4D]' : 'text-[#FFB020]'
                      }`}
                    >
                      {register.discrepancyUSD > 0 ? '+' : ''}
                      ${register.discrepancyUSD.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[#39FF14] text-sm flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      OK
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      register.status === 'open'
                        ? 'bg-[rgba(57,255,20,0.15)] text-[#39FF14]'
                        : register.status === 'discrepancy'
                        ? 'bg-[rgba(255,77,77,0.15)] text-[#FF4D4D]'
                        : 'bg-[rgba(0,178,255,0.15)] text-[#00B2FF]'
                    }`}
                  >
                    {register.status === 'open' ? 'Abierta' : register.status === 'discrepancy' ? 'Discrepancia' : 'Cerrada'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Open Register Dialog */}
      <Dialog open={showOpenRegister} onOpenChange={setShowOpenRegister}>
        <DialogContent className="max-w-md bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Unlock className="w-6 h-6 text-[#39FF14]" />
              Abrir Caja
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Efectivo USD en Caja</label>
              <input
                type="number"
                value={openingUSD}
                onChange={(e) => setOpeningUSD(e.target.value)}
                className="input-servistech w-full"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Efectivo Bs en Caja</label>
              <input
                type="number"
                value={openingVES}
                onChange={(e) => setOpeningVES(e.target.value)}
                className="input-servistech w-full"
                placeholder="0.00"
              />
            </div>
            <div className="bg-[#0D0F12] rounded-lg p-3">
              <p className="text-sm text-[#A0AEC0]">
                <AlertTriangle className="w-4 h-4 inline mr-1 text-[#FFB020]" />
                Verifique el efectivo antes de abrir la caja
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowOpenRegister(false)} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={handleOpenRegister} className="btn-primary">
              <Unlock className="w-4 h-4 inline mr-1" />
              Abrir Caja
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Register Dialog */}
      <Dialog open={showCloseRegister} onOpenChange={setShowCloseRegister}>
        <DialogContent className="max-w-md bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Lock className="w-6 h-6 text-[#39FF14]" />
              Cerrar Caja
            </DialogTitle>
          </DialogHeader>

          {/* Blind Mode Toggle */}
          <div className="flex items-center justify-between bg-[#0D0F12] rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              {blindMode ? <EyeOff className="w-4 h-4 text-[#FFB020]" /> : <Eye className="w-4 h-4 text-[#39FF14]" />}
              <span className="text-sm text-white">Cierre Ciego</span>
            </div>
            <button
              onClick={() => setBlindMode(!blindMode)}
              className={`w-12 h-6 rounded-full transition-colors ${
                blindMode ? 'bg-[#FFB020]' : 'bg-[#39FF14]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  blindMode ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {!blindMode && currentRegister && (
            <div className="bg-[#0D0F12] rounded-lg p-3 mb-4">
              <p className="text-sm text-[#A0AEC0]">Total según sistema:</p>
              <p className="text-lg font-mono text-[#39FF14]">${currentRegister.systemUSD.toFixed(2)}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Efectivo USD Declarado</label>
              <input
                type="number"
                value={declaredUSD}
                onChange={(e) => setDeclaredUSD(e.target.value)}
                className="input-servistech w-full"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Efectivo Bs Declarado</label>
              <input
                type="number"
                value={declaredVES}
                onChange={(e) => setDeclaredVES(e.target.value)}
                className="input-servistech w-full"
                placeholder="0.00"
              />
            </div>
          </div>

          {currentRegister && declaredUSD && (
            <div className="bg-[#0D0F12] rounded-lg p-3 mt-4">
              <p className="text-sm text-[#A0AEC0]">Discrepancia estimada:</p>
              <p
                className={`text-lg font-mono ${
                  (parseFloat(declaredUSD) || 0) - currentRegister.systemUSD === 0
                    ? 'text-[#39FF14]'
                    : 'text-[#FF4D4D]'
                }`}
              >
                ${((parseFloat(declaredUSD) || 0) - currentRegister.systemUSD).toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowCloseRegister(false)} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={handleCloseRegister} className="btn-primary">
              <Lock className="w-4 h-4 inline mr-1" />
              Cerrar Caja
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="max-w-md bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-6 h-6 text-[#FF4D4D]" />
              Registrar Gasto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Descripción</label>
              <input
                type="text"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                className="input-servistech w-full"
                placeholder="Ej: Compra de material de limpieza"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Monto</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="input-servistech w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Moneda</label>
                <select
                  value={expenseCurrency}
                  onChange={(e) => setExpenseCurrency(e.target.value as 'USD' | 'VES')}
                  className="input-servistech w-full"
                >
                  <option value="USD">USD</option>
                  <option value="VES">VES</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Foto del Soporte</label>
              <div className="border-2 border-dashed border-[#2D3748] rounded-lg p-6 text-center cursor-pointer hover:border-[#39FF14] transition-colors">
                <Camera className="w-8 h-8 text-[#6B7280] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Click para subir foto</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowAddExpense(false)} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={handleAddExpense} className="btn-primary">
              <Plus className="w-4 h-4 inline mr-1" />
              Registrar Gasto
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
