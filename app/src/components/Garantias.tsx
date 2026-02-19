import { useState } from 'react';
import { useServiceOrderStore } from '@/store';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  Search,
  User,
  Wrench,
  FileText,
  Clock,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const warrantyCauses = [
  { id: 'ERROR_HUMANO', label: 'Error Humano', color: '#FF4D4D', icon: User },
  { id: 'REPUESTO_DEFECTUOSO', label: 'Repuesto Defectuoso', color: '#FFB020', icon: Wrench },
  { id: 'FALLA_REINCIDENTE', label: 'Falla Reincidente', color: '#00B2FF', icon: AlertTriangle },
  { id: 'DAÑO_USUARIO', label: 'Daño del Usuario', color: '#6B7280', icon: X },
  { id: 'OTRO', label: 'Otro', color: '#A0AEC0', icon: FileText },
];

const warrantyStatuses = [
  { id: 'PENDIENTE', label: 'Pendiente', color: '#FFB020' },
  { id: 'APROBADA', label: 'Aprobada', color: '#39FF14' },
  { id: 'RECHAZADA', label: 'Rechazada', color: '#FF4D4D' },
  { id: 'EN_REPARACION', label: 'En Reparación', color: '#00B2FF' },
  { id: 'COMPLETADA', label: 'Completada', color: '#39FF14' },
];

export function Garantias() {
  const { orders } = useServiceOrderStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCause, setSelectedCause] = useState<string>('');
  const [showNewWarranty, setShowNewWarranty] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [showDetail, setShowDetail] = useState(false);

  // Mock warranties
  const warranties = orders
    .filter(o => o.status === 'garantia' || o.warrantyId)
    .map(o => ({
      id: o.warrantyId || `w-${o.id}`,
      warrantyNumber: `G-${o.orderNumber}`,
      originalOrder: o,
      status: o.warrantyStatus || 'PENDIENTE',
      cause: o.warrantyCause || 'ERROR_HUMANO',
      causeNotes: o.warrantyNotes || '',
      createdAt: o.warrantyDate || o.createdAt,
      isHumanError: o.warrantyCause === 'ERROR_HUMANO',
    }));

  const filteredWarranties = warranties.filter(w => {
    const matchesSearch = 
      w.warrantyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.originalOrder.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.originalOrder.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = !selectedStatus || w.status === selectedStatus;
    const matchesCause = !selectedCause || w.cause === selectedCause;
    
    return matchesSearch && matchesStatus && matchesCause;
  });

  const stats = {
    total: warranties.length,
    pending: warranties.filter(w => w.status === 'PENDIENTE').length,
    inProgress: warranties.filter(w => w.status === 'EN_REPARACION').length,
    completed: warranties.filter(w => w.status === 'COMPLETADA').length,
    humanError: warranties.filter(w => w.cause === 'ERROR_HUMANO').length,
    defectivePart: warranties.filter(w => w.cause === 'REPUESTO_DEFECTUOSO').length,
  };

  const handleCreateWarranty = () => {
    setShowNewWarranty(false);
  };

  const getCauseInfo = (causeId: string) => {
    return warrantyCauses.find(c => c.id === causeId) || warrantyCauses[4];
  };

  const getStatusInfo = (statusId: string) => {
    return warrantyStatuses.find(s => s.id === statusId) || warrantyStatuses[0];
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#39FF14]" />
            Garantías
          </h1>
          <p className="text-[#A0AEC0] mt-1">Gestión de garantías y re-reparaciones</p>
        </div>
        <button 
          onClick={() => setShowNewWarranty(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Nueva Garantía
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">Total Garantías</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">Pendientes</p>
          <p className="text-2xl font-bold text-[#FFB020]">{stats.pending}</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">En Reparación</p>
          <p className="text-2xl font-bold text-[#00B2FF]">{stats.inProgress}</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">Completadas</p>
          <p className="text-2xl font-bold text-[#39FF14]">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-servistech w-full pl-10"
            placeholder="Buscar por número, orden o cliente..."
          />
        </div>
        <select 
          className="input-servistech"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {warrantyStatuses.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <select 
          className="input-servistech"
          value={selectedCause}
          onChange={(e) => setSelectedCause(e.target.value)}
        >
          <option value="">Todas las causas</option>
          {warrantyCauses.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Warranties Table */}
      <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg overflow-hidden">
        <table className="table-servistech">
          <thead>
            <tr>
              <th>N° Garantía</th>
              <th>Orden Original</th>
              <th>Cliente</th>
              <th>Causa</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredWarranties.map((warranty) => {
              const causeInfo = getCauseInfo(warranty.cause);
              const statusInfo = getStatusInfo(warranty.status);
              const CauseIcon = causeInfo.icon;
              
              return (
                <tr key={warranty.id} className={warranty.isHumanError ? 'bg-[rgba(255,77,77,0.05)]' : ''}>
                  <td>
                    <span className="font-mono text-sm text-[#39FF14]">{warranty.warrantyNumber}</span>
                  </td>
                  <td>
                    <span className="text-white text-sm">{warranty.originalOrder.orderNumber}</span>
                  </td>
                  <td>
                    <span className="text-[#A0AEC0] text-sm">{warranty.originalOrder.customerName || 'Cliente'}</span>
                  </td>
                  <td>
                    <div 
                      className="flex items-center gap-2 px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: `${causeInfo.color}20`, color: causeInfo.color }}
                    >
                      <CauseIcon className="w-3 h-3" />
                      {causeInfo.label}
                    </div>
                  </td>
                  <td>
                    <span 
                      className="text-xs px-2 py-1 rounded"
                      style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}
                    >
                      {statusInfo.label}
                    </span>
                  </td>
                  <td>
                    <span className="text-[#A0AEC0] text-sm">
                      {new Date(warranty.createdAt).toLocaleDateString('es-VE')}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => setShowDetail(true)}
                      className="text-[#39FF14] hover:underline text-sm"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Warranty Dialog */}
      <Dialog open={showNewWarranty} onOpenChange={setShowNewWarranty}>
        <DialogContent className="max-w-lg bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#39FF14]" />
              Nueva Garantía
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Orden Original</label>
              <select 
                className="input-servistech w-full"
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value)}
              >
                <option value="">Seleccionar orden...</option>
                {orders
                  .filter(o => o.status === 'entregado')
                  .map(o => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customerName || 'Cliente'}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Causa de la Garantía</label>
              <div className="grid grid-cols-2 gap-2">
                {warrantyCauses.map(cause => {
                  const Icon = cause.icon;
                  return (
                    <button
                      key={cause.id}
                      className="p-3 rounded-lg border border-[#2D3748] hover:border-[#39FF14] transition-colors flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" style={{ color: cause.color }} />
                      <span className="text-sm text-[#A0AEC0]">{cause.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Notas</label>
              <textarea 
                className="input-servistech w-full h-24 resize-none"
                placeholder="Describa el problema de la garantía..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowNewWarranty(false)} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={handleCreateWarranty} className="btn-primary">
              <Shield className="w-4 h-4 inline mr-1" />
              Crear Garantía
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl bg-[#1A1D23] border-[#2D3748] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#39FF14]" />
              Detalle de Garantía
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-[#0D0F12] rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">Historial</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#39FF14] mt-0.5" />
                  <div>
                    <p className="text-sm text-white">Garantía creada</p>
                    <p className="text-xs text-[#6B7280]">
                      {new Date().toLocaleString('es-VE')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn-primary flex-1">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Aprobar
              </button>
              <button className="btn-secondary flex-1">
                <Wrench className="w-4 h-4 inline mr-1" />
                Iniciar Reparación
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
