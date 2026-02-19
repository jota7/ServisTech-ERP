import { useState } from 'react';
import { useLogisticsStore, useServiceOrderStore, useStoreStore } from '@/store';
import type { SafeKit, CourtesyDevice } from '@/types';
import {
  Briefcase,
  Smartphone,
  QrCode,
  CheckCircle,
  User,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Logistica() {
  const { safeKits, courtesyDevices, assignSafeKit, releaseSafeKit, loanCourtesyDevice, returnCourtesyDevice } = useLogisticsStore();
  const { orders } = useServiceOrderStore();
  const { currentStore } = useStoreStore();

  const [activeTab, setActiveTab] = useState('safekits');
  const [showAssignKit, setShowAssignKit] = useState(false);
  const [showLoanDevice, setShowLoanDevice] = useState(false);
  const [selectedKit, setSelectedKit] = useState<SafeKit | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<CourtesyDevice | null>(null);
  const [scanQR, setScanQR] = useState('');

  const storeKits = safeKits.filter((k) => k.storeId === currentStore?.id);
  const storeDevices = courtesyDevices.filter((d) => d.storeId === currentStore?.id);

  const availableKits = storeKits.filter((k) => k.status === 'available');
  const inUseKits = storeKits.filter((k) => k.status === 'in-use');
  const availableDevices = storeDevices.filter((d) => d.status === 'available');
  const loanedDevices = storeDevices.filter((d) => d.status === 'loaned');

  const handleAssignKit = (kitId: string, orderId: string) => {
    assignSafeKit(kitId, orderId);
    setShowAssignKit(false);
  };

  const handleLoanDevice = (deviceId: string, customerId: string, orderId: string) => {
    loanCourtesyDevice(deviceId, {
      customerId,
      orderId,
      loanDate: new Date(),
      expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      condition: 'Buen estado',
    });
    setShowLoanDevice(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Logística VIP</h1>
          <p className="text-[#A0AEC0] mt-1">Safe-Kits y equipos de cortesía</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              value={scanQR}
              onChange={(e) => setScanQR(e.target.value)}
              className="input-servistech pl-10 w-48"
              placeholder="Escanear QR..."
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#A0AEC0] mb-2">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs">Safe-Kits Disponibles</span>
          </div>
          <p className="text-2xl font-bold text-[#39FF14]">{availableKits.length}</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#A0AEC0] mb-2">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs">Safe-Kits en Uso</span>
          </div>
          <p className="text-2xl font-bold text-[#00B2FF]">{inUseKits.length}</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#A0AEC0] mb-2">
            <Smartphone className="w-4 h-4" />
            <span className="text-xs">Equipos Disponibles</span>
          </div>
          <p className="text-2xl font-bold text-[#39FF14]">{availableDevices.length}</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#A0AEC0] mb-2">
            <Smartphone className="w-4 h-4" />
            <span className="text-xs">Equipos Prestados</span>
          </div>
          <p className="text-2xl font-bold text-[#FFB020]">{loanedDevices.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1A1D23] border border-[#2D3748]">
          <TabsTrigger
            value="safekits"
            className="data-[state=active]:bg-[#39FF14] data-[state=active]:text-[#0D0F12]"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Safe-Kits
          </TabsTrigger>
          <TabsTrigger
            value="courtesy"
            className="data-[state=active]:bg-[#39FF14] data-[state=active]:text-[#0D0F12]"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Equipos de Cortesía
          </TabsTrigger>
        </TabsList>

        <TabsContent value="safekits" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Available Kits */}
            {availableKits.map((kit) => (
              <div
                key={kit.id}
                className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4 hover:border-[#39FF14] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#39FF14]/20 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-[#39FF14]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{kit.name}</p>
                      <p className="font-mono text-sm text-[#39FF14]">{kit.code}</p>
                    </div>
                  </div>
                  <span className="badge-success">Disponible</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#A0AEC0] mb-4">
                  <QrCode className="w-4 h-4" />
                  <span className="font-mono">{kit.qrCode}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedKit(kit);
                    setShowAssignKit(true);
                  }}
                  className="btn-primary w-full text-sm py-2"
                >
                  <ArrowRight className="w-4 h-4 inline mr-1" />
                  Asignar a Orden
                </button>
              </div>
            ))}

            {/* In Use Kits */}
            {inUseKits.map((kit) => {
              const assignedOrder = orders.find((o) => o.id === kit.currentOrderId);
              return (
                <div
                  key={kit.id}
                  className="bg-[#1A1D23] border border-[#00B2FF]/50 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#00B2FF]/20 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-[#00B2FF]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{kit.name}</p>
                        <p className="font-mono text-sm text-[#00B2FF]">{kit.code}</p>
                      </div>
                    </div>
                    <span className="badge-info">En Uso</span>
                  </div>
                  <div className="bg-[#0D0F12] rounded-lg p-3 mb-4">
                    <p className="text-sm text-[#A0AEC0]">Asignado a:</p>
                    <p className="text-white font-medium">
                      {assignedOrder?.orderNumber || kit.currentOrderId}
                    </p>
                  </div>
                  <button
                    onClick={() => releaseSafeKit(kit.id)}
                    className="btn-secondary w-full text-sm py-2"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Liberar
                  </button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="courtesy" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Available Devices */}
            {availableDevices.map((device) => (
              <div
                key={device.id}
                className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4 hover:border-[#39FF14] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#39FF14]/20 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-[#39FF14]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {device.brand} {device.model}
                      </p>
                      <p className="font-mono text-sm text-[#39FF14]">{device.serialNumber}</p>
                    </div>
                  </div>
                  <span className="badge-success">Disponible</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedDevice(device);
                    setShowLoanDevice(true);
                  }}
                  className="btn-primary w-full text-sm py-2"
                >
                  <ArrowRight className="w-4 h-4 inline mr-1" />
                  Prestar a Cliente
                </button>
              </div>
            ))}

            {/* Loaned Devices */}
            {loanedDevices.map((device) => (
              <div
                key={device.id}
                className="bg-[#1A1D23] border border-[#FFB020]/50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#FFB020]/20 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-[#FFB020]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {device.brand} {device.model}
                      </p>
                      <p className="font-mono text-sm text-[#FFB020]">{device.serialNumber}</p>
                    </div>
                  </div>
                  <span className="badge-warning">Prestado</span>
                </div>
                {device.currentLoan && (
                  <div className="bg-[#0D0F12] rounded-lg p-3 mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-[#A0AEC0]" />
                      <span className="text-[#A0AEC0]">Cliente: {device.currentLoan.customerId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-[#A0AEC0]" />
                      <span className="text-[#A0AEC0]">
                        Devolución:{' '}
                        {device.currentLoan.expectedReturnDate.toLocaleDateString('es-VE')}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => returnCourtesyDevice(device.id)}
                  className="btn-secondary w-full text-sm py-2"
                >
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Recibir Devolución
                </button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Assign Kit Dialog */}
      <Dialog open={showAssignKit} onOpenChange={setShowAssignKit}>
        <DialogContent className="max-w-md bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-[#39FF14]" />
              Asignar Safe-Kit
            </DialogTitle>
          </DialogHeader>
          {selectedKit && (
            <div className="space-y-4">
              <div className="bg-[#0D0F12] rounded-lg p-4">
                <p className="text-sm text-[#A0AEC0]">Safe-Kit seleccionado:</p>
                <p className="text-white font-medium">{selectedKit.name}</p>
                <p className="font-mono text-sm text-[#39FF14]">{selectedKit.code}</p>
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Seleccionar Orden</label>
                <select className="input-servistech w-full">
                  <option value="">Seleccione una orden...</option>
                  {orders
                    .filter((o) => o.storeId === currentStore?.id && o.status !== 'entregado')
                    .map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderNumber} - {order.reportedIssue.substring(0, 30)}...
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowAssignKit(false)} className="btn-ghost">
                  Cancelar
                </button>
                <button
                  onClick={() => handleAssignKit(selectedKit.id, 'order-id')}
                  className="btn-primary"
                >
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Asignar
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Loan Device Dialog */}
      <Dialog open={showLoanDevice} onOpenChange={setShowLoanDevice}>
        <DialogContent className="max-w-md bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-[#39FF14]" />
              Prestar Equipo de Cortesía
            </DialogTitle>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-4">
              <div className="bg-[#0D0F12] rounded-lg p-4">
                <p className="text-sm text-[#A0AEC0]">Equipo seleccionado:</p>
                <p className="text-white font-medium">
                  {selectedDevice.brand} {selectedDevice.model}
                </p>
                <p className="font-mono text-sm text-[#39FF14]">{selectedDevice.serialNumber}</p>
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Cliente</label>
                <input
                  type="text"
                  className="input-servistech w-full"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Orden de Servicio</label>
                <select className="input-servistech w-full">
                  <option value="">Seleccione una orden...</option>
                  {orders
                    .filter((o) => o.storeId === currentStore?.id && o.status !== 'entregado')
                    .map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderNumber}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Fecha de Devolución</label>
                <input
                  type="date"
                  className="input-servistech w-full"
                  defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowLoanDevice(false)} className="btn-ghost">
                  Cancelar
                </button>
                <button
                  onClick={() => handleLoanDevice(selectedDevice.id, 'customer-id', 'order-id')}
                  className="btn-primary"
                >
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Prestar Equipo
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
