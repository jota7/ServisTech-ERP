import { useState } from 'react';
import { useServiceOrderStore, useCustomerStore, useStoreStore, useSettingsStore } from '@/store';
import type { ServiceOrder, Customer, Device, DeviceCredentials, LockType } from '@/types';
import { PatternLock } from './PatternLock';
import {
  Plus,
  Search,
  Camera,
  FileText,
  CheckCircle,
  Smartphone,
  Tablet,
  Laptop,
  Watch,
  ChevronRight,
  User,
  Signature,
  Printer,
  Lock,
  Hash,
  KeyRound,
  Ban,
  Eye,
  X,
  QrCode,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const deviceTypes = [
  { id: 'iphone', label: 'iPhone', icon: Smartphone },
  { id: 'ipad', label: 'iPad', icon: Tablet },
  { id: 'android', label: 'Android', icon: Smartphone },
  { id: 'watch', label: 'Watch', icon: Watch },
  { id: 'laptop', label: 'Laptop', icon: Laptop },
  { id: 'other', label: 'Otro', icon: Smartphone },
];

const lockTypes: { id: LockType; label: string; icon: typeof Lock }[] = [
  { id: 'pattern', label: 'Patrón', icon: Lock },
  { id: 'pin', label: 'PIN', icon: Hash },
  { id: 'password', label: 'Contraseña', icon: KeyRound },
  { id: 'none', label: 'Sin bloqueo', icon: Ban },
];

const checklistItems = {
  iphone: [
    { category: 'Pantalla', items: ['Sin grietas', 'Touch funcional', 'Sin manchas'] },
    { category: 'Botones', items: ['Power', 'Volumen', 'Silencio'] },
    { category: 'Conectividad', items: ['WiFi', 'Bluetooth', 'Celular'] },
    { category: 'Cámaras', items: ['Frontal', 'Trasera', 'Flash'] },
    { category: 'Sensores', items: ['Face ID/Touch ID', 'Proximidad', 'Giroscopio'] },
  ],
  ipad: [
    { category: 'Pantalla', items: ['Sin grietas', 'Touch funcional', 'Apple Pencil'] },
    { category: 'Botones', items: ['Power', 'Volumen', 'Home'] },
    { category: 'Conectividad', items: ['WiFi', 'Bluetooth', 'Celular'] },
    { category: 'Cámaras', items: ['Frontal', 'Trasera'] },
  ],
  android: [
    { category: 'Pantalla', items: ['Sin grietas', 'Touch funcional', 'Sin manchas'] },
    { category: 'Botones', items: ['Power', 'Volumen', 'Huella'] },
    { category: 'Conectividad', items: ['WiFi', 'Bluetooth', 'Celular', 'NFC'] },
    { category: 'Cámaras', items: ['Frontal', 'Trasera', 'Flash'] },
  ],
};

export function Recepcion() {
  const { orders, addOrder } = useServiceOrderStore();
  const { customers: _customers, addCustomer: _addCustomer } = useCustomerStore();
  const { currentStore } = useStoreStore();
  const { settings } = useSettingsStore();
  
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  
  // New order form state
  const [customerData, setCustomerData] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    documentId: '',
    address: '',
  });
  const [deviceData, setDeviceData] = useState<Partial<Device>>({
    type: 'iphone',
    brand: 'apple',
    model: '',
    serialNumber: '',
    imei: '',
    color: '',
    storage: '',
  });
  const [credentials, setCredentials] = useState<DeviceCredentials>({
    type: 'none',
    pattern: [],
    pin: '',
    password: '',
    notes: '',
  });
  const [issue, setIssue] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.status === 'triaje'
  );

  const handleCreateOrder = () => {
    const newOrder: ServiceOrder = {
      id: `so${Date.now()}`,
      orderNumber: `ST-2024-${String(orders.length + 1).padStart(4, '0')}`,
      customerId: 'new-customer',
      deviceId: 'new-device',
      storeId: currentStore?.id || 's1',
      status: 'triaje',
      priority: 'media',
      reportedIssue: issue,
      checklist: Object.entries(checklist).map(([key, checked]) => ({
        id: `chk-${key}`,
        category: 'exterior',
        item: key,
        checked,
      })),
      photos: [],
      termsAccepted,
      partsUsed: [],
      internalPhotos: [],
      timeTracking: [],
      estimatedCost: 0,
      finalCost: 0,
      paidAmount: 0,
      createdBy: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addOrder(newOrder);
    setShowNewOrder(false);
    setShowPreview(false);
    setCurrentStep(1);
    resetForm();
  };

  const resetForm = () => {
    setCustomerData({
      name: '',
      email: '',
      phone: '',
      documentId: '',
      address: '',
    });
    setDeviceData({
      type: 'iphone',
      brand: 'apple',
      model: '',
      serialNumber: '',
      imei: '',
      color: '',
      storage: '',
    });
    setCredentials({
      type: 'none',
      pattern: [],
      pin: '',
      password: '',
      notes: '',
    });
    setIssue('');
    setChecklist({});
    setTermsAccepted(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return customerData.name && customerData.phone && customerData.documentId;
      case 2:
        return deviceData.model && deviceData.serialNumber;
      case 3:
        if (credentials.type === 'pattern') return credentials.pattern && credentials.pattern.length >= 2;
        if (credentials.type === 'pin') return credentials.pin && credentials.pin.length >= 4;
        if (credentials.type === 'password') return credentials.password && credentials.password.length >= 1;
        return true;
      case 4:
        return issue.length > 0;
      case 5:
        return termsAccepted;
      default:
        return true;
    }
  };

  const renderCredentialsSection = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Credenciales del Dispositivo</h3>
        
        {/* Lock Type Selection */}
        <div>
          <label className="text-sm text-[#A0AEC0] mb-2 block">Tipo de Bloqueo</label>
          <div className="grid grid-cols-4 gap-3">
            {lockTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setCredentials({ ...credentials, type: type.id })}
                  className={`p-3 rounded-lg border transition-all ${
                    credentials.type === type.id
                      ? 'border-[#39FF14] bg-[rgba(57,255,20,0.1)]'
                      : 'border-[#2D3748] bg-[#0D0F12] hover:border-[#39FF14]/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${credentials.type === type.id ? 'text-[#39FF14]' : 'text-[#A0AEC0]'}`} />
                  <span className={`text-xs ${credentials.type === type.id ? 'text-[#39FF14]' : 'text-[#A0AEC0]'}`}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pattern Lock */}
        {credentials.type === 'pattern' && (
          <div className="bg-[#0D0F12] rounded-lg p-4">
            <label className="text-sm text-[#A0AEC0] mb-3 block">Dibuje el patrón de desbloqueo</label>
            <div className="flex justify-center">
              <PatternLock
                value={credentials.pattern}
                onChange={(pattern) => setCredentials({ ...credentials, pattern })}
                size={200}
              />
            </div>
          </div>
        )}

        {/* PIN Input */}
        {credentials.type === 'pin' && (
          <div className="bg-[#0D0F12] rounded-lg p-4">
            <label className="text-sm text-[#A0AEC0] mb-2 block">Ingrese el PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={credentials.pin}
              onChange={(e) => setCredentials({ ...credentials, pin: e.target.value.replace(/\D/g, '') })}
              className="input-servistech w-full text-center text-2xl tracking-widest font-mono"
              placeholder="••••"
            />
            <p className="text-xs text-[#6B7280] mt-2">Solo números (4-8 dígitos)</p>
          </div>
        )}

        {/* Password Input */}
        {credentials.type === 'password' && (
          <div className="bg-[#0D0F12] rounded-lg p-4">
            <label className="text-sm text-[#A0AEC0] mb-2 block">Ingrese la contraseña</label>
            <input
              type="text"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="input-servistech w-full"
              placeholder="Contraseña alfanumérica"
            />
            <p className="text-xs text-[#6B7280] mt-2">La contraseña será visible para el técnico</p>
          </div>
        )}

        {/* Notes */}
        {credentials.type !== 'none' && (
          <div>
            <label className="text-sm text-[#A0AEC0] mb-2 block">Notas adicionales</label>
            <textarea
              value={credentials.notes}
              onChange={(e) => setCredentials({ ...credentials, notes: e.target.value })}
              className="input-servistech w-full h-20 resize-none"
              placeholder="Información adicional sobre el acceso..."
            />
          </div>
        )}
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Datos del Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm text-[#A0AEC0] mb-1 block">Nombre Completo *</label>
                <input
                  type="text"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  className="input-servistech w-full"
                  placeholder="Nombre y Apellido"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Cédula/RIF *</label>
                <input
                  type="text"
                  value={customerData.documentId}
                  onChange={(e) => setCustomerData({ ...customerData, documentId: e.target.value })}
                  className="input-servistech w-full"
                  placeholder="V-12345678"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Teléfono *</label>
                <input
                  type="text"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  className="input-servistech w-full"
                  placeholder="+58 412-123-4567"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Email</label>
                <input
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  className="input-servistech w-full"
                  placeholder="cliente@email.com"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Dirección</label>
                <input
                  type="text"
                  value={customerData.address}
                  onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                  className="input-servistech w-full"
                  placeholder="Ubicación"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Información del Equipo</h3>
            <div className="grid grid-cols-4 gap-3">
              {deviceTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setDeviceData({ ...deviceData, type: type.id as Device['type'] })}
                    className={`p-4 rounded-lg border transition-all ${
                      deviceData.type === type.id
                        ? 'border-[#39FF14] bg-[rgba(57,255,20,0.1)]'
                        : 'border-[#2D3748] bg-[#0D0F12] hover:border-[#39FF14]/50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${deviceData.type === type.id ? 'text-[#39FF14]' : 'text-[#A0AEC0]'}`} />
                    <span className={`text-xs ${deviceData.type === type.id ? 'text-[#39FF14]' : 'text-[#A0AEC0]'}`}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Modelo *</label>
                <input
                  type="text"
                  value={deviceData.model}
                  onChange={(e) => setDeviceData({ ...deviceData, model: e.target.value })}
                  className="input-servistech w-full"
                  placeholder="iPhone 14 Pro Max"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Color</label>
                <input
                  type="text"
                  value={deviceData.color}
                  onChange={(e) => setDeviceData({ ...deviceData, color: e.target.value })}
                  className="input-servistech w-full"
                  placeholder="Morado Oscuro"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Almacenamiento</label>
                <input
                  type="text"
                  value={deviceData.storage}
                  onChange={(e) => setDeviceData({ ...deviceData, storage: e.target.value })}
                  className="input-servistech w-full"
                  placeholder="256GB"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Número de Serie *</label>
                <input
                  type="text"
                  value={deviceData.serialNumber}
                  onChange={(e) => setDeviceData({ ...deviceData, serialNumber: e.target.value })}
                  className="input-servistech w-full font-mono"
                  placeholder="F17L9X8K2MNP"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm text-[#A0AEC0] mb-1 block">IMEI</label>
                <input
                  type="text"
                  value={deviceData.imei}
                  onChange={(e) => setDeviceData({ ...deviceData, imei: e.target.value })}
                  className="input-servistech w-full font-mono"
                  placeholder="35-123456-789012-3"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return renderCredentialsSection();
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Problema Reportado</h3>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Descripción del problema *</label>
              <textarea
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                className="input-servistech w-full h-32 resize-none"
                placeholder="Describa el problema que presenta el equipo..."
              />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-2 block">Checklist de Recepción</label>
              <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-dark pr-2">
                {checklistItems[deviceData.type as keyof typeof checklistItems]?.map((category) => (
                  <div key={category.category} className="bg-[#0D0F12] rounded-lg p-3">
                    <h4 className="text-sm font-medium text-white mb-2">{category.category}</h4>
                    <div className="space-y-2">
                      {category.items.map((item) => (
                        <label key={item} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklist[item] || false}
                            onChange={(e) => setChecklist({ ...checklist, [item]: e.target.checked })}
                            className="w-4 h-4 rounded border-[#2D3748] bg-[#0D0F12] text-[#39FF14] focus:ring-[#39FF14]"
                          />
                          <span className="text-sm text-[#A0AEC0]">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Fotos y Documentación</h3>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-[#0D0F12] border-2 border-dashed border-[#2D3748] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#39FF14] transition-colors"
                >
                  <Camera className="w-8 h-8 text-[#6B7280] mb-2" />
                  <span className="text-xs text-[#6B7280]">Foto {i}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#0D0F12] rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-[#39FF14]" />
                <span className="text-sm text-white">Términos y Condiciones</span>
              </div>
              <div className="bg-[#1A1D23] rounded p-3 max-h-32 overflow-y-auto mb-3">
                <p className="text-xs text-[#A0AEC0] whitespace-pre-wrap">
                  {settings.termsAndConditions || 'El cliente acepta los términos de servicio, garantía y responsabilidad por datos no respaldados.'}
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 rounded border-[#2D3748] bg-[#0D0F12] text-[#39FF14] focus:ring-[#39FF14]"
                />
                <span className="text-sm text-[#A0AEC0]">El cliente acepta los términos y condiciones *</span>
              </label>
              <div className="flex items-center gap-3">
                <button className="btn-secondary text-xs py-2">
                  <Signature className="w-4 h-4 inline mr-1" />
                  Firmar Digital
                </button>
                <button className="btn-ghost text-xs py-2">
                  <Printer className="w-4 h-4 inline mr-1" />
                  Imprimir Etiquetas
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Order Preview Component
  const OrderPreview = () => {
    const orderNumber = `ST-2024-${String(orders.length + 1).padStart(4, '0')}`;
    
    return (
      <div className="bg-white text-black p-8 rounded-lg max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
          <div>
            {settings.logo && (
              <img src={settings.logo} alt="Logo" className="h-12 mb-2" />
            )}
            <h2 className="text-xl font-bold">{settings.companyName || 'SERVISTECH'}</h2>
            <p className="text-sm text-gray-600">{currentStore?.name}</p>
            <p className="text-sm text-gray-600">{currentStore?.address}</p>
          </div>
          <div className="text-right">
            <div className="bg-gray-100 p-3 rounded">
              <QrCode className="w-16 h-16 mx-auto" />
            </div>
            <p className="text-xs text-gray-500 mt-1">{orderNumber}</p>
          </div>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p><strong>Orden:</strong> {orderNumber}</p>
            <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-VE')}</p>
          </div>
          <div className="text-right">
            <p><strong>Estado:</strong> En Triaje</p>
            <p><strong>Prioridad:</strong> Media</p>
          </div>
        </div>

        {/* Customer */}
        <div className="border-t border-gray-300 pt-4 mb-4">
          <h3 className="font-bold mb-2">CLIENTE</h3>
          <p><strong>Nombre:</strong> {customerData.name}</p>
          <p><strong>Cédula/RIF:</strong> {customerData.documentId}</p>
          <p><strong>Teléfono:</strong> {customerData.phone}</p>
          {customerData.email && <p><strong>Email:</strong> {customerData.email}</p>}
        </div>

        {/* Device */}
        <div className="border-t border-gray-300 pt-4 mb-4">
          <h3 className="font-bold mb-2">EQUIPO</h3>
          <p><strong>Tipo:</strong> {deviceData.type?.toUpperCase()}</p>
          <p><strong>Modelo:</strong> {deviceData.model}</p>
          <p><strong>Color:</strong> {deviceData.color || 'N/A'}</p>
          <p><strong>Almacenamiento:</strong> {deviceData.storage || 'N/A'}</p>
          <p><strong>Serial:</strong> {deviceData.serialNumber}</p>
          {deviceData.imei && <p><strong>IMEI:</strong> {deviceData.imei}</p>}
        </div>

        {/* Credentials */}
        {credentials.type !== 'none' && (
          <div className="border-t border-gray-300 pt-4 mb-4">
            <h3 className="font-bold mb-2">CREDENCIALES</h3>
            <p><strong>Tipo:</strong> {lockTypes.find(l => l.id === credentials.type)?.label}</p>
            {credentials.type === 'pattern' && credentials.pattern && (
              <p><strong>Patrón:</strong> {credentials.pattern.map(i => i + 1).join(' → ')}</p>
            )}
            {credentials.type === 'pin' && <p><strong>PIN:</strong> ••••{credentials.pin?.slice(-2)}</p>}
            {credentials.type === 'password' && <p><strong>Contraseña:</strong> ••••••••</p>}
            {credentials.notes && <p><strong>Notas:</strong> {credentials.notes}</p>}
          </div>
        )}

        {/* Issue */}
        <div className="border-t border-gray-300 pt-4 mb-4">
          <h3 className="font-bold mb-2">PROBLEMA REPORTADO</h3>
          <p className="text-sm whitespace-pre-wrap">{issue}</p>
        </div>

        {/* Checklist */}
        <div className="border-t border-gray-300 pt-4 mb-4">
          <h3 className="font-bold mb-2">CHECKLIST DE RECEPCIÓN</h3>
          <div className="text-sm">
            {Object.entries(checklist)
              .filter(([, checked]) => checked)
              .map(([item]) => (
                <span key={item} className="inline-block bg-gray-100 px-2 py-1 rounded mr-2 mb-2">
                  ✓ {item}
                </span>
              ))}
          </div>
        </div>

        {/* Terms */}
        <div className="border-t border-gray-300 pt-4 mb-4">
          <h3 className="font-bold mb-2">TÉRMINOS Y CONDICIONES</h3>
          <p className="text-xs text-gray-600 whitespace-pre-wrap">
            {settings.termsAndConditions}
          </p>
          <p className="mt-2 text-sm">
            <strong>Cliente acepta:</strong> {termsAccepted ? 'SÍ' : 'NO'}
          </p>
        </div>

        {/* Signatures */}
        <div className="border-t border-gray-300 pt-4">
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="text-center">
              <div className="border-t border-black pt-2">
                <p className="text-sm">Firma del Cliente</p>
                <p className="text-xs text-gray-500">{customerData.name}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-2">
                <p className="text-sm">Firma del Técnico</p>
                <p className="text-xs text-gray-500">{currentStore?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Recepción y Triaje</h1>
          <p className="text-[#A0AEC0] mt-1">Zona 1 - Registro de equipos y diagnóstico inicial</p>
        </div>
        <button onClick={() => setShowNewOrder(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Orden
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-servistech w-full pl-10"
            placeholder="Buscar por número de orden, cliente o equipo..."
          />
        </div>
        <div className="flex gap-2">
          <select className="input-servistech">
            <option value="">Todos los estados</option>
            <option value="triaje">En Triaje</option>
            <option value="diagnostico">En Diagnóstico</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg overflow-hidden">
        <table className="table-servistech">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Cliente</th>
              <th>Equipo</th>
              <th>Problema</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <span className="font-mono text-[#39FF14]">{order.orderNumber}</span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#252A33] flex items-center justify-center">
                      <User className="w-4 h-4 text-[#A0AEC0]" />
                    </div>
                    <span className="text-white text-sm">Cliente {order.customerId}</span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#A0AEC0]" />
                    <span className="text-white text-sm">Dispositivo {order.deviceId}</span>
                  </div>
                </td>
                <td>
                  <span className="text-[#A0AEC0] text-sm truncate max-w-[200px] block">
                    {order.reportedIssue}
                  </span>
                </td>
                <td>
                  <span className="badge-info">
                    {order.status === 'triaje' ? 'En Triaje' : 'En Diagnóstico'}
                  </span>
                </td>
                <td>
                  <span className="text-[#A0AEC0] text-sm">
                    {order.createdAt.toLocaleDateString('es-VE')}
                  </span>
                </td>
                <td>
                  <button className="text-[#39FF14] hover:underline text-sm">
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Order Dialog */}
      <Dialog open={showNewOrder} onOpenChange={setShowNewOrder}>
        <DialogContent className="max-w-2xl bg-[#1A1D23] border-[#2D3748] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Nueva Orden de Servicio</DialogTitle>
          </DialogHeader>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? 'bg-[#39FF14] text-[#0D0F12]'
                      : 'bg-[#2D3748] text-[#A0AEC0]'
                  }`}
                >
                  {step}
                </div>
                {step < 5 && (
                  <div
                    className={`w-12 h-0.5 mx-1 ${
                      currentStep > step ? 'bg-[#39FF14]' : 'bg-[#2D3748]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between text-xs text-[#A0AEC0] mb-4 -mt-4">
            <span>Cliente</span>
            <span>Equipo</span>
            <span>Credenciales</span>
            <span>Problema</span>
            <span>Docs</span>
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">{renderStep()}</div>

          {/* Actions */}
          <div className="flex justify-between mt-6 pt-4 border-t border-[#2D3748]">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="btn-ghost disabled:opacity-50"
            >
              Anterior
            </button>
            <div className="flex gap-3">
              <button onClick={() => setShowNewOrder(false)} className="btn-ghost">
                Cancelar
              </button>
              {currentStep === 5 && (
                <button 
                  onClick={() => setShowPreview(true)} 
                  className="btn-secondary"
                  disabled={!canProceed()}
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  Vista Previa
                </button>
              )}
              {currentStep < 5 ? (
                <button 
                  onClick={() => setCurrentStep(currentStep + 1)} 
                  className="btn-primary"
                  disabled={!canProceed()}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 inline ml-1" />
                </button>
              ) : (
                <button onClick={handleCreateOrder} className="btn-primary" disabled={!canProceed()}>
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Crear Orden
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl bg-[#1A1D23] border-[#2D3748] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              <span>Vista Previa de Orden de Servicio</span>
              <button 
                onClick={() => setShowPreview(false)}
                className="p-1 hover:bg-[#2D3748] rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </DialogTitle>
          </DialogHeader>
          
          <OrderPreview />
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#2D3748]">
            <button onClick={() => setShowPreview(false)} className="btn-ghost">
              Editar
            </button>
            <button onClick={() => window.print()} className="btn-secondary">
              <Printer className="w-4 h-4 inline mr-1" />
              Imprimir
            </button>
            <button onClick={handleCreateOrder} className="btn-primary">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Confirmar y Crear
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
