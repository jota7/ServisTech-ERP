import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { Recepcion } from '@/components/Recepcion';
import { Laboratorio } from '@/components/Laboratorio';
import { Inventario } from '@/components/Inventario';
import { QA } from '@/components/QA';
import { POS } from '@/components/POS';
import { CierreCaja } from '@/components/CierreCaja';
import { Logistica } from '@/components/Logistica';
import { Clientes } from '@/components/Clientes';
import { Configuracion } from '@/components/Configuracion';
// V4.0 Modules
import { Garantias } from '@/components/Garantias';
import { Comisiones } from '@/components/Comisiones';
import { Metas } from '@/components/Metas';
import { TrackingMensajeros } from '@/components/TrackingMensajeros';
import { useInitializeData } from '@/hooks/useInitializeData';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [currentModule, setCurrentModule] = useState('dashboard');
  
  // Initialize mock data
  useInitializeData();

  const renderModule = () => {
    switch (currentModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'recepcion':
        return <Recepcion />;
      case 'laboratorio':
        return <Laboratorio />;
      case 'inventario':
        return <Inventario />;
      case 'qa':
        return <QA />;
      case 'pos':
        return <POS />;
      case 'caja':
        return <CierreCaja />;
      case 'logistica':
        return <Logistica />;
      case 'clientes':
        return <Clientes />;
      case 'configuracion':
        return <Configuracion />;
      // V4.0 Modules
      case 'garantias':
        return <Garantias />;
      case 'comisiones':
        return <Comisiones />;
      case 'metas':
        return <Metas />;
      case 'tracking':
        return <TrackingMensajeros />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Layout currentModule={currentModule} onModuleChange={setCurrentModule}>
        {renderModule()}
      </Layout>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1D23',
            border: '1px solid #2D3748',
            color: '#FFFFFF',
          },
        }}
      />
    </>
  );
}

export default App;
