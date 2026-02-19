import { useEffect } from 'react';
import {
  useAuthStore,
  useStoreStore,
  useBCVRateStore,
  useServiceOrderStore,
  useInventoryStore,
  useCustomerStore,
  useInvoiceStore,
  useCashRegisterStore,
  useLogisticsStore,
} from '@/store';
import {
  mockUsers,
  mockStores,
  mockBCVRate,
  mockServiceOrders,
  mockParts,
  mockStockTransfers,
  mockCustomers,
  mockInvoices,
  mockCashRegisters,
  mockSafeKits,
  mockCourtesyDevices,
} from '@/data/mockData';

export function useInitializeData() {
  const { user, login } = useAuthStore();
  const { setStores, setCurrentStore } = useStoreStore();
  const { setCurrentRate, addRateHistory } = useBCVRateStore();
  const { setOrders } = useServiceOrderStore();
  const { setParts, setTransfers } = useInventoryStore();
  const { setCustomers } = useCustomerStore();
  const { setInvoices } = useInvoiceStore();
  const { setRegisters, setCurrentRegister } = useCashRegisterStore();
  const { setSafeKits, setCourtesyDevices } = useLogisticsStore();

  useEffect(() => {
    // Only initialize if not already authenticated (for demo purposes)
    if (!user) {
      // Login default user
      login(mockUsers[0]);
      
      // Initialize stores
      setStores(mockStores);
      setCurrentStore(mockStores[0]);
      
      // Initialize BCV rate
      setCurrentRate(mockBCVRate);
      addRateHistory(mockBCVRate);
      
      // Initialize service orders
      setOrders(mockServiceOrders);
      
      // Initialize inventory
      setParts(mockParts);
      setTransfers(mockStockTransfers);
      
      // Initialize customers (combine with devices data)
      setCustomers(mockCustomers);
      
      // Initialize invoices
      setInvoices(mockInvoices);
      
      // Initialize cash registers
      setRegisters(mockCashRegisters);
      const openRegister = mockCashRegisters.find(r => r.status === 'open');
      if (openRegister) {
        setCurrentRegister(openRegister);
      }
      
      // Initialize logistics
      setSafeKits(mockSafeKits);
      setCourtesyDevices(mockCourtesyDevices);
    }
  }, []);
}
