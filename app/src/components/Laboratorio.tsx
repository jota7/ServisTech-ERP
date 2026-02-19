import { useState } from 'react';
import { useServiceOrderStore, useStoreStore } from '@/store';
import type { ServiceOrder } from '@/types';
import {
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Wrench,
  Plus,
  Timer,
  Camera,
  FileText,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const columns = [
  { id: 'triaje', label: 'Triaje', color: '#A0AEC0' },
  { id: 'diagnostico', label: 'Diagnóstico', color: '#00B2FF' },
  { id: 'espera-repuesto', label: 'Espera Repuesto', color: '#FFB020' },
  { id: 'micro-soldadura', label: 'Micro-soldadura', color: '#8B5CF6' },
  { id: 'qa', label: 'QA', color: '#F472B6' },
  { id: 'listo', label: 'Listo', color: '#39FF14' },
] as const;

interface KanbanCardProps {
  order: ServiceOrder;
  onClick: () => void;
}

function KanbanCard({ order, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    baja: 'bg-[#A0AEC0]',
    media: 'bg-[#00B2FF]',
    alta: 'bg-[#FFB020]',
    urgente: 'bg-[#FF4D4D]',
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="kanban-card mb-3"
      style={{
        ...style,
        borderLeftColor: columns.find((c) => c.id === order.status)?.color || '#39FF14',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-xs text-[#39FF14]">{order.orderNumber}</span>
        <div className={`w-2 h-2 rounded-full ${priorityColors[order.priority]}`} />
      </div>
      <p className="text-white text-sm font-medium mb-2 line-clamp-2">
        {order.reportedIssue}
      </p>
      <div className="flex items-center gap-3 text-xs text-[#A0AEC0]">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            {order.timeTracking.reduce((sum, t) => sum + (t.duration || 0), 0)} min
          </span>
        </div>
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>Téc. {order.assignedTo || 'Sin asignar'}</span>
        </div>
      </div>
      {order.partsUsed.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-[#39FF14]">
          <Wrench className="w-3 h-3" />
          <span>{order.partsUsed.length} repuestos</span>
        </div>
      )}
    </div>
  );
}

interface KanbanColumnProps {
  column: typeof columns[number];
  orders: ServiceOrder[];
  onCardClick: (order: ServiceOrder) => void;
}

function KanbanColumn({ column, orders, onCardClick }: KanbanColumnProps) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'column', column },
  });

  return (
    <div ref={setNodeRef} className="kanban-column flex-shrink-0">
      <div className="kanban-column-header">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <span className="text-white font-medium text-sm">{column.label}</span>
        </div>
        <span className="bg-[#252A33] text-[#A0AEC0] text-xs px-2 py-1 rounded-full">
          {orders.length}
        </span>
      </div>
      <div className="p-3 min-h-[200px]">
        <SortableContext
          items={orders.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {orders.map((order) => (
            <KanbanCard key={order.id} order={order} onClick={() => onCardClick(order)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function Laboratorio() {
  const { orders, updateOrderStatus } = useServiceOrderStore();
  const { currentStore } = useStoreStore();
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const storeOrders = orders.filter((o) => o.storeId === currentStore?.id);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const orderId = active.id as string;
    const newStatus = over.id as ServiceOrder['status'];

    if (columns.some((c) => c.id === newStatus)) {
      updateOrderStatus(orderId, newStatus);
    }
  };

  const activeOrder = activeId ? orders.find((o) => o.id === activeId) : null;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Laboratorio</h1>
          <p className="text-[#A0AEC0] mt-1">Zona 2 - Flujo Kanban de reparaciones</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg px-4 py-2">
            <span className="text-sm text-[#A0AEC0]">Órdenes activas: </span>
            <span className="text-sm text-[#39FF14] font-medium">{storeOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-dark">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              orders={storeOrders.filter((o) => o.status === column.id)}
              onCardClick={setSelectedOrder}
            />
          ))}
        </div>

        <DragOverlay>
          {activeOrder ? (
            <div className="kanban-card opacity-90 rotate-2">
              <div className="flex items-start justify-between mb-2">
                <span className="font-mono text-xs text-[#39FF14]">
                  {activeOrder.orderNumber}
                </span>
              </div>
              <p className="text-white text-sm font-medium mb-2">
                {activeOrder.reportedIssue}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl bg-[#1A1D23] border-[#2D3748] text-white max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-bold flex items-center gap-3">
                    <span className="font-mono text-[#39FF14]">{selectedOrder.orderNumber}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        selectedOrder.priority === 'urgente'
                          ? 'bg-[#FF4D4D]/20 text-[#FF4D4D]'
                          : selectedOrder.priority === 'alta'
                          ? 'bg-[#FFB020]/20 text-[#FFB020]'
                          : 'bg-[#00B2FF]/20 text-[#00B2FF]'
                      }`}
                    >
                      {selectedOrder.priority.toUpperCase()}
                    </span>
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-[#0D0F12] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#FFB020]" />
                      Problema Reportado
                    </h4>
                    <p className="text-sm text-[#A0AEC0]">{selectedOrder.reportedIssue}</p>
                  </div>

                  {selectedOrder.diagnosis && (
                    <div className="bg-[#0D0F12] rounded-lg p-4">
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#39FF14]" />
                        Diagnóstico
                      </h4>
                      <p className="text-sm text-[#A0AEC0]">{selectedOrder.diagnosis}</p>
                    </div>
                  )}

                  {/* Time Tracking */}
                  <div className="bg-[#0D0F12] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <Timer className="w-4 h-4 text-[#00B2FF]" />
                      Time Tracking
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.timeTracking.length > 0 ? (
                        selectedOrder.timeTracking.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-[#A0AEC0]">{entry.description}</span>
                            <span className="text-[#39FF14] font-mono">
                              {entry.duration} min
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[#6B7280]">Sin registros de tiempo</p>
                      )}
                    </div>
                    <button className="btn-secondary w-full mt-3 text-xs py-2">
                      <Timer className="w-3 h-3 inline mr-1" />
                      Iniciar Timer
                    </button>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Parts Used */}
                  <div className="bg-[#0D0F12] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#8B5CF6]" />
                      Repuestos Utilizados
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.partsUsed.length > 0 ? (
                        selectedOrder.partsUsed.map((part, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm p-2 bg-[#1A1D23] rounded"
                          >
                            <span className="text-[#A0AEC0]">{part.partId}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[#6B7280]">x{part.quantity}</span>
                              <span className="text-[#39FF14] font-mono">
                                ${part.salePrice}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[#6B7280]">Sin repuestos registrados</p>
                      )}
                    </div>
                    <button className="btn-secondary w-full mt-3 text-xs py-2">
                      <Plus className="w-3 h-3 inline mr-1" />
                      Agregar Repuesto
                    </button>
                  </div>

                  {/* Photos */}
                  <div className="bg-[#0D0F12] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#F472B6]" />
                      Fotos Internas
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="aspect-square bg-[#1A1D23] border border-dashed border-[#2D3748] rounded flex items-center justify-center cursor-pointer hover:border-[#39FF14]"
                        >
                          <Plus className="w-4 h-4 text-[#6B7280]" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bg-[#0D0F12] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#A0AEC0]" />
                      Notas Técnicas
                    </h4>
                    <textarea
                      className="input-servistech w-full h-24 resize-none text-sm"
                      placeholder="Agregar notas sobre la reparación..."
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#2D3748]">
                <button onClick={() => setSelectedOrder(null)} className="btn-ghost">
                  Cerrar
                </button>
                <button className="btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
