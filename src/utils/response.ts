import { Response } from 'express';

export const successResponse = (res: Response, data: any, message: string = 'Operación exitosa', statusCode: number = 200, meta: any = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: Object.keys(meta).length > 0 ? meta : undefined
  });
};

export const createdResponse = (res: Response, data: any, message: string = 'Recurso creado con éxito') => {
  return successResponse(res, data, message, 201);
};

export const errorResponse = (res: Response, message: string = 'Ha ocurrido un error', statusCode: number = 500, errors: any = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

export const paginate = (items: any[], total: number, page: number, limit: number) => {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};