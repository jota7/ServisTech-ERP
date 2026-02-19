import { useState, useMemo } from 'react';
import { useInventoryStore, useStoreStore, useSettingsStore } from '@/store';
import type { Part } from '@/types';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  ArrowRightLeft,
  Truck,
  Edit,
  History,
  Trash2,
  FolderOpen,
  FileDown,
  Save,
  Tag,
  Download,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Category type
interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  partCount: number;
}

const defaultCategories: Category[] = [
  { id: 'pantallas', name: 'Pantallas', description: 'Pantallas LCD/OLED para smartphones y tablets', color: '#39FF14', partCount: 0 },
  { id: 'baterias', name: 'Baterías', description: 'Baterías originales y genéricas', color: '#00B2FF', partCount: 0 },
  { id: 'conectores', name: 'Conectores', description: 'Puertos de carga y conectores', color: '#FFB020', partCount: 0 },
  { id: 'camaras', name: 'Cámaras', description: 'Cámaras frontales y traseras', color: '#FF4D4D', partCount: 0 },
  { id: 'flex', name: 'Flex', description: 'Cables flex y conexiones internas', color: '#A855F7', partCount: 0 },
  { id: 'bocinas', name: 'Bocinas', description: 'Altavoces y auriculares', color: '#EC4899', partCount: 0 },
  { id: 'microfonos', name: 'Micrófonos', description: 'Micrófonos internos', color: '#14B8A6', partCount: 0 },
  { id: 'botones', name: 'Botones', description: 'Botones de encendido y volumen', color: '#F97316', partCount: 0 },
];

export function Inventario() {
  const { parts, transfers, getLowStock, addPart } = useInventoryStore();
  const { currentStore, stores } = useStoreStore();
  const { settings } = useSettingsStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPart, setShowNewPart] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [_selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Category management state
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({ name: '', description: '', color: '#39FF14' });
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // New part form state
  const [partForm, setPartForm] = useState({
    sku: '',
    name: '',
    category: 'pantallas',
    costPrice: '',
    salePrice: '',
    shippingCost: '',
    operationalCost: '',
    initialStock: '',
    minStock: '3',
    compatibleModels: '',
  });

  const lowStockParts = getLowStock(currentStore?.id);

  // Update category part counts
  const categoriesWithCounts = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      partCount: parts.filter(p => p.category === cat.id).length
    }));
  }, [categories, parts]);

  const filteredParts = parts.filter(
    (p) =>
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!selectedCategory || p.category === selectedCategory)
  );

  const calculateCOGS = (part: Part) => {
    const warrantyFund = part.costPrice * 0.1;
    return part.costPrice + part.shippingCost + part.operationalCost + warrantyFund;
  };

  const getStockForStore = (part: Part, storeId: string) => {
    const stock = part.stock.find((s) => s.storeId === storeId);
    return stock ? stock.quantity - stock.reserved : 0;
  };

  // Category CRUD operations
  const handleAddCategory = () => {
    if (!newCategory.name) return;
    const category: Category = {
      id: `cat-${Date.now()}`,
      name: newCategory.name,
      description: newCategory.description || '',
      color: newCategory.color || '#39FF14',
      partCount: 0,
    };
    setCategories([...categories, category]);
    setNewCategory({ name: '', description: '', color: '#39FF14' });
    setShowCategoryForm(false);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    setCategories(categories.map(c => c.id === editingCategory.id ? editingCategory : c));
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta categoría? Los repuestos asociados quedarán sin categoría.')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  // Generate PDF for categories
  const generateCategoriesPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Categorías de Inventario - ${settings.companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .logo { max-height: 60px; margin-bottom: 10px; }
          h1 { margin: 0; font-size: 24px; }
          .subtitle { color: #666; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .color-dot { width: 20px; height: 20px; border-radius: 50%; display: inline-block; margin-right: 8px; vertical-align: middle; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${settings.logo ? `<img src="${settings.logo}" class="logo" alt="Logo">` : ''}
          <h1>${settings.companyName}</h1>
          <p class="subtitle">Reporte de Categorías de Inventario</p>
          <p class="subtitle">Fecha: ${new Date().toLocaleDateString('es-VE')}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Color</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Repuestos</th>
            </tr>
          </thead>
          <tbody>
            ${categoriesWithCounts.map(cat => `
              <tr>
                <td><span class="color-dot" style="background-color: ${cat.color};"></span></td>
                <td><strong>${cat.name}</strong></td>
                <td>${cat.description}</td>
                <td>${cat.partCount}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Total de categorías: ${categoriesWithCounts.length}</p>
          <p>Total de repuestos: ${parts.length}</p>
        </div>
        
        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
            Imprimir / Guardar como PDF
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Generate PDF for parts by category
  const generatePartsByCategoryPDF = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    const categoryParts = parts.filter(p => p.category === categoryId);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${category?.name} - ${settings.companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid ${category?.color}; padding-bottom: 20px; }
          h1 { margin: 0; font-size: 24px; }
          .category-badge { background-color: ${category?.color}; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin-top: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .low-stock { color: #dc2626; font-weight: bold; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${settings.companyName}</h1>
          <span class="category-badge">${category?.name}</span>
          <p style="color: #666; font-size: 14px; margin-top: 10px;">
            Fecha: ${new Date().toLocaleDateString('es-VE')}
          </p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Stock</th>
              <th>Costo</th>
              <th>Venta</th>
              <th>Margen</th>
            </tr>
          </thead>
          <tbody>
            ${categoryParts.map(part => {
              const stock = getStockForStore(part, currentStore?.id || '');
              const cogs = calculateCOGS(part);
              const margin = ((part.salePrice - cogs) / part.salePrice * 100).toFixed(1);
              return `
                <tr>
                  <td><code>${part.sku}</code></td>
                  <td>${part.name}</td>
                  <td class="${stock <= part.minStock ? 'low-stock' : ''}">${stock}</td>
                  <td>$${cogs.toFixed(2)}</td>
                  <td>$${part.salePrice.toFixed(2)}</td>
                  <td>${margin}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Total de repuestos en ${category?.name}: ${categoryParts.length}</p>
        </div>
        
        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
            Imprimir / Guardar como PDF
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleSavePart = () => {
    const newPart: Part = {
      id: `part-${Date.now()}`,
      sku: partForm.sku,
      name: partForm.name,
      description: '',
      category: partForm.category,
      compatibleModels: partForm.compatibleModels.split(',').map(m => m.trim()).filter(Boolean),
      stock: [{
        storeId: currentStore?.id || 's1',
        quantity: parseInt(partForm.initialStock) || 0,
        reserved: 0,
      }],
      costPrice: parseFloat(partForm.costPrice) || 0,
      salePrice: parseFloat(partForm.salePrice) || 0,
      shippingCost: parseFloat(partForm.shippingCost) || 0,
      operationalCost: parseFloat(partForm.operationalCost) || 0,
      warrantyFund: (parseFloat(partForm.costPrice) || 0) * 0.1,
      minStock: parseInt(partForm.minStock) || 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addPart(newPart);
    setShowNewPart(false);
    setPartForm({
      sku: '',
      name: '',
      category: 'pantallas',
      costPrice: '',
      salePrice: '',
      shippingCost: '',
      operationalCost: '',
      initialStock: '',
      minStock: '3',
      compatibleModels: '',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventario</h1>
          <p className="text-[#A0AEC0] mt-1">Zona 3 - Gestión de repuestos y costos</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setShowCategories(true)} className="btn-secondary flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Categorías
          </button>
          <button onClick={() => setShowTransfer(true)} className="btn-secondary flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Transferir
          </button>
          <button onClick={() => setShowNewPart(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Repuesto
          </button>
        </div>
      </div>

      {/* Alerts */}
      {lowStockParts.length > 0 && (
        <div className="bg-[rgba(255,77,77,0.1)] border border-[#FF4D4D]/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#FF4D4D] mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Alerta de Stock Crítico</span>
          </div>
          <p className="text-sm text-[#A0AEC0]">
            {lowStockParts.length} repuestos están por debajo del stock mínimo en {currentStore?.name}
          </p>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="bg-[#1A1D23] border border-[#2D3748]">
          <TabsTrigger value="inventory" className="data-[state=active]:bg-[#39FF14] data-[state=active]:text-[#0D0F12]">
            <Package className="w-4 h-4 mr-2" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="transfers" className="data-[state=active]:bg-[#39FF14] data-[state=active]:text-[#0D0F12]">
            <Truck className="w-4 h-4 mr-2" />
            Transferencias
          </TabsTrigger>
          <TabsTrigger value="movements" className="data-[state=active]:bg-[#39FF14] data-[state=active]:text-[#0D0F12]">
            <History className="w-4 h-4 mr-2" />
            Movimientos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-servistech w-full pl-10"
                placeholder="Buscar por SKU, nombre o categoría..."
              />
            </div>
            <select 
              className="input-servistech"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categoriesWithCounts.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#39FF14] text-[#0D0F12]'
                    : 'bg-[#1A1D23] border border-[#2D3748] text-[#A0AEC0] hover:border-[#39FF14]/50'
                }`}
              >
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
                <span className="text-xs opacity-70">({cat.partCount})</span>
              </button>
            ))}
          </div>

          {/* Parts Table */}
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg overflow-hidden">
            <table className="table-servistech">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Stock Actual</th>
                  <th>Costo + COGS</th>
                  <th>Precio Venta</th>
                  <th>Margen</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part) => {
                  const stock = getStockForStore(part, currentStore?.id || '');
                  const cogs = calculateCOGS(part);
                  const margin = ((part.salePrice - cogs) / part.salePrice) * 100;
                  const isLowStock = stock <= part.minStock;
                  const category = categories.find(c => c.id === part.category);

                  return (
                    <tr key={part.id}>
                      <td>
                        <span className="font-mono text-sm text-[#39FF14]">{part.sku}</span>
                      </td>
                      <td>
                        <div>
                          <p className="text-white text-sm font-medium">{part.name}</p>
                          <p className="text-xs text-[#6B7280]">{part.compatibleModels.join(', ')}</p>
                        </div>
                      </td>
                      <td>
                        <span 
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: `${category?.color}20`, color: category?.color }}
                        >
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: category?.color }}
                          />
                          {category?.name || part.category}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isLowStock ? 'text-[#FF4D4D]' : 'text-white'}`}>
                            {stock}
                          </span>
                          {isLowStock && <AlertTriangle className="w-4 h-4 text-[#FF4D4D]" />}
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="text-white text-sm font-mono">${cogs.toFixed(2)}</p>
                          <p className="text-xs text-[#6B7280]">
                            ${part.costPrice} + ${part.shippingCost} + ${part.operationalCost} + 10%
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className="text-[#39FF14] text-sm font-mono">${part.salePrice.toFixed(2)}</span>
                      </td>
                      <td>
                        <span className={`text-sm font-medium ${margin > 30 ? 'text-[#39FF14]' : 'text-[#FFB020]'}`}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedPart(part)}
                            className="p-1.5 hover:bg-white/10 rounded text-[#A0AEC0] hover:text-white"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => generatePartsByCategoryPDF(part.category)}
                            className="p-1.5 hover:bg-white/10 rounded text-[#A0AEC0] hover:text-[#39FF14]"
                            title="Exportar categoría"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-white/10 rounded text-[#A0AEC0] hover:text-[#FF4D4D]">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="transfers" className="mt-4">
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg overflow-hidden">
            <table className="table-servistech">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Repuesto</th>
                  <th>Desde</th>
                  <th>Hacia</th>
                  <th>Cantidad</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => {
                  const part = parts.find((p) => p.id === transfer.partId);
                  const fromStore = stores.find((s) => s.id === transfer.fromStoreId);
                  const toStore = stores.find((s) => s.id === transfer.toStoreId);

                  return (
                    <tr key={transfer.id}>
                      <td>
                        <span className="font-mono text-sm text-[#39FF14]">{transfer.id}</span>
                      </td>
                      <td>
                        <span className="text-white text-sm">{part?.name || transfer.partId}</span>
                      </td>
                      <td>
                        <span className="text-[#A0AEC0] text-sm">{fromStore?.name || transfer.fromStoreId}</span>
                      </td>
                      <td>
                        <span className="text-[#A0AEC0] text-sm">{toStore?.name || transfer.toStoreId}</span>
                      </td>
                      <td>
                        <span className="text-white text-sm font-medium">{transfer.quantity}</span>
                      </td>
                      <td>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            transfer.status === 'received'
                              ? 'bg-[rgba(57,255,20,0.15)] text-[#39FF14]'
                              : transfer.status === 'in-transit'
                              ? 'bg-[rgba(0,178,255,0.15)] text-[#00B2FF]'
                              : 'bg-[rgba(255,176,32,0.15)] text-[#FFB020]'
                          }`}
                        >
                          {transfer.status === 'pending'
                            ? 'Pendiente'
                            : transfer.status === 'in-transit'
                            ? 'En Tránsito'
                            : transfer.status === 'received'
                            ? 'Recibido'
                            : 'Cancelado'}
                        </span>
                      </td>
                      <td>
                        <span className="text-[#A0AEC0] text-sm">
                          {transfer.createdAt.toLocaleDateString('es-VE')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-8 text-center">
            <History className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
            <p className="text-[#A0AEC0]">Historial de movimientos de inventario</p>
            <p className="text-sm text-[#6B7280] mt-2">Próximamente disponible</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Categories Dialog */}
      <Dialog open={showCategories} onOpenChange={setShowCategories}>
        <DialogContent className="max-w-3xl bg-[#1A1D23] border-[#2D3748] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[#39FF14]" />
                Gestión de Categorías
              </span>
              <button
                onClick={generateCategoriesPDF}
                className="btn-secondary text-sm py-1.5 px-3"
              >
                <Download className="w-4 h-4 inline mr-1" />
                Exportar PDF
              </button>
            </DialogTitle>
          </DialogHeader>

          {/* Add Category Button */}
          <button
            onClick={() => setShowCategoryForm(true)}
            className="w-full p-4 border-2 border-dashed border-[#2D3748] rounded-lg text-[#A0AEC0] hover:border-[#39FF14] hover:text-[#39FF14] transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Agregar Nueva Categoría
          </button>

          {/* New Category Form */}
          {showCategoryForm && (
            <div className="bg-[#0D0F12] rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-white">Nueva Categoría</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#A0AEC0] mb-1 block">Nombre</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="input-servistech w-full"
                    placeholder="Nombre de categoría"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A0AEC0] mb-1 block">Color</label>
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-[#A0AEC0] mb-1 block">Descripción</label>
                  <input
                    type="text"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="input-servistech w-full"
                    placeholder="Descripción de la categoría"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="btn-ghost text-sm py-1.5"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCategory}
                  className="btn-primary text-sm py-1.5"
                >
                  <Save className="w-4 h-4 inline mr-1" />
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-3">
            {categoriesWithCounts.map((cat) => (
              <div key={cat.id} className="bg-[#0D0F12] rounded-lg p-4">
                {editingCategory?.id === cat.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[#A0AEC0] mb-1 block">Nombre</label>
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          className="input-servistech w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#A0AEC0] mb-1 block">Color</label>
                        <input
                          type="color"
                          value={editingCategory.color}
                          onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-[#A0AEC0] mb-1 block">Descripción</label>
                        <input
                          type="text"
                          value={editingCategory.description}
                          onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                          className="input-servistech w-full"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="btn-ghost text-sm py-1.5"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleUpdateCategory}
                        className="btn-primary text-sm py-1.5"
                      >
                        <Save className="w-4 h-4 inline mr-1" />
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        <Tag className="w-5 h-5" style={{ color: cat.color }} />
                      </span>
                      <div>
                        <h4 className="text-white font-medium">{cat.name}</h4>
                        <p className="text-sm text-[#A0AEC0]">{cat.description}</p>
                        <p className="text-xs text-[#6B7280] mt-1">{cat.partCount} repuestos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generatePartsByCategoryPDF(cat.id)}
                        className="p-2 hover:bg-white/10 rounded text-[#A0AEC0] hover:text-[#39FF14]"
                        title="Exportar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingCategory(cat)}
                        className="p-2 hover:bg-white/10 rounded text-[#A0AEC0] hover:text-white"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 hover:bg-white/10 rounded text-[#A0AEC0] hover:text-[#FF4D4D]"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Part Dialog */}
      <Dialog open={showNewPart} onOpenChange={setShowNewPart}>
        <DialogContent className="max-w-2xl bg-[#1A1D23] border-[#2D3748] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Nuevo Repuesto</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">SKU</label>
              <input 
                type="text" 
                value={partForm.sku}
                onChange={(e) => setPartForm({ ...partForm, sku: e.target.value })}
                className="input-servistech w-full" 
                placeholder="SCR-IP14PM-OEM" 
              />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Categoría</label>
              <select 
                className="input-servistech w-full"
                value={partForm.category}
                onChange={(e) => setPartForm({ ...partForm, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm text-[#A0AEC0] mb-1 block">Nombre</label>
              <input 
                type="text" 
                value={partForm.name}
                onChange={(e) => setPartForm({ ...partForm, name: e.target.value })}
                className="input-servistech w-full" 
                placeholder="Pantalla iPhone 14 Pro Max OLED OEM" 
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-[#A0AEC0] mb-1 block">Modelos Compatibles (separados por coma)</label>
              <input 
                type="text" 
                value={partForm.compatibleModels}
                onChange={(e) => setPartForm({ ...partForm, compatibleModels: e.target.value })}
                className="input-servistech w-full" 
                placeholder="iPhone 14 Pro Max, A2894, A2895" 
              />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Costo ($)</label>
              <input 
                type="number" 
                value={partForm.costPrice}
                onChange={(e) => setPartForm({ ...partForm, costPrice: e.target.value })}
                className="input-servistech w-full" 
                placeholder="180.00" 
              />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Precio Venta ($)</label>
              <input 
                type="number" 
                value={partForm.salePrice}
                onChange={(e) => setPartForm({ ...partForm, salePrice: e.target.value })}
                className="input-servistech w-full" 
                placeholder="280.00" 
              />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Flete ($)</label>
              <input 
                type="number" 
                value={partForm.shippingCost}
                onChange={(e) => setPartForm({ ...partForm, shippingCost: e.target.value })}
                className="input-servistech w-full" 
                placeholder="15.00" 
              />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Gasto Operativo ($)</label>
              <input 
                type="number" 
                value={partForm.operationalCost}
                onChange={(e) => setPartForm({ ...partForm, operationalCost: e.target.value })}
                className="input-servistech w-full" 
                placeholder="10.00" 
              />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Stock Inicial</label>
              <input 
                type="number" 
                value={partForm.initialStock}
                onChange={(e) => setPartForm({ ...partForm, initialStock: e.target.value })}
                className="input-servistech w-full" 
                placeholder="0" 
              />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Stock Mínimo</label>
              <input 
                type="number" 
                value={partForm.minStock}
                onChange={(e) => setPartForm({ ...partForm, minStock: e.target.value })}
                className="input-servistech w-full" 
                placeholder="3" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowNewPart(false)} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={handleSavePart} className="btn-primary">
              <Save className="w-4 h-4 inline mr-1" />
              Guardar Repuesto
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent className="max-w-lg bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Nueva Transferencia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Repuesto</label>
              <select className="input-servistech w-full">
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Desde</label>
                <select className="input-servistech w-full">
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Hacia</label>
                <select className="input-servistech w-full">
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Cantidad</label>
              <input type="number" className="input-servistech w-full" placeholder="1" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowTransfer(false)} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={() => setShowTransfer(false)} className="btn-primary">
              <Truck className="w-4 h-4 inline mr-1" />
              Crear Transferencia
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
