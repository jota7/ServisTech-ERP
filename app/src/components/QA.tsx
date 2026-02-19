import { useState } from 'react';
import { useServiceOrderStore, useStoreStore } from '@/store';
import type { ServiceOrder, QATest } from '@/types';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ClipboardCheck,
  Printer,
  QrCode,
  Smartphone,
  Wifi,
  Volume2,
  Camera,
  Battery,
  Fingerprint,
  Sun,
  Mic,
  Speaker,
  Save,
  Lock,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const qaTests = [
  { id: 'power', name: 'Encendido/Apagado', icon: Smartphone },
  { id: 'touch', name: 'Touch Screen', icon: Smartphone },
  { id: 'display', name: 'Display/Colores', icon: Sun },
  { id: 'wifi', name: 'WiFi', icon: Wifi },
  { id: 'bluetooth', name: 'Bluetooth', icon: Wifi },
  { id: 'cellular', name: 'Red Celular', icon: Smartphone },
  { id: 'camera-front', name: 'Cámara Frontal', icon: Camera },
  { id: 'camera-back', name: 'Cámara Trasera', icon: Camera },
  { id: 'flash', name: 'Flash', icon: Sun },
  { id: 'fingerprint', name: 'Face ID/Touch ID', icon: Fingerprint },
  { id: 'battery', name: 'Batería/Carga', icon: Battery },
  { id: 'audio', name: 'Audio/Auricular', icon: Volume2 },
  { id: 'microphone', name: 'Micrófono', icon: Mic },
  { id: 'speaker', name: 'Altavoz', icon: Speaker },
  { id: 'buttons', name: 'Botones', icon: Smartphone },
  { id: 'sensors', name: 'Sensores', icon: Smartphone },
];

export function QA() {
  const { orders, updateOrder } = useServiceOrderStore();
  const { currentStore } = useStoreStore();
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [qaNotes, setQaNotes] = useState('');

  // Orders ready for QA (status = 'listo' or in QA)
  const qaOrders = orders.filter(
    (o) =>
      o.storeId === currentStore?.id &&
      (o.status === 'qa' || o.status === 'listo' || o.status === 'micro-soldadura')
  );

  const handleStartQA = (order: ServiceOrder) => {
    setSelectedOrder(order);
    // Initialize test results from existing QA if available
    if (order.qaResults) {
      const results: Record<string, boolean> = {};
      order.qaResults.tests.forEach((t) => {
        results[t.id] = t.passed;
      });
      setTestResults(results);
      setQaNotes(order.qaResults.notes || '');
    } else {
      setTestResults({});
      setQaNotes('');
    }
  };

  const handleSaveQA = () => {
    if (!selectedOrder) return;

    const tests: QATest[] = qaTests.map((test) => ({
      id: test.id,
      name: test.name,
      passed: testResults[test.id] || false,
    }));

    const allPassed = tests.every((t) => t.passed);

    updateOrder(selectedOrder.id, {
      qaResults: {
        passed: allPassed,
        testDate: new Date(),
        testedBy: 'u5', // Current user
        tests,
        notes: qaNotes,
      },
      status: allPassed ? 'listo' : 'micro-soldadura',
    });

    setSelectedOrder(null);
  };

  const passedCount = Object.values(testResults).filter(Boolean).length;
  const totalTests = qaTests.length;
  const progress = (passedCount / totalTests) * 100;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">QA y Salida</h1>
          <p className="text-[#A0AEC0] mt-1">Zona 4 - Control de calidad y entrega</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg px-4 py-2">
            <span className="text-sm text-[#A0AEC0]">Pendientes QA: </span>
            <span className="text-sm text-[#FFB020] font-medium">
              {qaOrders.filter((o) => o.status !== 'listo').length}
            </span>
          </div>
          <div className="bg-[#1A1D23] border border-[#2D3748] rounded-lg px-4 py-2">
            <span className="text-sm text-[#A0AEC0]">Listos: </span>
            <span className="text-sm text-[#39FF14] font-medium">
              {qaOrders.filter((o) => o.status === 'listo').length}
            </span>
          </div>
        </div>
      </div>

      {/* QA Info Banner */}
      <div className="bg-[rgba(0,178,255,0.1)] border border-[#00B2FF]/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-[#00B2FF]" />
          <div>
            <p className="text-white font-medium">Bloqueo de Seguridad Activado</p>
            <p className="text-sm text-[#A0AEC0]">
              No se puede facturar sin aprobar el Test de 10 Puntos de QA
            </p>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {qaOrders.map((order) => (
          <div
            key={order.id}
            className="bg-[#1A1D23] border border-[#2D3748] rounded-lg p-4 hover:border-[#39FF14] transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="font-mono text-sm text-[#39FF14]">{order.orderNumber}</span>
                <p className="text-white font-medium mt-1">{order.reportedIssue}</p>
              </div>
              <div
                className={`px-2 py-1 rounded text-xs ${
                  order.status === 'listo'
                    ? 'bg-[rgba(57,255,20,0.15)] text-[#39FF14]'
                    : order.status === 'qa'
                    ? 'bg-[rgba(0,178,255,0.15)] text-[#00B2FF]'
                    : 'bg-[rgba(139,92,246,0.15)] text-[#8B5CF6]'
                }`}
              >
                {order.status === 'listo' ? 'Listo' : order.status === 'qa' ? 'En QA' : 'En Reparación'}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A0AEC0]">Cliente:</span>
                <span className="text-white">{order.customerId}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A0AEC0]">Técnico:</span>
                <span className="text-white">{order.assignedTo || 'Sin asignar'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A0AEC0]">Repuestos:</span>
                <span className="text-white">{order.partsUsed.length} usados</span>
              </div>
            </div>

            {order.qaResults && (
              <div className="bg-[#0D0F12] rounded p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#A0AEC0]">Test de 16 Puntos</span>
                  <span
                    className={`text-sm font-medium ${
                      order.qaResults.passed ? 'text-[#39FF14]' : 'text-[#FF4D4D]'
                    }`}
                  >
                    {order.qaResults.tests.filter((t) => t.passed).length}/16
                  </span>
                </div>
                <div className="w-full h-2 bg-[#2D3748] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      order.qaResults.passed ? 'bg-[#39FF14]' : 'bg-[#FFB020]'
                    }`}
                    style={{
                      width: `${(order.qaResults.tests.filter((t) => t.passed).length / 16) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {order.status !== 'listo' ? (
                <button
                  onClick={() => handleStartQA(order)}
                  className="btn-primary flex-1 text-sm py-2"
                >
                  <ClipboardCheck className="w-4 h-4 inline mr-1" />
                  {order.qaResults ? 'Rehacer QA' : 'Iniciar QA'}
                </button>
              ) : (
                <>
                  <button className="btn-secondary flex-1 text-sm py-2">
                    <QrCode className="w-4 h-4 inline mr-1" />
                    Escaneo
                  </button>
                  <button className="btn-primary flex-1 text-sm py-2">
                    <Printer className="w-4 h-4 inline mr-1" />
                    Ticket
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* QA Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl bg-[#1A1D23] border-[#2D3748] text-white max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-3">
                  <ClipboardCheck className="w-6 h-6 text-[#39FF14]" />
                  Test de 16 Puntos - QA
                  <span className="font-mono text-lg text-[#39FF14]">
                    {selectedOrder.orderNumber}
                  </span>
                </DialogTitle>
              </DialogHeader>

              {/* Progress */}
              <div className="bg-[#0D0F12] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#A0AEC0]">Progreso</span>
                  <span className="text-sm font-medium text-white">
                    {passedCount}/{totalTests} tests
                  </span>
                </div>
                <div className="w-full h-3 bg-[#2D3748] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      progress === 100 ? 'bg-[#39FF14]' : 'bg-[#00B2FF]'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Tests Grid */}
              <div className="grid grid-cols-2 gap-3">
                {qaTests.map((test) => {
                  const passed = testResults[test.id] || false;

                  return (
                    <button
                      key={test.id}
                      onClick={() =>
                        setTestResults({ ...testResults, [test.id]: !passed })
                      }
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        passed
                          ? 'border-[#39FF14] bg-[rgba(57,255,20,0.1)]'
                          : 'border-[#2D3748] bg-[#0D0F12] hover:border-[#FF4D4D]'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          passed ? 'bg-[#39FF14]' : 'bg-[#FF4D4D]'
                        }`}
                      >
                        {passed ? (
                          <CheckCircle className="w-4 h-4 text-[#0D0F12]" />
                        ) : (
                          <XCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-medium ${passed ? 'text-[#39FF14]' : 'text-white'}`}>
                          {test.name}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm text-[#A0AEC0] mb-2 block">Notas QA</label>
                <textarea
                  value={qaNotes}
                  onChange={(e) => setQaNotes(e.target.value)}
                  className="input-servistech w-full h-24 resize-none"
                  placeholder="Observaciones del control de calidad..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-[#2D3748]">
                <div className="flex items-center gap-2">
                  {passedCount === totalTests ? (
                    <span className="text-[#39FF14] flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Listo para entrega
                    </span>
                  ) : (
                    <span className="text-[#FFB020] flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Requiere revisión
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSelectedOrder(null)} className="btn-ghost">
                    Cancelar
                  </button>
                  <button onClick={handleSaveQA} className="btn-primary">
                    <Save className="w-4 h-4 inline mr-1" />
                    Guardar QA
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
