/**
 * SERVISTECH V4.0 - Store Isolation Middleware
 * Implementa Row Level Security (RLS) a nivel de aplicación
 * Cada query debe incluir el store_id del usuario autenticado
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extiende la interfaz Request para incluir store context
declare global {
  namespace Express {
    interface Request {
      storeContext?: {
        storeId: string;
        role: string;
        isSuperAdmin: boolean;
      };
    }
  }
}

/**
 * Middleware que inyecta el store_id en cada request
 * Super-Admin puede ver todas las sedes
 * Otros roles solo ven su sede asignada
 */
export const storeIsolationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Obtener usuario del token JWT
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Buscar usuario con su sede
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, storeId: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Configurar contexto de store
    req.storeContext = {
      storeId: user.storeId,
      role: user.role,
      isSuperAdmin: user.role === 'SUPER_ADMIN',
    };

    next();
  } catch (error) {
    console.error('Store isolation error:', error);
    return res.status(500).json({ error: 'Error en aislamiento de sede' });
  }
};

/**
 * Helper para construir where clause con store isolation
 * Uso: buildWhereClause(req, { status: 'ACTIVE' })
 */
export const buildWhereClause = (
  req: Request,
  additionalFilters: Record<string, any> = {}
) => {
  const { storeId, isSuperAdmin } = req.storeContext || {};

  // Super-Admin no tiene restricción de sede
  if (isSuperAdmin) {
    return additionalFilters;
  }

  // Otros roles solo ven su sede
  return {
    ...additionalFilters,
    storeId,
  };
};

/**
 * Middleware específico para técnicos
 * Solo pueden ver órdenes asignadas a ellos
 */
export const technicianRestrictionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { role, storeId } = req.storeContext || {};

  if (role === 'TECNICO') {
    // Agregar filtro de assignedToId para técnicos
    req.storeContext = {
      ...req.storeContext,
      technicianFilter: true,
    } as any;
  }

  next();
};

/**
 * Verifica que el usuario tenga acceso a un recurso específico
 * Uso: await verifyResourceAccess(req, 'order', orderId)
 */
export const verifyResourceAccess = async (
  req: Request,
  model: string,
  resourceId: string
): Promise<boolean> => {
  const { storeId, isSuperAdmin } = req.storeContext || {};

  if (isSuperAdmin) return true;

  try {
    // @ts-ignore - Dynamic model access
    const resource = await prisma[model].findUnique({
      where: { id: resourceId },
      select: { storeId: true },
    });

    return resource?.storeId === storeId;
  } catch (error) {
    console.error('Resource access verification error:', error);
    return false;
  }
};
