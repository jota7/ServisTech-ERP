import { useState } from 'react';
import { useServiceOrderStore } from '@/store';
import {
  DollarSign,
  User,
  Download,
  AlertTriangle,
  CheckCircle,
  MinusCircle,
  FileText,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Commission {
  id: string;
  technicianId: string;
  technicianName: string;
  role: string;
  orderNumber: string;
  customerName: string;
  grossProfit: number;
  commissionRate: number;
  amount: number;
  flatRateAmount: number;
  totalDebits: number;
  netAmount: number;
  status: 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'DEBITADA';
  periodMonth: number;
  periodYear: number;
  createdAt: Date;
}

export function Comisiones() {
  const { orders } = useServiceOrderStore();
  
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    `${new Date().getMonth() + 1}/${new Date().getFullYear()}`
  );
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [showNewDebit, setShowNewDebit] = useState(false);
  const [showPayroll, setShowPayroll] = useState(false);

  // Mock commissions data
  const commissions: Commission[] = orders
    .filter(o => o.status === 'entregado' && o.technicianId)
    .map((o, i) => {
      const grossProfit = (o.finalCost || 0) * 0.4;
      const isTechnician = o.technicianRole === 'tecnico';
      const commissionRate = isTechnician ? 35 : 10;
      const amount = grossProfit * (commissionRate / 100);
      const flatRate = !isTechnician ? 1 : 0;
      const debits = 0;
      
      return {
        id: `comm-${i}`,
        technicianId: o.technicianId || '',
        technicianName: o.technicianName || 'Técnico',
        role: o.technicianRole || 'tecnico',
        orderNumber: o.orderNumber,
        customerName: o.customerName || 'Cliente',
        grossProfit,
        commissionRate,
        amount,
        flatRateAmount: flatRate,
        totalDebits: debits,
        netAmount: amount + flatRate - debits,
        status: debits > 0 ? 'DEBITADA' : Math.random() > 0.5 ? 'PAGADA' : 'PENDIENTE',
        periodMonth: new Date().getMonth() + 1,
        periodYear: new Date().getFullYear(),
        createdAt: o.completedAt || o.createdAt,
      };
    });

  const filteredCommissions = commissions.filter(c => {
    const periodMatch = `${c.periodMonth}/${c.periodYear}` === selectedPeriod;
    const technicianMatch = !selectedTechnician || c.technicianId === selectedTechnician;
    return periodMatch && technicianMatch;
  });

  // Agrupar por técnico
  const byTechnician = filteredCommissions.reduce((acc, c) => {
    if (!acc[c.technicianId]) {
      acc[c.technicianId] = {
        name: c.technicianName,
        role: c.role,
        commissions: [],
        total: 0,
        debits: 0,
        net: 0,
      };
    }
    acc[c.technicianId].commissions.push(c);
    acc[c.technicianId].total += c.amount + c.flatRateAmount;
    acc[c.technicianId].debits += c.totalDebits;
    acc[c.technicianId].net += c.netAmount;
    return acc;
  }, {} as Record<string, any>);

  // Estadísticas
  const stats = {
    totalCommissions: filteredCommissions.length,
    totalGrossProfit: filteredCommissions.reduce((s, c) => s + c.grossProfit, 0),
    totalAmount: filteredCommissions.reduce((s, c) => s + c.amount + c.flatRateAmount, 0),
    totalDebits: filteredCommissions.reduce((s, c) => s + c.totalDebits, 0),
    netPayable: filteredCommissions.reduce((s, c) => s + c.netAmount, 0),
    paid: filteredCommissions.filter(c => c.status === 'PAGADA').length,
    pending: filteredCommissions.filter(c => c.status === 'PENDIENTE').length,
    withDebits: filteredCommissions.filter(c => c.status === 'DEBITADA').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGADA': return '#39FF14';
      case 'PENDIENTE': return '#FFB020';
      case 'DEBITADA': return '#FF4D4D';
      case 'APROBADA': return '#00B2FF';
      default: return '#6B7280';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#39FF14]" />
            Comisiones
          </h1>
          <p className="text-[#A0AEC0] mt-1">Gestión de comisiones y contra-cargos</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowPayroll(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Reporte Nómina
          </button>
          <button className="btn-primary flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Pagar Comisiones
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">Total Órdenes</p>
          <p className="text-xl font-bold text-white">{stats.totalCommissions}</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">Utilidad Bruta</p>
          <p className="text-xl font-bold text-[#00B2FF]">${stats.totalGrossProfit.toFixed(2)}</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">Comisiones</p>
          <p className="text-xl font-bold text-[#39FF14]">${stats.totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">Débitos</p>
          <p className="text-xl font-bold text-[#FF4D4D]">${stats.totalDebits.toFixed(2)}</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#39FF14]/30 rounded-lg p-4">
          <p className="text-sm text-[#39FF14]">Neto a Pagar</p>
          <p className="text-xl font-bold text-[#39FF14]">${stats.netPayable.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select 
          className="input-servistech"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option value="1/2024">Enero 2024</option>
          <option value="2/2024">Febrero 2024</option>
          <option value="3/2024">Marzo 2024</option>
        </select>
        <select 
          className="input-servistech"
          value={selectedTechnician}
          onChange={(e) => setSelectedTechnician(e.target.value)}
        >
          <option value="">Todos los técnicos</option>
          {Object.values(byTechnician).map((t: any) => (
            <option key={t.name} value={t.name}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Technician Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(byTechnician).map(([id, tech]: [string, any]) => (
          <div key={id} className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#39FF14] to-[#00B2FF] flex items-center justify-center">
                  <User className="w-5 h-5 text-[#0D0F12]" />
                </div>
                <div>
                  <p className="text-white font-medium">{tech.name}</p>
                  <p className="text-xs text-[#A0AEC0]">{tech.role}</p>
                </div>
              </div>
              <span className="text-xs bg-[#39FF14]/20 text-[#39FF14] px-2 py-1 rounded">
                {tech.commissions.length} órdenes
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#A0AEC0]">Comisión:</span>
                <span className="text-white">${tech.total.toFixed(2)}</span>
              </div>
              {tech.debits > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#A0AEC0]">Débitos:</span>
                  <span className="text-[#FF4D4D]">-${tech.debits.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[#2D3748]">
                <span className="text-[#39FF14] font-medium">Neto:</span>
                <span className="text-[#39FF14] font-bold">${tech.net.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setShowNewDebit(true)}
              className="w-full mt-3 text-xs text-[#FF4D4D] hover:text-[#FF4D4D]/80 flex items-center justify-center gap-1"
            >
              <MinusCircle className="w-3 h-3" />
              Registrar Débito
            </button>
          </div>
        ))}
      </div>

      {/* Commissions Table */}
      <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg overflow-hidden">
        <table className="table-servistech">
          <thead>
            <tr>
              <th>Técnico</th>
              <th>Orden</th>
              <th>Utilidad Bruta</th>
              <th>%</th>
              <th>Comisión</th>
              <th>Débitos</th>
              <th>Neto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredCommissions.map((comm) => (
              <tr key={comm.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#A0AEC0]" />
                    <span className="text-white text-sm">{comm.technicianName}</span>
                  </div>
                </td>
                <td>
                  <span className="font-mono text-sm text-[#39FF14]">{comm.orderNumber}</span>
                </td>
                <td>
                  <span className="text-[#A0AEC0] text-sm">${comm.grossProfit.toFixed(2)}</span>
                </td>
                <td>
                  <span className="text-white text-sm">{comm.commissionRate}%</span>
                </td>
                <td>
                  <span className="text-white text-sm">${comm.amount.toFixed(2)}</span>
                  {comm.flatRateAmount > 0 && (
                    <span className="text-xs text-[#39FF14] ml-1">+${comm.flatRateAmount}</span>
                  )}
                </td>
                <td>
                  {comm.totalDebits > 0 ? (
                    <span className="text-[#FF4D4D] text-sm">-${comm.totalDebits.toFixed(2)}</span>
                  ) : (
                    <span className="text-[#6B7280] text-sm">-</span>
                  )}
                </td>
                <td>
                  <span className="text-[#39FF14] font-medium text-sm">${comm.netAmount.toFixed(2)}</span>
                </td>
                <td>
                  <span 
                    className="text-xs px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: `${getStatusColor(comm.status)}20`, 
                      color: getStatusColor(comm.status) 
                    }}
                  >
                    {comm.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Debit Dialog */}
      <Dialog open={showNewDebit} onOpenChange={setShowNewDebit}>
        <DialogContent className="max-w-lg bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#FF4D4D]">
              <MinusCircle className="w-6 h-6" />
              Registrar Contra-cargo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Comisión</label>
              <select className="input-servistech w-full">
                {filteredCommissions.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.technicianName} - {c.orderNumber} (${c.netAmount.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Motivo</label>
              <select className="input-servistech w-full">
                <option value="DANO_ACCIDENTAL">Daño Accidental</option>
                <option value="REPUESTO_ROTO">Repuesto Roto</option>
                <option value="ERROR_REPARACION">Error en Reparación</option>
                <option value="PERDIDA_EQUIPO">Pérdida de Equipo</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Descripción</label>
              <textarea 
                className="input-servistech w-full h-20 resize-none"
                placeholder="Describa el incidente..."
              />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Monto a Debitar ($)</label>
              <input 
                type="number" 
                className="input-servistech w-full"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Evidencia Fotográfica</label>
              <div className="border-2 border-dashed border-[#2D3748] rounded-lg p-4 text-center">
                <AlertTriangle className="w-8 h-8 text-[#6B7280] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Subir fotos del daño/incidente</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowNewDebit(false)} className="btn-ghost">
              Cancelar
            </button>
            <button className="btn-primary bg-[#FF4D4D] hover:bg-[#FF4D4D]/80">
              <MinusCircle className="w-4 h-4 inline mr-1" />
              Registrar Débito
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payroll Report Dialog */}
      <Dialog open={showPayroll} onOpenChange={setShowPayroll}>
        <DialogContent className="max-w-3xl bg-[#1A1D23] border-[#2D3748] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#39FF14]" />
              Reporte de Nómina - {selectedPeriod}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {Object.entries(byTechnician).map(([id, tech]: [string, any]) => (
              <div key={id} className="bg-[#0D0F12] rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#39FF14] to-[#00B2FF] flex items-center justify-center">
                      <User className="w-6 h-6 text-[#0D0F12]" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-lg">{tech.name}</p>
                      <p className="text-sm text-[#A0AEC0]">{tech.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#39FF14]">${tech.net.toFixed(2)}</p>
                    <p className="text-xs text-[#A0AEC0]">Neto a Pagar</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div className="bg-[#1A1D23] rounded p-3">
                    <p className="text-[#A0AEC0]">Órdenes</p>
                    <p className="text-white font-medium">{tech.commissions.length}</p>
                  </div>
                  <div className="bg-[#1A1D23] rounded p-3">
                    <p className="text-[#A0AEC0]">Comisión Total</p>
                    <p className="text-white font-medium">${tech.total.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#1A1D23] rounded p-3">
                    <p className="text-[#A0AEC0]">Débitos</p>
                    <p className="text-[#FF4D4D] font-medium">${tech.debits.toFixed(2)}</p>
                  </div>
                </div>
                
                <button className="w-full btn-secondary text-sm">
                  <Download className="w-4 h-4 inline mr-1" />
                  Descargar Recibo
                </button>
              </div>
            ))}
            
            <div className="border-t border-[#2D3748] pt-4">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Total Nómina:</span>
                <span className="text-2xl font-bold text-[#39FF14]">${stats.netPayable.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
