import { useState } from 'react';
import {
  MapPin,
  Navigation,
  Package,
  CheckCircle,
  Clock,
  Phone,
  User,
  Truck,
  Camera,
  Signature,
  Route,
  ChevronRight,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DeliveryStop {
  id: string;
  orderNumber: string;
  customerName: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'in_transit' | 'arrived' | 'picked_up' | 'delivered';
  scheduledTime: string;
  phone: string;
  deviceModel: string;
  issue: string;
  photos: string[];
  signature?: string;
}

interface Messenger {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isOnline: boolean;
  currentLocation?: { lat: number; lng: number };
  completedToday: number;
  pendingToday: number;
}

export function TrackingMensajeros() {
  const [selectedMessenger, setSelectedMessenger] = useState<string>('');
  const [selectedStop, setSelectedStop] = useState<DeliveryStop | null>(null);
  const [showStopDetail, setShowStopDetail] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Mock mensajeros
  const messengers: Messenger[] = [
    {
      id: 'm1',
      name: 'Carlos Rodríguez',
      phone: '+58 412-123-4567',
      isOnline: true,
      currentLocation: { lat: 10.491, lng: -66.902 },
      completedToday: 8,
      pendingToday: 3,
    },
    {
      id: 'm2',
      name: 'María González',
      phone: '+58 414-987-6543',
      isOnline: true,
      currentLocation: { lat: 10.485, lng: -66.895 },
      completedToday: 5,
      pendingToday: 5,
    },
    {
      id: 'm3',
      name: 'José Pérez',
      phone: '+58 416-555-8888',
      isOnline: false,
      completedToday: 12,
      pendingToday: 0,
    },
  ];

  // Mock rutas de entrega
  const deliveryStops: DeliveryStop[] = [
    {
      id: 'stop-1',
      orderNumber: 'ST-CCS-001A',
      customerName: 'Ana Martínez',
      address: 'Av. Francisco de Miranda, Torre XYZ, Piso 5, Oficina 502',
      latitude: 10.491,
      longitude: -66.902,
      status: 'picked_up',
      scheduledTime: '09:00 AM',
      phone: '+58 412-111-2222',
      deviceModel: 'iPhone 14 Pro Max',
      issue: 'Pantalla rota, no enciende',
      photos: [],
    },
    {
      id: 'stop-2',
      orderNumber: 'ST-CCS-002B',
      customerName: 'Luis Hernández',
      address: 'Calle Los Palos Grandes, Residencias Santa Rosa, Apto 12B',
      latitude: 10.488,
      longitude: -66.898,
      status: 'in_transit',
      scheduledTime: '10:30 AM',
      phone: '+58 414-333-4444',
      deviceModel: 'Samsung S23 Ultra',
      issue: 'No carga, puerto dañado',
      photos: [],
    },
    {
      id: 'stop-3',
      orderNumber: 'ST-CCS-003C',
      customerName: 'Carmen Díaz',
      address: 'Av. Libertador, Centro Comercial Sambil, Nivel Feria, Local 45',
      latitude: 10.495,
      longitude: -66.905,
      status: 'pending',
      scheduledTime: '11:45 AM',
      phone: '+58 416-555-6666',
      deviceModel: 'iPad Pro 12.9"',
      issue: 'Touch no responde en ciertas áreas',
      photos: [],
    },
    {
      id: 'stop-4',
      orderNumber: 'ST-CCS-004D',
      customerName: 'Roberto Silva',
      address: 'Urb. Las Mercedes, Calle Madrid, Casa 23',
      latitude: 10.480,
      longitude: -66.890,
      status: 'pending',
      scheduledTime: '01:00 PM',
      phone: '+58 412-777-8888',
      deviceModel: 'Xiaomi 13 Pro',
      issue: 'Cámara trasaria borrosa',
      photos: [],
    },
  ];

  const currentMessenger = messengers.find(m => m.id === selectedMessenger) || messengers[0];

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'picked_up':
        return { label: 'Recolectado', color: '#39FF14', icon: CheckCircle };
      case 'in_transit':
        return { label: 'En Camino', color: '#00B2FF', icon: Navigation };
      case 'arrived':
        return { label: 'Llegó', color: '#FFB020', icon: MapPin };
      case 'delivered':
        return { label: 'Entregado', color: '#39FF14', icon: Package };
      default:
        return { label: 'Pendiente', color: '#6B7280', icon: Clock };
    }
  };

  const handleUpdateStatus = (stopId: string, newStatus: string) => {
    // Aquí iría la lógica para actualizar el estado
    console.log(`Actualizando stop ${stopId} a ${newStatus}`);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#39FF14]" />
            Tracking de Mensajeros
          </h1>
          <p className="text-[#A0AEC0] mt-1">Seguimiento en tiempo real de rutas de entrega</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            className="btn-secondary flex items-center gap-2"
          >
            {viewMode === 'list' ? <MapPin className="w-4 h-4" /> : <Route className="w-4 h-4" />}
            {viewMode === 'list' ? 'Ver Mapa' : 'Ver Lista'}
          </button>
        </div>
      </div>

      {/* Messenger Selection */}
      <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
        <p className="text-sm text-[#A0AEC0] mb-3">Seleccionar Mensajero</p>
        <div className="flex flex-wrap gap-3">
          {messengers.map((messenger) => (
            <button
              key={messenger.id}
              onClick={() => setSelectedMessenger(messenger.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                selectedMessenger === messenger.id || (selectedMessenger === '' && messenger.id === 'm1')
                  ? 'border-[#39FF14] bg-[rgba(57,255,20,0.1)]'
                  : 'border-[#2D3748] hover:border-[#39FF14]/50'
              }`}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#39FF14] to-[#00B2FF] flex items-center justify-center">
                  <User className="w-5 h-5 text-[#0D0F12]" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1A1D23] ${
                  messenger.isOnline ? 'bg-[#39FF14]' : 'bg-[#6B7280]'
                }`}>
                  {messenger.isOnline ? <Wifi className="w-2.5 h-2.5 text-[#0D0F12] m-auto" /> : <WifiOff className="w-2.5 h-2.5 text-white m-auto" />}
                </div>
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-medium">{messenger.name}</p>
                <p className="text-xs text-[#6B7280]">
                  {messenger.completedToday} completadas • {messenger.pendingToday} pendientes
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">Ruta de Hoy</p>
          <p className="text-2xl font-bold text-white">{deliveryStops.length}</p>
          <p className="text-xs text-[#6B7280]">paradas</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">Completadas</p>
          <p className="text-2xl font-bold text-[#39FF14]">{deliveryStops.filter(s => s.status === 'picked_up').length}</p>
          <p className="text-xs text-[#6B7280]">recolectadas</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">En Camino</p>
          <p className="text-2xl font-bold text-[#00B2FF]">{deliveryStops.filter(s => s.status === 'in_transit').length}</p>
          <p className="text-xs text-[#6B7280]">activas</p>
        </div>
        <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
          <p className="text-sm text-[#A0AEC0]">Pendientes</p>
          <p className="text-2xl font-bold text-[#FFB020]">{deliveryStops.filter(s => s.status === 'pending').length}</p>
          <p className="text-xs text-[#6B7280]">por visitar</p>
        </div>
      </div>

      {/* Delivery Stops */}
      <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#2D3748]">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Route className="w-5 h-5 text-[#39FF14]" />
            Ruta del Día - {currentMessenger.name}
          </h3>
        </div>
        
        <div className="divide-y divide-[#2D3748]">
          {deliveryStops.map((stop, index) => {
            const statusInfo = getStatusInfo(stop.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div 
                key={stop.id} 
                className={`p-4 hover:bg-[#0D0F12] transition-colors ${
                  stop.status === 'in_transit' ? 'bg-[rgba(0,178,255,0.05)]' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Stop Number */}
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ 
                        backgroundColor: `${statusInfo.color}20`, 
                        color: statusInfo.color 
                      }}
                    >
                      {index + 1}
                    </div>
                    {index < deliveryStops.length - 1 && (
                      <div className="w-0.5 h-12 bg-[#2D3748] my-1" />
                    )}
                  </div>

                  {/* Stop Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-[#39FF14]">{stop.orderNumber}</span>
                          <span 
                            className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                            style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <h4 className="text-white font-medium">{stop.customerName}</h4>
                        <p className="text-sm text-[#A0AEC0] mt-1">{stop.address}</p>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-[#6B7280] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {stop.scheduledTime}
                          </span>
                          <span className="text-[#6B7280] flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {stop.phone}
                          </span>
                        </div>

                        <div className="mt-3 p-2 bg-[#0D0F12] rounded-lg">
                          <p className="text-xs text-[#6B7280]">Equipo: <span className="text-white">{stop.deviceModel}</span></p>
                          <p className="text-xs text-[#6B7280]">Problema: <span className="text-white">{stop.issue}</span></p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => {
                            setSelectedStop(stop);
                            setShowStopDetail(true);
                          }}
                          className="p-2 hover:bg-white/10 rounded text-[#A0AEC0] hover:text-white"
                          title="Ver detalle"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        
                        {stop.status === 'pending' && (
                          <button 
                            onClick={() => handleUpdateStatus(stop.id, 'in_transit')}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            <Navigation className="w-3 h-3 inline mr-1" />
                            Iniciar
                          </button>
                        )}
                        
                        {stop.status === 'in_transit' && (
                          <button 
                            onClick={() => handleUpdateStatus(stop.id, 'picked_up')}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            <Camera className="w-3 h-3 inline mr-1" />
                            Recolectar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stop Detail Dialog */}
      <Dialog open={showStopDetail} onOpenChange={setShowStopDetail}>
        <DialogContent className="max-w-lg bg-[#1A1D23] border-[#2D3748] text-white">
          {selectedStop && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Package className="w-6 h-6 text-[#39FF14]" />
                  Detalle de Recolección
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-[#0D0F12] rounded-lg p-4">
                  <p className="text-sm text-[#6B7280]">Orden</p>
                  <p className="text-lg font-mono text-[#39FF14]">{selectedStop.orderNumber}</p>
                </div>

                <div>
                  <p className="text-sm text-[#A0AEC0] mb-1">Cliente</p>
                  <p className="text-white font-medium">{selectedStop.customerName}</p>
                  <p className="text-sm text-[#6B7280]">{selectedStop.phone}</p>
                </div>

                <div>
                  <p className="text-sm text-[#A0AEC0] mb-1">Dirección</p>
                  <p className="text-white text-sm">{selectedStop.address}</p>
                  <button className="text-xs text-[#39FF14] mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Ver en mapa
                  </button>
                </div>

                <div className="bg-[#0D0F12] rounded-lg p-4">
                  <p className="text-sm text-[#A0AEC0] mb-2">Equipo a Recolectar</p>
                  <p className="text-white font-medium">{selectedStop.deviceModel}</p>
                  <p className="text-sm text-[#6B7280] mt-1">{selectedStop.issue}</p>
                </div>

                {/* Photos Section */}
                <div>
                  <p className="text-sm text-[#A0AEC0] mb-2">Fotos del Equipo</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="aspect-square bg-[#0D0F12] border-2 border-dashed border-[#2D3748] rounded-lg flex items-center justify-center cursor-pointer hover:border-[#39FF14]">
                      <Camera className="w-6 h-6 text-[#6B7280]" />
                    </div>
                    <div className="aspect-square bg-[#0D0F12] border-2 border-dashed border-[#2D3748] rounded-lg flex items-center justify-center cursor-pointer hover:border-[#39FF14]">
                      <Camera className="w-6 h-6 text-[#6B7280]" />
                    </div>
                    <div className="aspect-square bg-[#0D0F12] border-2 border-dashed border-[#2D3748] rounded-lg flex items-center justify-center cursor-pointer hover:border-[#39FF14]">
                      <Camera className="w-6 h-6 text-[#6B7280]" />
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div>
                  <p className="text-sm text-[#A0AEC0] mb-2">Firma del Cliente</p>
                  <button 
                    onClick={() => setShowSignature(true)}
                    className="w-full p-4 bg-[#0D0F12] border-2 border-dashed border-[#2D3748] rounded-lg flex items-center justify-center gap-2 hover:border-[#39FF14]"
                  >
                    <Signature className="w-5 h-5 text-[#6B7280]" />
                    <span className="text-sm text-[#6B7280]">Capturar firma</span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {selectedStop.status === 'pending' && (
                    <button 
                      onClick={() => {
                        handleUpdateStatus(selectedStop.id, 'in_transit');
                        setShowStopDetail(false);
                      }}
                      className="btn-primary flex-1"
                    >
                      <Navigation className="w-4 h-4 inline mr-1" />
                      Iniciar Ruta
                    </button>
                  )}
                  
                  {selectedStop.status === 'in_transit' && (
                    <button 
                      onClick={() => {
                        handleUpdateStatus(selectedStop.id, 'picked_up');
                        setShowStopDetail(false);
                      }}
                      className="btn-primary flex-1"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Confirmar Recolección
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setShowStopDetail(false)}
                    className="btn-ghost"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={showSignature} onOpenChange={setShowSignature}>
        <DialogContent className="max-w-md bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Signature className="w-6 h-6 text-[#39FF14]" />
              Firma del Cliente
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg h-48 flex items-center justify-center">
              <p className="text-gray-400">Área para firmar</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowSignature(false)}
                className="btn-primary flex-1"
              >
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Guardar Firma
              </button>
              <button 
                onClick={() => setShowSignature(false)}
                className="btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
