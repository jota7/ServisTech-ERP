import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Cargar variables de entorno
dotenv.config();

import { logger } from '@/utils/logger';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { bcvScraper } from '@/services/bcvScraper';

// Importar rutas
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

const app = express();

// Configuración de Puerto y Host para Railway
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0'; 

// Middleware de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS mejorado
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Permite todo si no hay URL definida
  credentials: true,
}));

// Limitador de peticiones general
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, 
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Límite estricto para Login (Seguridad de ServisTech)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later.',
});
app.use('/api/auth/login', authLimiter);

// Parsing de cuerpos (Ajustado para fotos de reparaciones)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de peticiones
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// ==========================================
// RUTA DE SALUD (VITAL PARA RAILWAY)
// ==========================================
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ServisTech ERP API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rutas de la API
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

// Manejador de rutas no encontradas
app.use(notFoundHandler);

// Manejador de errores global
app.use(errorHandler);

// Tarea programada BCV (Solo si está habilitado)
if (process.env.BCV_SCRAPER_ENABLED === 'true') {
  cron.schedule(process.env.BCV_SCRAPER_CRON || '0 8 * * *', async () => {
    logger.info('Running BCV scraper cron job...');
    try {
      await bcvScraper.updateRate();
    } catch (error) {
      logger.error('Error in BCV scraper cron job:', error);
    }
  });
  
  logger.info('BCV scraper cron job scheduled');
}

// ==========================================
// ARRANQUE DEL SERVIDOR
// ==========================================
app.listen(PORT, HOST, () => {
  logger.info(`🚀 SERVISTECH API is live!`);
  logger.info(`📡 URL: http://${HOST}:${PORT}`);
  logger.info(`✅ Health Check: http://${HOST}:${PORT}/health`);
  logger.info(`🔧 Mode: ${process.env.NODE_ENV || 'development'}`);
});

export default app;