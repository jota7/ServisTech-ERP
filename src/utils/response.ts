import { Response } from 'express';

/**
 * Respuesta exitosa estandarizada para ServisTech
 */
export const successResponse = (res: Response, data: any, message: string = 'Operación exitosa', statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Respuesta de error estandarizada para ServisTech
 */
export const errorResponse = (res: Response, message: string = 'Ha ocurrido un error', statusCode: number = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};