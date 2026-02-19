import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Load environment variables
dotenv.config();

import { logger } from '@/utils/logger';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { bcvScraper } from '@/services/bcvScraper';

// Import routes
import authRoutes from '@/routes/authRoutes';
import userRoutes from '@/routes/userRoutes';
import customerRoutes from '@/routes/customerRoutes';
import orderRoutes from '@/routes/orderRoutes';
import inventoryRoutes from '@/routes/inventoryRoutes';
import invoiceRoutes from '@/routes/invoiceRoutes';
import cashRegisterRoutes from '@/routes/cashRegisterRoutes';
import storeRoutes from '@/routes/storeRoutes';
import dashboardRoutes from '@/routes/dashboardRoutes';
import bcvRoutes from '@/routes/bcvRoutes';

// V4.0 Routes
import warrantyRoutes from '@/routes/warrantyRoutes';
import commissionRoutes from '@/routes/commissionRoutes';
import targetRoutes from '@/routes/targetRoutes';
import deliveryRoutes from '@/routes/deliveryRoutes';
import pettyCashRoutes from '@/routes/pettyCashRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later.',
});
app.use('/api/auth/login', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '4.0.0',
    features: [
      'multi-tenancy',
      'warranty-management',
      'commission-system',
      'target-tracking',
      'delivery-portal',
      'petty-cash',
      'binance-rates',
    ],
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/cash-register', cashRegisterRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bcv', bcvRoutes);

// V4.0 Routes
app.use('/api/warranties', warrantyRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/petty-cash', pettyCashRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// BCV Scraper Cron Job (runs daily at 8 AM)
if (process.env.BCV_SCRAPER_ENABLED === 'true') {
  cron.schedule(process.env.BCV_SCRAPER_CRON || '0 8 * * *', async () => {
    logger.info('Running BCV scraper cron job...');
    await bcvScraper.updateRate();
  });
  
  logger.info('BCV scraper cron job scheduled');
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 SERVISTECH API running on port ${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/health`);
  logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
