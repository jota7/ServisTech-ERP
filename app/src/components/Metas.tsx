import { useState } from 'react';
import {
  Target,
  TrendingUp,
  DollarSign,
  Plus,
  Home,
  Users,
  Zap,
  Wrench,
  Package,
  AlertTriangle,
  CheckCircle,
  Calculator,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  isRecurring: boolean;
  dayOfMonth?: number;
}

interface DailyTarget {
  date: string;
  targetAmount: number;
  actualAmount: number;
  fixedExpenses: number;
  pettyCashTotal: number;
  netTarget: number;
  isMet: boolean;
}

const expenseCategories = [
  { id: 'ALQUILER', label: 'Alquiler', icon: Home, color: '#FF4D4D' },
  { id: 'NOMINA', label: 'Nómina', icon: Users, color: '#00B2FF' },
  { id: 'SERVICIOS', label: 'Servicios', icon: Zap, color: '#FFB020' },
  { id: 'SUMINISTROS', label: 'Suministros', icon: Package, color: '#39FF14' },
  { id: 'MANTENIMIENTO', label: 'Mantenimiento', icon: Wrench, color: '#A855F7' },
  { id: 'OTROS', label: 'Otros', icon: DollarSign, color: '#6B7280' },
];

export function Metas() {
  const [showNewExpense, setShowNewExpense] = useState(false);
  
  // Mock fixed expenses
  const fixedExpenses: FixedExpense[] = [
    { id: '1', name: 'Alquiler Local', amount: 500, category: 'ALQUILER', isRecurring: true, dayOfMonth: 1 },
    { id: '2', name: 'Nómina Fija', amount: 1200, category: 'NOMINA', isRecurring: true, dayOfMonth: 15 },
    { id: '3', name: 'Electricidad', amount: 150, category: 'SERVICIOS', isRecurring: true },
    { id: '4', name: 'Internet', amount: 50, category: 'SERVICIOS', isRecurring: true },
  ];

  // Mock daily targets
  const dailyTargets: DailyTarget[] = [
    { date: '2024-01-15', targetAmount: 350, actualAmount: 420, fixedExpenses: 65, pettyCashTotal: 25, netTarget: 260, isMet: true },
    { date: '2024-01-16', targetAmount: 350, actualAmount: 280, fixedExpenses: 65, pettyCashTotal: 30, netTarget: 255, isMet: false },
    { date: '2024-01-17', targetAmount: 350, actualAmount: 510, fixedExpenses: 65, pettyCashTotal: 15, netTarget: 270, isMet: true },
    { date: '2024-01-18', targetAmount: 350, actualAmount: 390, fixedExpenses: 65, pettyCashTotal: 20, netTarget: 265, isMet: true },
    { date: '2024-01-19', targetAmount: 350, actualAmount: 220, fixedExpenses: 65, pettyCashTotal: 35, netTarget: 250, isMet: false },
    { date: '2024-01-20', targetAmount: 350, actualAmount: 480, fixedExpenses: 65, pettyCashTotal: 10, netTarget: 275, isMet: true },
    { date: '2024-01-21', targetAmount: 350, actualAmount: 310, fixedExpenses: 65, pettyCashTotal: 28, netTarget: 257, isMet: true },
  ];

  // Calculations
  const totalMonthlyExpenses = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const dailyFixedExpenses = totalMonthlyExpenses / 30;
  
  const totalActual = dailyTargets.reduce((sum, t) => sum + t.actualAmount, 0);
  const daysMet = dailyTargets.filter(t => t.isMet).length;
  const completionRate = (daysMet / dailyTargets.length) * 100;
  
  const averageDailySales = totalActual / dailyTargets.length;
  const projectedMonthly = averageDailySales * 30;
  const projectedProfit = projectedMonthly - totalMonthlyExpenses;

  const getCategoryInfo = (categoryId: string) => {
    return expenseCategories.find(c => c.id === categoryId) || expenseCategories[5];
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-[#39FF14]" />
            Metas y Gastos Fijos
          </h1>
          <p className="text-[#A0AEC0] mt-1">Punto de equilibrio y seguimiento financiero</p>
        </div>
        <button 
          onClick={() => setShowNewExpense(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Gasto Fijo
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">Gastos Fijos/Mes</p>
          <p className="text-2xl font-bold text-[#FF4D4D]">${totalMonthlyExpenses.toFixed(0)}</p>
          <p className="text-xs text-[#6B7280]">~${dailyFixedExpenses.toFixed(0)}/día</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">Meta Diaria</p>
          <p className="text-2xl font-bold text-white">${dailyTargets[0]?.targetAmount || 350}</p>
          <p className="text-xs text-[#6B7280]">Para punto de equilibrio</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">Promedio Ventas/Día</p>
          <p className="text-2xl font-bold text-[#00B2FF]">${averageDailySales.toFixed(0)}</p>
          <p className="text-xs text-[#6B7280]">{completionRate.toFixed(0)}% días meta alcanzada</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#39FF14]/30 rounded-lg p-4">
          <p className="text-sm text-[#39FF14]">Proyección Ganancia</p>
          <p className="text-2xl font-bold text-[#39FF14]">${projectedProfit.toFixed(0)}</p>
          <p className="text-xs text-[#6B7280]">Este mes estimado</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fixed Expenses */}
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#FF4D4D]" />
            Gastos Fijos
          </h3>
          
          <div className="space-y-3">
            {fixedExpenses.map((expense) => {
              const category = getCategoryInfo(expense.category);
              const Icon = category.icon;
              
              return (
                <div key={expense.id} className="bg-[#0D0F12] rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: category.color }} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{expense.name}</p>
                      <p className="text-xs text-[#6B7280]">
                        {category.label} {expense.isRecurring && `• Día ${expense.dayOfMonth || 'variable'}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-white font-medium">${expense.amount}</span>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t border-[#2D3748]">
            <div className="flex justify-between items-center">
              <span className="text-[#A0AEC0]">Total Mensual:</span>
              <span className="text-xl font-bold text-[#FF4D4D]">${totalMonthlyExpenses.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Daily Performance */}
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#39FF14]" />
            Rendimiento Diario
          </h3>
          
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-dark">
            {dailyTargets.map((day) => (
              <div key={day.date} className="bg-[#0D0F12] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#A0AEC0]">
                    {new Date(day.date).toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric' })}
                  </span>
                  {day.isMet ? (
                    <CheckCircle className="w-4 h-4 text-[#39FF14]" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-[#FFB020]" />
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#6B7280]">Meta: ${day.netTarget}</span>
                      <span className={day.actualAmount >= day.netTarget ? 'text-[#39FF14]' : 'text-[#FFB020]'}>
                        ${day.actualAmount}
                      </span>
                    </div>
                    <div className="h-2 bg-[#2D3748] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          day.actualAmount >= day.netTarget ? 'bg-[#39FF14]' : 'bg-[#FFB020]'
                        }`}
                        style={{ width: `${Math.min(100, (day.actualAmount / day.netTarget) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-[#6B7280]">Gastos: ${day.fixedExpenses + day.pettyCashTotal}</span>
                  <span className="text-[#6B7280]">Neto: ${day.netTarget}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Break-even Analysis */}
      <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#00B2FF]" />
          Análisis de Punto de Equilibrio
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0D0F12] rounded-lg p-4">
            <p className="text-sm text-[#A0AEC0] mb-2">Fórmula de Cálculo</p>
            <div className="text-sm text-white space-y-1">
              <p>Meta Diaria = Gastos Fijos / (1 - Margen Deseado)</p>
              <p className="text-[#6B7280] text-xs mt-2">
                Margen objetivo: 30%
              </p>
            </div>
          </div>
          
          <div className="bg-[#0D0F12] rounded-lg p-4">
            <p className="text-sm text-[#A0AEC0] mb-2">Cálculo Actual</p>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Gastos fijos diarios:</span>
                <span className="text-white">${dailyFixedExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Margen (30%):</span>
                <span className="text-white">0.30</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#2D3748]">
                <span className="text-[#39FF14]">Meta requerida:</span>
                <span className="text-[#39FF14] font-bold">
                  ${(dailyFixedExpenses / 0.7).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#0D0F12] rounded-lg p-4">
            <p className="text-sm text-[#A0AEC0] mb-2">Proyección Mensual</p>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Ventas estimadas:</span>
                <span className="text-white">${projectedMonthly.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Gastos fijos:</span>
                <span className="text-[#FF4D4D]">-${totalMonthlyExpenses}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#2D3748]">
                <span className="text-[#39FF14]">Ganancia estimada:</span>
                <span className={`font-bold ${projectedProfit >= 0 ? 'text-[#39FF14]' : 'text-[#FF4D4D]'}`}>
                  ${projectedProfit.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Expense Dialog */}
      <Dialog open={showNewExpense} onOpenChange={setShowNewExpense}>
        <DialogContent className="max-w-lg bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-6 h-6 text-[#39FF14]" />
              Nuevo Gasto Fijo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Nombre</label>
              <input 
                type="text" 
                className="input-servistech w-full"
                placeholder="Ej: Alquiler Local"
              />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Categoría</label>
              <div className="grid grid-cols-3 gap-2">
                {expenseCategories.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      className="p-2 rounded-lg border border-[#2D3748] hover:border-[#39FF14] transition-colors flex flex-col items-center gap-1"
                    >
                      <Icon className="w-4 h-4" style={{ color: cat.color }} />
                      <span className="text-xs text-[#A0AEC0]">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Monto ($)</label>
                <input 
                  type="number" 
                  className="input-servistech w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Día de cobro</label>
                <input 
                  type="number" 
                  className="input-servistech w-full"
                  placeholder="1-31"
                  min="1"
                  max="31"
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-[#2D3748]" defaultChecked />
              <span className="text-sm text-[#A0AEC0]">Gasto recurrente mensual</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowNewExpense(false)} className="btn-ghost">
              Cancelar
            </button>
            <button className="btn-primary">
              <Plus className="w-4 h-4 inline mr-1" />
              Agregar Gasto
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
