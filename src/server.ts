import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Prisma } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler'; // Usando ruta relativa para evitar fallos de alias iniciales
import routes from './routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 🛠️ PARCHES DE COMPATIBILIDAD
// ==========================================
// Permite que BigInt y Decimal se envíen en los JSON de respuesta
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Parche para los campos Decimal de Prisma (Precios, Tasas)
if (Prisma.Decimal) {
  (Prisma.Decimal.prototype as any).toJSON = function () {
    return this.toNumber();
  };
}

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ==========================================
// RUTAS
// ==========================================

// Ruta raíz de salud
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    status: 'online',
    service: 'ServisTech API',
    version: '1.0.0'
  });
});

app.use('/api', routes);

// ==========================================
// GESTIÓN DE ERRORES (Debe ir después de las rutas)
// ==========================================
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

app.listen(PORT, () => {
  console.log(`🚀 ServisTech Server running on port ${PORT}`);
});

export default app;