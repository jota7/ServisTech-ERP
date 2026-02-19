/**
 * SERVISTECH V4.0 - Audit Logger Middleware
 * Registra todo cambio financiero, garantía y modificación importante
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos de entidades que se auditan
export const AUDITABLE_ENTITIES = [
  'order',
  'invoice',
  'payment',
  'warranty',
  'rate',
  'commission',
  'debit',
  'inventory',
  'user',
  'setting',
] as const;

export type AuditableEntity = typeof AUDITABLE_ENTITIES[number];

// Acciones auditables
export const AUDITABLE_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  STATUS_CHANGE: 'STATUS_CHANGE',
  RATE_MANUAL: 'RATE_MANUAL',
  COMMISSION_PAY: 'COMMISSION_PAY',
  DEBIT_APPLY: 'DEBIT_APPLY',
} as const;

export type AuditableAction = typeof AUDITABLE_ACTIONS[keyof typeof AUDITABLE_ACTIONS];

/**
 * Interface para datos de auditoría
 */
interface AuditData {
  action: AuditableAction;
  entityType: AuditableEntity;
  entityId: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Guarda un registro de auditoría en la base de datos
 */
export const logAudit = async (
  req: Request,
  data: AuditData
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const storeId = req.storeContext?.storeId;
    
    if (!userId) {
      console.warn('Audit log skipped: No user in request');
      return;
    }

    await prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValue: data.oldValue || null,
        newValue: data.newValue || null,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || null,
        storeId: storeId || null,
        userId,
      },
    });
  } catch (error) {
    console.error('Error saving audit log:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
};

/**
 * Middleware que captura cambios en respuestas
 * Uso: app.use('/api/orders', auditMiddleware('order'));
 */
export const auditMiddleware = (entityType: AuditableEntity) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Solo auditar métodos que modifican datos
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    // Capturar el valor original si es UPDATE
    let oldValue: Record<string, any> | undefined;
    
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const entityId = req.params.id;
      if (entityId) {
        try {
          // @ts-ignore
          oldValue = await prisma[entityType].findUnique({
            where: { id: entityId },
          });
        } catch (e) {
          // Ignorar error, continuamos sin oldValue
        }
      }
    }

    // Interceptar la respuesta
    const originalSend = res.send.bind(res);
    
    res.send = function(body: any) {
      // Restaurar send original
      res.send = originalSend;
      
      // Procesar respuesta
      try {
        const responseData = typeof body === 'string' ? JSON.parse(body) : body;
        
        // Determinar acción
        let action: AuditableAction = AUDITABLE_ACTIONS.UPDATE;
        if (req.method === 'POST') action = AUDITABLE_ACTIONS.CREATE;
        if (req.method === 'DELETE') action = AUDITABLE_ACTIONS.DELETE;
        
        // Detectar cambios de estado
        if (req.body?.status && oldValue?.status !== req.body.status) {
          action = AUDITABLE_ACTIONS.STATUS_CHANGE;
        }

        // Extraer entityId de la respuesta o params
        const entityId = responseData?.id || req.params.id || 'unknown';

        // Guardar auditoría asíncronamente
        logAudit(req, {
          action,
          entityType,
          entityId,
          oldValue: oldValue || undefined,
          newValue: responseData,
        });
      } catch (e) {
        console.error('Error processing audit:', e);
      }

      return originalSend(body);
    };

    next();
  };
};

/**
 * Helper para auditar manualmente desde controladores
 * Uso: await auditFromController(req, 'order', 'UPDATE', orderId, oldData, newData);
 */
export const auditFromController = async (
  req: Request,
  entityType: AuditableEntity,
  action: AuditableAction,
  entityId: string,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>
): Promise<void> => {
  await logAudit(req, {
    action,
    entityType,
    entityId,
    oldValue,
    newValue,
  });
};

/**
 * Middleware específico para forzar tasa manual
 * Audita cuando un admin fuerza una tasa diferente a la API
 */
export const manualRateAuditMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body?.isManual && req.body?.rate) {
    logAudit(req, {
      action: AUDITABLE_ACTIONS.RATE_MANUAL,
      entityType: 'rate',
      entityId: 'manual-override',
      newValue: {
        rate: req.body.rate,
        source: req.body.source,
        timestamp: new Date().toISOString(),
      },
    });
  }
  next();
};
