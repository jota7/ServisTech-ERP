import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

// Nota: Asegúrate de tener estos archivos en utils/ o el servidor fallará
// Si no los tienes, dime y te los genero.
import { errorResponse } from '../utils/response'; 
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction // No quitar este parámetro
): void => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      errorResponse(res, `El dato ya existe en el sistema`, 409);
      return;
    }
    if (err.code === 'P2025') {
      errorResponse(res, 'Registro no encontrado', 404);
      return;
    }
  }

  if (err instanceof AppError) {
    errorResponse(res, err.message, err.statusCode);
    return;
  }

  const message = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : err.message;
    
  errorResponse(res, message, 500);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};