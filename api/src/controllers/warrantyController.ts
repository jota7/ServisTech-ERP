/**
 * SERVISTECH V4.0 - Warranty Controller
 * Gestión de garantías independientes con flujo vinculado a orden original
 */

import { Request, Response } from 'express';
import { PrismaClient, WarrantyStatus, WarrantyCause } from '@prisma/client';
import { buildWhereClause } from '../middleware/storeIsolation';
import { auditFromController, AUDITABLE_ACTIONS } from '../middleware/auditLogger';

const prisma = new PrismaClient();

/**
 * Crear una nueva garantía
 * POST /api/warranties
 */
export const createWarranty = async (req: Request, res: Response) => {
  try {
    const {
      originalOrderId,
      cause,
      causeNotes,
      diagnosis,
      estimatedCost,
    } = req.body;

    const { storeId, isSuperAdmin } = req.storeContext || {};

    // Verificar que la orden original existe y pertenece a la sede
    const originalOrder = await prisma.serviceOrder.findUnique({
      where: { id: originalOrderId },
      include: { warranty: true },
    });

    if (!originalOrder) {
      return res.status(404).json({ error: 'Orden original no encontrada' });
    }

    if (!isSuperAdmin && originalOrder.storeId !== storeId) {
      return res.status(403).json({ error: 'No tiene acceso a esta orden' });
    }

    // Verificar que no tenga garantía activa
    if (originalOrder.warranty) {
      return res.status(400).json({ 
        error: 'Esta orden ya tiene una garantía registrada',
        warrantyId: originalOrder.warranty.id,
      });
    }

    // Generar número de garantía
    const warrantyCount = await prisma.warrantyClaim.count({
      where: { storeId: originalOrder.storeId },
    });
    const warrantyNumber = `G-${originalOrder.storeId}-${Date.now().toString(36).toUpperCase()}`;

    // Crear garantía
    const warranty = await prisma.warrantyClaim.create({
      data: {
        warrantyNumber,
        originalOrderId,
        cause: cause as WarrantyCause,
        causeNotes,
        diagnosis,
        estimatedCost: estimatedCost || 0,
        storeId: originalOrderId.storeId,
        createdById: req.user!.id,
        status: WarrantyStatus.PENDIENTE,
      },
      include: {
        originalOrder: {
          include: {
            customer: true,
            device: true,
          },
        },
      },
    });

    // Actualizar prioridad de la orden original a GARANTIA
    await prisma.serviceOrder.update({
      where: { id: originalOrderId },
      data: { priority: 'GARANTIA' },
    });

    // Auditar
    await auditFromController(
      req,
      'warranty',
      AUDITABLE_ACTIONS.CREATE,
      warranty.id,
      undefined,
      warranty
    );

    res.status(201).json(warranty);
  } catch (error) {
    console.error('Error creating warranty:', error);
    res.status(500).json({ error: 'Error al crear garantía' });
  }
};

/**
 * Obtener todas las garantías
 * GET /api/warranties
 */
export const getWarranties = async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    
    const where = buildWhereClause(req, {
      ...(status && { status: status as WarrantyStatus }),
    });

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [warranties, total] = await Promise.all([
      prisma.warrantyClaim.findMany({
        where,
        include: {
          originalOrder: {
            include: {
              customer: {
                select: { name: true, phone: true },
              },
              device: {
                select: { model: true, type: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.warrantyClaim.count({ where }),
    ]);

    res.json({
      data: warranties,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error fetching warranties:', error);
    res.status(500).json({ error: 'Error al obtener garantías' });
  }
};

/**
 * Obtener una garantía por ID
 * GET /api/warranties/:id
 */
export const getWarrantyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const warranty = await prisma.warrantyClaim.findUnique({
      where: { id },
      include: {
        originalOrder: {
          include: {
            customer: true,
            device: true,
            partsUsed: {
              include: { part: true },
            },
          },
        },
      },
    });

    if (!warranty) {
      return res.status(404).json({ error: 'Garantía no encontrada' });
    }

    // Verificar acceso
    const { storeId, isSuperAdmin } = req.storeContext || {};
    if (!isSuperAdmin && warranty.storeId !== storeId) {
      return res.status(403).json({ error: 'No tiene acceso a esta garantía' });
    }

    res.json(warranty);
  } catch (error) {
    console.error('Error fetching warranty:', error);
    res.status(500).json({ error: 'Error al obtener garantía' });
  }
};

/**
 * Actualizar estado de garantía
 * PATCH /api/warranties/:id/status
 */
export const updateWarrantyStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, solution, finalCost, approvedById } = req.body;

    const warranty = await prisma.warrantyClaim.findUnique({
      where: { id },
    });

    if (!warranty) {
      return res.status(404).json({ error: 'Garantía no encontrada' });
    }

    // Verificar acceso
    const { storeId, isSuperAdmin } = req.storeContext || {};
    if (!isSuperAdmin && warranty.storeId !== storeId) {
      return res.status(403).json({ error: 'No tiene acceso a esta garantía' });
    }

    const oldStatus = warranty.status;

    // Actualizar garantía
    const updatedWarranty = await prisma.warrantyClaim.update({
      where: { id },
      data: {
        status: status as WarrantyStatus,
        solution,
        finalCost: finalCost || warranty.finalCost,
        approvedById: approvedById || req.user!.id,
        approvedAt: status === WarrantyStatus.APROBADA ? new Date() : warranty.approvedAt,
        completedAt: status === WarrantyStatus.COMPLETADA ? new Date() : null,
      },
    });

    // Auditar cambio de estado
    await auditFromController(
      req,
      'warranty',
      AUDITABLE_ACTIONS.STATUS_CHANGE,
      id,
      { status: oldStatus },
      { status, solution, finalCost }
    );

    res.json(updatedWarranty);
  } catch (error) {
    console.error('Error updating warranty:', error);
    res.status(500).json({ error: 'Error al actualizar garantía' });
  }
};

/**
 * Obtener estadísticas de garantías
 * GET /api/warranties/stats/overview
 */
export const getWarrantyStats = async (req: Request, res: Response) => {
  try {
    const { storeId, isSuperAdmin } = req.storeContext || {};
    const { startDate, endDate } = req.query;

    const where = buildWhereClause(req, {
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      }),
    });

    const stats = await prisma.warrantyClaim.groupBy({
      by: ['status', 'cause'],
      where,
      _count: { id: true },
      _sum: { finalCost: true },
    });

    // Calcular totales por causa
    const causeStats = await prisma.warrantyClaim.groupBy({
      by: ['cause'],
      where,
      _count: { id: true },
    });

    res.json({
      byStatus: stats,
      byCause: causeStats,
    });
  } catch (error) {
    console.error('Error fetching warranty stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

/**
 * Obtener garantías por técnico (para dashboard de comisiones)
 * GET /api/warranties/by-technician/:technicianId
 */
export const getWarrantiesByTechnician = async (req: Request, res: Response) => {
  try {
    const { technicianId } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const warranties = await prisma.warrantyClaim.findMany({
      where: {
        originalOrder: {
          assignedToId: technicianId,
        },
      },
      include: {
        originalOrder: {
          include: {
            customer: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string),
    });

    res.json(warranties);
  } catch (error) {
    console.error('Error fetching technician warranties:', error);
    res.status(500).json({ error: 'Error al obtener garantías del técnico' });
  }
};
