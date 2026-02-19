import { useState } from 'react';
import { useCustomerStore, useServiceOrderStore } from '@/store';
import type { Customer } from '@/types';
import {
  Plus,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  History,
  Edit,
  ChevronRight,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function Clientes() {
  const { customers, addCustomer, updateCustomer: _updateCustomer } = useCustomerStore();
  const { orders } = useServiceOrderStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // New customer form
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    documentId: '',
    address: '',
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.documentId.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCustomer = () => {
    const customer: Customer = {
      id: `c-${Date.now()}`,
      name: newCustomer.name || '',
      email: newCustomer.email || '',
      phone: newCustomer.phone || '',
      documentId: newCustomer.documentId || '',
      address: newCustomer.address,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addCustomer(customer);
    setShowNewCustomer(false);
    setNewCustomer({ name: '', email: '', phone: '', documentId: '', address: '' });
  };

  const getCustomerOrders = (customerId: string) => {
    return orders.filter((o) => o.customerId === customerId);
  };

  const getCustomerStats = (customerId: string) => {
    const customerOrders = getCustomerOrders(customerId);
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.finalCost, 0);
    return {
      totalOrders: customerOrders.length,
      totalSpent,
      completedOrders: customerOrders.filter((o) => o.status === 'entregado').length,
    };
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-[#A0AEC0] mt-1">Gestión de clientes y historial</p>
        </div>
        <button onClick={() => setShowNewCustomer(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-servistech w-full pl-10"
          placeholder="Buscar por nombre, teléfono, cédula o email..."
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => {
          const stats = getCustomerStats(customer.id);
          return (
            <div
              key={customer.id}
              className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4 hover:border-[#39FF14] transition-colors cursor-pointer"
              onClick={() => {
                setSelectedCustomer(customer);
                setShowDetail(true);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#39FF14] to-[#00B2FF] flex items-center justify-center">
                    <span className="text-lg font-bold text-[#0D0F12]">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{customer.name}</p>
                    <p className="font-mono text-sm text-[#39FF14]">{customer.documentId}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#6B7280]" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-[#A0AEC0]">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#2D3748]">
                <div className="text-center">
                  <p className="text-lg font-bold text-[#39FF14]">{stats.totalOrders}</p>
                  <p className="text-xs text-[#A0AEC0]">Órdenes</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#00B2FF]">{stats.completedOrders}</p>
                  <p className="text-xs text-[#A0AEC0]">Completadas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">${stats.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-[#A0AEC0]">Total</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Customer Dialog */}
      <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
        <DialogContent className="max-w-md bg-[#1A1D23] border-[#2D3748] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <User className="w-6 h-6 text-[#39FF14]" />
              Nuevo Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Nombre Completo *</label>
              <input
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="input-servistech w-full"
                placeholder="Nombre y Apellido"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Cédula/RIF *</label>
                <input
                  type="text"
                  value={newCustomer.documentId}
                  onChange={(e) => setNewCustomer({ ...newCustomer, documentId: e.target.value })}
                  className="input-servistech w-full"
                  placeholder="V-12345678"
                />
              </div>
              <div>
                <label className="text-sm text-[#A0AEC0] mb-1 block">Teléfono *</label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="input-servistech w-full"
                  placeholder="+58 412-123-4567"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Email</label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className="input-servistech w-full"
                placeholder="cliente@email.com"
              />
            </div>
            <div>
              <label className="text-sm text-[#A0AEC0] mb-1 block">Dirección</label>
              <textarea
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                className="input-servistech w-full h-20 resize-none"
                placeholder="Dirección completa"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowNewCustomer(false)} className="btn-ghost">
              Cancelar
            </button>
            <button
              onClick={handleAddCustomer}
              disabled={!newCustomer.name || !newCustomer.documentId || !newCustomer.phone}
              className="btn-primary disabled:opacity-50"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Guardar Cliente
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl bg-[#1A1D23] border-[#2D3748] text-white max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#39FF14] to-[#00B2FF] flex items-center justify-center">
                    <span className="text-lg font-bold text-[#0D0F12]">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white">{selectedCustomer.name}</p>
                    <p className="font-mono text-sm text-[#39FF14]">{selectedCustomer.documentId}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#0D0F12] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[#A0AEC0] mb-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Teléfono</span>
                  </div>
                  <p className="text-white">{selectedCustomer.phone}</p>
                </div>
                {selectedCustomer.email && (
                  <div className="bg-[#0D0F12] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-[#A0AEC0] mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Email</span>
                    </div>
                    <p className="text-white">{selectedCustomer.email}</p>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="col-span-2 bg-[#0D0F12] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-[#A0AEC0] mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Dirección</span>
                    </div>
                    <p className="text-white">{selectedCustomer.address}</p>
                  </div>
                )}
              </div>

              {/* Order History */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#00B2FF]" />
                  Historial de Órdenes
                </h4>
                <div className="space-y-2">
                  {getCustomerOrders(selectedCustomer.id).length === 0 ? (
                    <p className="text-[#6B7280] text-center py-4">Sin órdenes registradas</p>
                  ) : (
                    getCustomerOrders(selectedCustomer.id).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 bg-[#0D0F12] rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              order.status === 'entregado'
                                ? 'bg-[#39FF14]'
                                : order.status === 'listo'
                                ? 'bg-[#00B2FF]'
                                : 'bg-[#FFB020]'
                            }`}
                          />
                          <div>
                            <p className="text-white text-sm font-medium">{order.orderNumber}</p>
                            <p className="text-xs text-[#A0AEC0]">{order.reportedIssue}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[#39FF14] font-mono text-sm">
                            ${order.finalCost || order.estimatedCost}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {order.createdAt.toLocaleDateString('es-VE')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#2D3748]">
                <button className="btn-secondary">
                  <Edit className="w-4 h-4 inline mr-1" />
                  Editar
                </button>
                <button onClick={() => setShowDetail(false)} className="btn-ghost">
                  Cerrar
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
