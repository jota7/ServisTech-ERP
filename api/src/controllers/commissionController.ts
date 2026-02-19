/**
 * SERVISTECH V4.0 - Commission Controller
 * Sistema de comisiones y contra-cargos (débitos)
 * - Técnicos: 35% sobre utilidad bruta (configurable)
 * - Encargadas: $1 por equipo + 10% sobre accesorios
 */

import { Request, Response } from 'express';
import { PrismaClient, CommissionStatus, DebitReason } from '@prisma/client';
import { buildWhereClause } from '../middleware/storeIsolation';
import { auditFromController, AUDITABLE_ACTIONS } from '../middleware/auditLogger';

const prisma = new PrismaClient();

/**
 * Calcular comisión automáticamente al completar una orden
 * Esta función se llama desde el servicio de órdenes
 */
export const calculateCommission = async (
  orderId: string,
  technicianId: string
): Promise<void> => {
  try {
    // Obtener orden con todos los datos necesarios
    const order = await prisma.serviceOrder.findUnique({
      where: { id: orderId },
      include: {
        partsUsed: true,
        invoice: {
          include: { items: true },
        },
        technician: true,
      },
    });

    if (!order || !order.technician) return;

    // Calcular utilidad bruta
    const grossProfit = order.grossProfit || new (require('@prisma/client').Prisma).Decimal(0);

    // Obtener tasa de comisión del técnico
    const commissionRate = order.technician.commissionRate;
    const flatRate = order.technician.flatRatePerUnit;
    const accessoryRate = order.technician.accessoryRate;

    let commissionAmount = new (require('@prisma/client').Prisma).Decimal(0);
    let flatRateAmount = new (require('@prisma/client').Prisma).Decimal(0);

    // Calcular según rol
    if (order.technician.role === 'TECNICO') {
      // Técnicos: % sobre utilidad bruta
      commissionAmount = grossProfit.mul(commissionRate).div(100);
    } else if (order.technician.role === 'ENCARGADA') {
      // Encargadas: $1 por equipo + % sobre accesorios
      flatRateAmount = flatRate;
      
      // Calcular % sobre accesorios vendidos
      const accessoryTotal = order.invoice?.items
        .filter((item: any) => item.type === 'accessory')
        .reduce((sum: number, item: any) => sum + Number(item.total), 0) || 0;
      
      const accessoryCommission = new (require('@prisma/client').Prisma).Decimal(accessoryTotal)
        .mul(accessoryRate)
        .div(100);
      
      commissionAmount = accessoryCommission;
    }

    // Determinar período (mes/año actual)
    const now = new Date();
    const periodMonth = now.getMonth() + 1;
    const periodYear = now.getFullYear();

    // Crear registro de comisión
    await prisma.commission.create({
      data: {
        orderId,
        technicianId,
        grossProfit,
        commissionRate,
        amount: commissionAmount,
        flatRateAmount,
        netAmount: commissionAmount.add(flatRateAmount),
        periodMonth,
        periodYear,
        status: CommissionStatus.PENDIENTE,
      },
    });
  } catch (error) {
    console.error('Error calculating commission:', error);
  }
};

/**
 * Obtener comisiones
 * GET /api/commissions
 */
export const getCommissions = async (req: Request, res: Response) => {
  try {
    const {
      technicianId,
      status,
      periodMonth,
      periodYear,
      page = '1',
      limit = '20',
    } = req.query;

    const where = buildWhereClause(req, {
      ...(technicianId && { technicianId: technicianId as string }),
      ...(status && { status: status as CommissionStatus }),
      ...(periodMonth && { periodMonth: parseInt(periodMonth as string) }),
      ...(periodYear && { periodYear: parseInt(periodYear as string) }),
    });

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        include: {
          technician: {
            select: { name: true, role: true },
          },
          order: {
            include: {
              customer: {
                select: { name: true },
              },
            },
          },
          debits: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.commission.count({ where }),
    ]);

    res.json({
      data: commissions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({ error: 'Error al obtener comisiones' });
  }
};

/**
 * Obtener resumen de comisiones por técnico
 * GET /api/commissions/summary/:technicianId
 */
export const getCommissionSummary = async (req: Request, res: Response) => {
  try {
    const { technicianId } = req.params;
    const { periodMonth, periodYear } = req.query;

    const where: any = {
      technicianId,
      ...(periodMonth && { periodMonth: parseInt(periodMonth as string) }),
      ...(periodYear && { periodYear: parseInt(periodYear as string) }),
    };

    const summary = await prisma.commission.aggregate({
      where,
      _sum: {
        amount: true,
        flatRateAmount: true,
        totalDebits: true,
        netAmount: true,
        grossProfit: true,
      },
      _count: { id: true },
    });

    // Por estado
    const byStatus = await prisma.commission.groupBy({
      by: ['status'],
      where,
      _sum: { netAmount: true },
      _count: { id: true },
    });

    res.json({
      summary: {
        totalCommissions: summary._count.id,
        totalGrossProfit: summary._sum.grossProfit,
        totalAmount: summary._sum.amount,
        totalFlatRate: summary._sum.flatRateAmount,
        totalDebits: summary._sum.totalDebits,
        netPayable: summary._sum.netAmount,
      },
      byStatus,
    });
  } catch (error) {
    console.error('Error fetching commission summary:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

/**
 * Pagar comisiones
 * POST /api/commissions/pay
 */
export const payCommissions = async (req: Request, res: Response) => {
  try {
    const { commissionIds } = req.body;

    const result = await prisma.commission.updateMany({
      where: {
        id: { in: commissionIds },
        status: CommissionStatus.PENDIENTE,
      },
      data: {
        status: CommissionStatus.PAGADA,
        paidAt: new Date(),
        paidBy: req.user!.id,
      },
    });

    // Auditar
    await auditFromController(
      req,
      'commission',
      AUDITABLE_ACTIONS.COMMISSION_PAY,
      'batch-payment',
      { status: 'PENDIENTE' },
      { status: 'PAGADA', count: result.count }
    );

    res.json({
      message: `${result.count} comisiones pagadas exitosamente`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error paying commissions:', error);
    res.status(500).json({ error: 'Error al pagar comisiones' });
  }
};

// ==================== CONTRA-CARGOS (DÉBITOS) ====================

/**
 * Crear un contra-cargo
 * POST /api/commissions/debits
 */
export const createDebit = async (req: Request, res: Response) => {
  try {
    const {
      commissionId,
      reason,
      description,
      amount,
      photos,
    } = req.body;

    // Verificar que la comisión existe
    const commission = await prisma.commission.findUnique({
      where: { id: commissionId },
    });

    if (!commission) {
      return res.status(404).json({ error: 'Comisión no encontrada' });
    }

    // Verificar acceso
    const { storeId, isSuperAdmin } = req.storeContext || {};
    const technician = await prisma.user.findUnique({
      where: { id: commission.technicianId },
    });
    
    if (!isSuperAdmin && technician?.storeId !== storeId) {
      return res.status(403).json({ error: 'No tiene acceso' });
    }

    // Crear débito
    const debit = await prisma.technicianDebit.create({
      data: {
        commissionId,
        reason: reason as DebitReason,
        description,
        amount,
        photos: photos || [],
        technicianId: commission.technicianId,
        approvedById: req.user!.id,
        approvedAt: new Date(),
      },
    });

    // Actualizar comisión
    const updatedCommission = await prisma.commission.update({
      where: { id: commissionId },
      data: {
        totalDebits: { increment: amount },
        netAmount: { decrement: amount },
        status: CommissionStatus.DEBITADA,
      },
    });

    // Auditar
    await auditFromController(
      req,
      'debit',
      AUDITABLE_ACTIONS.DEBIT_APPLY,
      debit.id,
      { netAmount: commission.netAmount },
      { netAmount: updatedCommission.netAmount, debitAmount: amount }
    );

    res.status(201).json({
      debit,
      commission: updatedCommission,
    });
  } catch (error) {
    console.error('Error creating debit:', error);
    res.status(500).json({ error: 'Error al crear contra-cargo' });
  }
};

/**
 * Obtener débitos de un técnico
 * GET /api/commissions/debits/:technicianId
 */
export const getDebitsByTechnician = async (req: Request, res: Response) => {
  try {
    const { technicianId } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const debits = await prisma.technicianDebit.findMany({
      where: { technicianId },
      include: {
        commission: {
          include: {
            order: {
              include: {
                customer: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string),
    });

    res.json(debits);
  } catch (error) {
    console.error('Error fetching debits:', error);
    res.status(500).json({ error: 'Error al obtener débitos' });
  }
};

/**
 * Generar reporte de nómina
 * GET /api/commissions/payroll-report
 */
export const generatePayrollReport = async (req: Request, res: Response) => {
  try {
    const { periodMonth, periodYear } = req.query;

    const where = buildWhereClause(req, {
      periodMonth: parseInt(periodMonth as string) || new Date().getMonth() + 1,
      periodYear: parseInt(periodYear as string) || new Date().getFullYear(),
    });

    // Agrupar por técnico
    const payrollData = await prisma.commission.groupBy({
      by: ['technicianId'],
      where,
      _sum: {
        amount: true,
        flatRateAmount: true,
        totalDebits: true,
        netAmount: true,
      },
      _count: { id: true },
    });

    // Obtener detalles de cada técnico
    const report = await Promise.all(
      payrollData.map(async (item) => {
        const technician = await prisma.user.findUnique({
          where: { id: item.technicianId },
          select: { name: true, role: true, email: true },
        });

        return {
          technician,
          ordersCompleted: item._count.id,
          commissionAmount: item._sum.amount,
          flatRateAmount: item._sum.flatRateAmount,
          totalDebits: item._sum.totalDebits,
          netPayable: item._sum.netAmount,
        };
      })
    );

    res.json({
      period: `${periodMonth}/${periodYear}`,
      data: report,
      totals: {
        totalPayable: report.reduce((sum, r) => sum + Number(r.netPayable), 0),
        totalOrders: report.reduce((sum, r) => sum + r.ordersCompleted, 0),
      },
    });
  } catch (error) {
    console.error('Error generating payroll report:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
};
