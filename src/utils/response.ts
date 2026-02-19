import { Response } from 'express';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: ApiResponse['meta']
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  error: string,
  statusCode = 400,
  details?: unknown
): void => {
  const response: ApiResponse = {
    success: false,
    error,
  };
  
  if (details && process.env.NODE_ENV === 'development') {
    (response as Record<string, unknown>).details = details;
  }
  
  res.status(statusCode).json(response);
};

export const createdResponse = <T>(
  res: Response,
  data: T,
  message = 'Created successfully'
): void => {
  successResponse(res, data, message, 201);
};

export const noContentResponse = (res: Response): void => {
  res.status(204).send();
};

// Pagination helper
export const paginate = (
  page: number,
  limit: number,
  total: number
) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  skip: (page - 1) * limit,
});
