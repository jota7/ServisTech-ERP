import { useState, useRef } from 'react';
import { useSettingsStore, useStoreStore, useAuthStore, useBCVRateStore } from '@/store';
import type { PrintFormat } from '@/types';
import {
  Settings,
  Store,
  DollarSign,
  Shield,
  Bell,
  Users,
  Save,
  Plus,
  Edit,
  CheckCircle,
  Smartphone,
  FileText,
  Printer,
  Upload,
  Image,
  X,
  RefreshCw,
  Bitcoin,
  LayoutTemplate,
  Type,
  QrCode,
  Trash2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const roles = [
  { id: 'super-admin', name: 'Super Admin', description: 'Acceso total al sistema' },
  { id: 'gerente', name: 'Gerente', description: 'Gestión de sede y reportes' },
  { id: 'anfitrion', name: 'Anfitrión', description: 'Recepción y atención al cliente' },
  { id: 'tecnico', name: 'Técnico', description: 'Reparaciones y diagnósticos' },
  { id: 'qa', name: 'QA', description: 'Control de calidad' },
  { id: 'almacen', name: 'Almacén', description: 'Gestión de inventario' },
];

const whatsappTemplates = [
  {
    id: '1',
    name: 'Recepción Confirmada',
    trigger: 'triaje',
    content: '¡Hola {{nombre}}! Hemos recibido tu {{equipo}} en SERVISTECH. Tu número de orden es: {{orden}}.',
    active: true,
  },
  {
    id: '2',
    name: 'Diagnóstico Completo',
    trigger: 'diagnostico',
    content: 'Hola {{nombre}}. Hemos completado el diagnóstico de tu {{equipo}}. Costo estimado: {{monto}}.',
    active: true,
  },
  {
    id: '3',
    name: 'Equipo Listo',
    trigger: 'listo',
    content: '¡Buenas noticias {{nombre}}! Tu {{equipo}} está listo. Total a pagar: {{monto}}.',
    active: true,
  },
];

export function Configuracion() {
  const { settings, updateSettings, addPrintFormat, updatePrintFormat, deletePrintFormat, setLogo } = useSettingsStore();
  const { stores } = useStoreStore();
  const { user: _user } = useAuthStore();
  const { binanceRate, syncBinanceRate } = useBCVRateStore();

  const [activeTab, setActiveTab] = useState('general');
  const [showNewStore, setShowNewStore] = useState(false);
  const [showNewUser, setShowNewUser] = useState(false);
  const [showPrintFormat, setShowPrintFormat] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingFormat, setEditingFormat] = useState<PrintFormat | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print format form state
  const [formatForm, setFormatForm] = useState<Partial<PrintFormat>>({
    name: '',
    type: 'receipt',
    header: '',
    footer: '',
    showLogo: true,
    showQR: true,
    isDefault: false,
  });

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  // Logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Print format handlers
  const handleSaveFormat = () => {
    if (!formatForm.name) return;
    
    if (editingFormat) {
      updatePrintFormat(editingFormat.id, formatForm);
    } else {
      const newFormat: PrintFormat = {
        id: `fmt-${Date.now()}`,
        name: formatForm.name || '',
        type: (formatForm.type as PrintFormat['type']) || 'receipt',
        header: formatForm.header || '',
        footer: formatForm.footer || '',
        showLogo: formatForm.showLogo ?? true,
        showQR: formatForm.showQR ?? true,
        isDefault: formatForm.isDefault ?? false,
      };
      addPrintFormat(newFormat);
    }
    setShowPrintFormat(false);
    setEditingFormat(null);
    setFormatForm({
      name: '',
      type: 'receipt',
      header: '',
      footer: '',
      showLogo: true,
      showQR: true,
      isDefault: false,
    });
  };

  const handleEditFormat = (format: PrintFormat) => {
    setEditingFormat(format);
    setFormatForm(format);
    setShowPrintFormat(true);
  };

  const handleDeleteFormat = (id: string) => {
    if (confirm('¿Está seguro de eliminar este formato?')) {
      deletePrintFormat(id);
    }
  };

  // Preview print format
  const PrintPreview = () => {
    const format = editingFormat || formatForm;
    return (
      <div className="bg-white text-black p-6 rounded-lg max-w-sm mx-auto">
        {format.showLogo && settings.logo && (
          <div className="text-center mb-4">
            <img src={settings.logo} alt="Logo" className="h-12 mx-auto" />
          </div>
        )}
        <div className="text-center border-b border-gray-300 pb-4 mb-4">
          <pre className="text-xs whitespace-pre-wrap font-sans">{format.header}</pre>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">Contenido del documento...</p>
        </div>
        <div className="text-center border-t border-gray-300 pt-4 mt-4">
          <pre className="text-xs whitespace-pre-wrap font-sans">{format.footer}</pre>
        </div>
        {format.showQR && (
          <div className="flex justify-center mt-4">
            <QrCode className="w-16 h-16 text-gray-400" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración</h1>
          <p className="text-[#A0AEC0] mt-1">Ajustes del sistema y parámetros</p>
        </div>
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          Guardar Cambios
        </button>
      </div>

      {savedMessage && (
        <div className="bg-[rgba(57,255,20,0.15)] border border-[#39FF14]/30 rounded-lg p-4 flex items-center gap-2 text-[#39FF14]">
          <CheckCircle className="w-5 h-5" />
          <span>Configuración guardada correctamente</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#1A1D23] border border-[#2D3748] flex-wrap h-auto">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-[#39FF14] data-[state=active]:text-[#0D0F12]"
          >
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="stores"
            className="data-[state=active]:bg-[#39FF14] data-[state=active]:text-[#0D0F12]"
          >
            <Store className="w-4 h-4 mr-2" />
            Sedes
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="data-[state=active]:bg-[#39FF14] data-[state=active]:text-[#0D0F12]"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Financiero
          </TabsTrigger>
          <TabsTrigger
            value="printing"
            className="data-[state=active]:bg-[#39FF14] data-[state=active]:text-[#0D0F12]"
          >
            <Printer className="w-4 h-4 mr-2" />
            Impresión
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-[#39FF14] data-[state=active]:text-[#0D0F12]"
          >
            <Users className="w-4 h-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-[#39FF14] data-[state=active]:text-[#0D0F12]"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-4 space-y-4">
          {/* Logo Upload */}
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-[#39FF14]" />
              Logo de la Empresa
            </h3>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-[#0D0F12] rounded-lg border-2 border-dashed border-[#2D3748] flex items-center justify-center overflow-hidden">
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center">
                    <Image className="w-8 h-8 text-[#6B7280] mx-auto mb-2" />
                    <span className="text-xs text-[#6B7280]">Sin logo</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {settings.logo ? 'Cambiar Logo' : 'Subir Logo'}
                </button>
                {settings.logo && (
                  <button
                    onClick={() => setLogo('')}
                    className="btn-ghost text-sm flex items-center gap-2 text-[#FF4D4D]"
                  >
                    <X className="w-4 h-4" />
                    Eliminar Logo
                  </button>
                )}
                <p className="text-xs text-[#6B7280]">
                  Formatos: PNG, JPG, SVG. Tamaño recomendado: 400x200px
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#39FF14]" />
              Información de la Empresa
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm text-[#A0AEC0] mb-1 block">Nombre de la Empresa</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => updateSettings({ companyName: e.target.value })}
                  className="input-servistech w-full"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">RIF</label>
                <input type="text" className="input-servistech w-full" placeholder="J-12345678-9" />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Teléfono</label>
                <input type="text" className="input-servistech w-full" placeholder="+58 212-123-4567" />
              </div>
              <div className="col-span-2">
                <label className="text-sm text-[#A0AEC0] mb-1 block">Dirección Fiscal</label>
                <textarea className="input-servistech w-full h-20 resize-none" />
              </div>
            </div>
          </div>

          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#00B2FF]" />
              Parámetros de Garantía
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Días de Garantía por Defecto</label>
                <input
                  type="number"
                  value={settings.defaultWarrantyDays}
                  onChange={(e) => updateSettings({ defaultWarrantyDays: parseInt(e.target.value) })}
                  className="input-servistech w-full"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">% Fondo de Garantía</label>
                <input
                  type="number"
                  value={settings.warrantyFundPercentage}
                  onChange={(e) => updateSettings({ warrantyFundPercentage: parseInt(e.target.value) })}
                  className="input-servistech w-full"
                />
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FFB020]" />
              Términos y Condiciones
            </h3>
            <p className="text-sm text-[#A0AEC0] mb-3">
              Estos términos se mostrarán en las órdenes de servicio y deberán ser aceptados por el cliente.
            </p>
            <textarea
              value={settings.termsAndConditions}
              onChange={(e) => updateSettings({ termsAndConditions: e.target.value })}
              className="input-servistech w-full h-64 resize-none font-mono text-sm"
              placeholder="Ingrese los términos y condiciones..."
            />
          </div>
        </TabsContent>

        {/* Stores */}
        <TabsContent value="stores" className="mt-4">
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowNewStore(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Sede
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map((store) => (
              <div key={store.id} className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{store.name}</h4>
                    <p className="font-mono text-sm text-[#39FF14]">{store.code}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-white/10 rounded text-[#A0AEC0]">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-[#A0AEC0]">
                  <p>{store.address}</p>
                  <p>{store.phone}</p>
                  <p>{store.email}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Financial */}
        <TabsContent value="financial" className="mt-4 space-y-4">
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#39FF14]" />
              Configuración de Pagos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">% IGTF (Divisa Efectivo)</label>
                <input
                  type="number"
                  value={settings.igtfPercentage}
                  onChange={(e) => updateSettings({ igtfPercentage: parseInt(e.target.value) })}
                  className="input-servistech w-full"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Sincronización BCV</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateSettings({ bcvAutoSync: !settings.bcvAutoSync })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.bcvAutoSync ? 'bg-[#39FF14]' : 'bg-[#2D3748]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        settings.bcvAutoSync ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-[#A0AEC0]">Automática</span>
                </div>
              </div>
              {settings.bcvAutoSync && (
                <div>
                  <label className="text-sm text-[#A0AEC0] mb-1 block">Hora de Sincronización</label>
                  <input
                    type="time"
                    value={`${String(settings.bcvSyncHour).padStart(2, '0')}:00`}
                    onChange={(e) => updateSettings({ bcvSyncHour: parseInt(e.target.value.split(':')[0]) })}
                    className="input-servistech w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Binance Rate */}
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bitcoin className="w-5 h-5 text-[#F7931A]" />
              Tasa Binance USDT (Paralelo)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Usar tasa Binance en facturación</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateSettings({ useBinanceRate: !settings.useBinanceRate })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.useBinanceRate ? 'bg-[#39FF14]' : 'bg-[#2D3748]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        settings.useBinanceRate ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-[#A0AEC0]">
                    {settings.useBinanceRate ? 'Activado' : 'Desactivado'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Tasa Actual</label>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-mono text-[#F7931A]">
                    Bs. {binanceRate?.toFixed(2) || '---'}
                  </span>
                  <button
                    onClick={syncBinanceRate}
                    className="p-2 hover:bg-white/10 rounded text-[#A0AEC0] hover:text-[#39FF14]"
                    title="Sincronizar"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-[#6B7280] mt-3">
              La tasa Binance se obtiene de la API de Binance P2P y representa el valor aproximado del USDT en el mercado paralelo.
            </p>
          </div>

          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#00B2FF]" />
              Costeo (COGS+)
            </h3>
            <div className="bg-[#0D0F12] rounded-lg p-4">
              <p className="text-sm text-[#A0AEC0] mb-2">Fórmula de Costo Total:</p>
              <p className="text-white font-mono">
                Costo Total = Repuesto + Flete + Gasto Operativo + 10% Fondo Garantía
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Printing */}
        <TabsContent value="printing" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-[#39FF14]" />
              Formatos de Impresión
            </h3>
            <button
              onClick={() => {
                setEditingFormat(null);
                setFormatForm({
                  name: '',
                  type: 'receipt',
                  header: '',
                  footer: '',
                  showLogo: true,
                  showQR: true,
                  isDefault: false,
                });
                setShowPrintFormat(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Formato
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.printFormats.map((format) => (
              <div key={format.id} className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium">{format.name}</h4>
                      {format.isDefault && (
                        <span className="text-xs bg-[#39FF14]/20 text-[#39FF14] px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#39FF14] capitalize">{format.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditFormat(format)}
                      className="p-1.5 hover:bg-white/10 rounded text-[#A0AEC0]"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFormat(format.id)}
                      className="p-1.5 hover:bg-white/10 rounded text-[#A0AEC0] hover:text-[#FF4D4D]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-[#6B7280]" />
                    <span className="text-[#A0AEC0] text-xs truncate">{format.header.slice(0, 50)}...</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {format.showLogo && (
                      <span className="text-xs text-[#39FF14]">✓ Logo</span>
                    )}
                    {format.showQR && (
                      <span className="text-xs text-[#39FF14]">✓ QR</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="mt-4">
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowNewUser(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Usuario
            </button>
          </div>
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg overflow-hidden">
            <table className="table-servistech">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Sede</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#39FF14] to-[#00B2FF] flex items-center justify-center">
                        <span className="text-sm font-bold text-[#0D0F12]">A</span>
                      </div>
                      <span className="text-white">Admin Principal</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-[#A0AEC0] text-sm">admin@servistech.com</span>
                  </td>
                  <td>
                    <span className="badge-success">Super Admin</span>
                  </td>
                  <td>
                    <span className="text-[#A0AEC0] text-sm">Todas</span>
                  </td>
                  <td>
                    <span className="badge-success">Activo</span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="p-1.5 hover:bg-white/10 rounded text-[#A0AEC0]">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Roles Info */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-white mb-3">Roles y Permisos</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {roles.map((role) => (
                <div key={role.id} className="bg-[#0D0F12] rounded-lg p-3">
                  <p className="text-white font-medium text-sm">{role.name}</p>
                  <p className="text-xs text-[#A0AEC0]">{role.description}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4 space-y-4">
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#39FF14]" />
                WhatsApp Business API
              </h3>
              <button
                onClick={() => updateSettings({ whatsappEnabled: !settings.whatsappEnabled })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.whatsappEnabled ? 'bg-[#39FF14]' : 'bg-[#2D3748]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.whatsappEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-[#A0AEC0] mb-4">
              Envía notificaciones automáticas a los clientes en cada cambio de estado importante.
            </p>
          </div>

          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Plantillas de Mensajes</h3>
            <div className="space-y-3">
              {whatsappTemplates.map((template) => (
                <div key={template.id} className="bg-[#0D0F12] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{template.name}</p>
                      <p className="text-xs text-[#39FF14]">Trigger: {template.trigger}</p>
                    </div>
                    <button
                      className={`w-10 h-5 rounded-full transition-colors ${
                        template.active ? 'bg-[#39FF14]' : 'bg-[#2D3748]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          template.active ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-[#A0AEC0]">{template.content}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Store Dialog */}
      <Dialog open={showNewStore} onOpenChange={setShowNewStore}>
        <DialogContent className="max-w-md bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Store className="w-6 h-6 text-[#39FF14]" />
              Nueva Sede
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Nombre</label>
              <input type="text" className="input-servistech w-full" placeholder="Sede Principal" />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Código</label>
              <input type="text" className="input-servistech w-full" placeholder="CCS-01" />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Dirección</label>
              <textarea className="input-servistech w-full h-20 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Teléfono</label>
                <input type="text" className="input-servistech w-full" />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Email</label>
                <input type="email" className="input-servistech w-full" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowNewStore(false)} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={() => setShowNewStore(false)} className="btn-primary">
              <Plus className="w-4 h-4 inline mr-1" />
              Crear Sede
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New User Dialog */}
      <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
        <DialogContent className="max-w-md bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-[#39FF14]" />
              Nuevo Usuario
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Nombre Completo</label>
              <input type="text" className="input-servistech w-full" />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Email</label>
              <input type="email" className="input-servistech w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Rol</label>
                <select className="input-servistech w-full">
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Sede</label>
                <select className="input-servistech w-full">
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowNewUser(false)} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={() => setShowNewUser(false)} className="btn-primary">
              <Plus className="w-4 h-4 inline mr-1" />
              Crear Usuario
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Format Dialog */}
      <Dialog open={showPrintFormat} onOpenChange={setShowPrintFormat}>
        <DialogContent className="max-w-2xl bg-[#1A1D23] border-[#2D3748] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <LayoutTemplate className="w-6 h-6 text-[#39FF14]" />
              {editingFormat ? 'Editar Formato' : 'Nuevo Formato de Impresión'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={formatForm.name}
                  onChange={(e) => setFormatForm({ ...formatForm, name: e.target.value })}
                  className="input-servistech w-full"
                  placeholder="Nombre del formato"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Tipo</label>
                <select
                  value={formatForm.type}
                  onChange={(e) => setFormatForm({ ...formatForm, type: e.target.value as PrintFormat['type'] })}
                  className="input-servistech w-full"
                >
                  <option value="receipt">Recibo</option>
                  <option value="order">Orden de Servicio</option>
                  <option value="invoice">Factura</option>
                  <option value="label">Etiqueta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Encabezado</label>
              <textarea
                value={formatForm.header}
                onChange={(e) => setFormatForm({ ...formatForm, header: e.target.value })}
                className="input-servistech w-full h-24 resize-none font-mono text-sm"
                placeholder="Texto del encabezado..."
              />
            </div>

            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Pie de página</label>
              <textarea
                value={formatForm.footer}
                onChange={(e) => setFormatForm({ ...formatForm, footer: e.target.value })}
                className="input-servistech w-full h-24 resize-none font-mono text-sm"
                placeholder="Texto del pie de página..."
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formatForm.showLogo}
                  onChange={(e) => setFormatForm({ ...formatForm, showLogo: e.target.checked })}
                  className="w-4 h-4 rounded border-[#2D3748] bg-[#0D0F12] text-[#39FF14]"
                />
                <span className="text-sm text-[#A0AEC0]">Mostrar Logo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formatForm.showQR}
                  onChange={(e) => setFormatForm({ ...formatForm, showQR: e.target.checked })}
                  className="w-4 h-4 rounded border-[#2D3748] bg-[#0D0F12] text-[#39FF14]"
                />
                <span className="text-sm text-[#A0AEC0]">Mostrar Código QR</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formatForm.isDefault}
                  onChange={(e) => setFormatForm({ ...formatForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-[#2D3748] bg-[#0D0F12] text-[#39FF14]"
                />
                <span className="text-sm text-[#A0AEC0]">Por defecto</span>
              </label>
            </div>

            {/* Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-[#A0AEC0]">Vista Previa</label>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs text-[#39FF14] hover:underline"
                >
                  {showPreview ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {showPreview && <PrintPreview />}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => {
                setShowPrintFormat(false);
                setEditingFormat(null);
              }} 
              className="btn-ghost"
            >
              Cancelar
            </button>
            <button onClick={handleSaveFormat} className="btn-primary">
              <Save className="w-4 h-4 inline mr-1" />
              {editingFormat ? 'Guardar Cambios' : 'Crear Formato'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
