import { Router } from 'express';
import authRoutes from './authRoutes';
import inventoryRoutes from './inventoryRoutes';
import invoiceRoutes from './invoiceRoutes';
import orderRoutes from './orderRoutes';
import storeRoutes from './storeRoutes';
import userRoutes from './userRoutes';
import customerRoutes from './customerRoutes';
import bcvRoutes from './bcvRoutes';
import dashboardRoutes from './dashboardRoutes';
import cashRegisterRoutes from './cashRegisterRoutes';

const router = Router();

// ==========================================
// 🏥 HEALTHCHECK (Vital para Railway)
// ==========================================
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ServisTech API is healthy and running!' });
});

// ==========================================
// 🔌 CONEXIÓN DE MÓDULOS DE SERVISTECH
// ==========================================
router.use('/auth', authRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/orders', orderRoutes);
router.use('/stores', storeRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/bcv', bcvRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/cash-register', cashRegisterRoutes);

export default router;