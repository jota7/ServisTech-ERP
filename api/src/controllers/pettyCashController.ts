/**
 * SERVISTECH V4.0 - Petty Cash Controller
 * Registro de gastos diarios con carga obligatoria de fotos de comprobantes
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { buildWhereClause } from '../middleware/storeIsolation';
import { auditFromController, AUDITABLE_ACTIONS } from '../middleware/auditLogger';

const prisma = new PrismaClient();

/**
 * Crear gasto de caja chica
 * POST /api/cash-register/:registerId/expenses
 */
export const createExpense = async (req: Request, res: Response) => {
  try {
    const { registerId } = req.params;
    const {
      description,
      amount,
      currency,
      category,
      receiptPhotos,
    } = req.body;

    // Validar que hay fotos (obligatorio V4.0)
    if (!receiptPhotos || receiptPhotos.length === 0) {
      return res.status(400).json({ 
        error: 'Se requiere al menos una foto del comprobante',
        code: 'PHOTOS_REQUIRED',
      });
    }

    const { storeId, isSuperAdmin } = req.storeContext || {};

    // Verificar que la caja pertenece a la sede
    const register = await prisma.cashRegister.findUnique({
      where: { id: registerId },
    });

    if (!register) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    if (!isSuperAdmin && register.storeId !== storeId) {
      return res.status(403).json({ error: 'No tiene acceso a esta caja' });
    }

    // Verificar que la caja está abierta
    if (register.status !== 'OPEN') {
      return res.status(400).json({ error: 'La caja está cerrada' });
    }

    // Crear gasto
    const expense = await prisma.pettyCashExpense.create({
      data: {
        description,
        amount,
        currency: currency || 'USD',
        category,
        receiptPhotos: receiptPhotos || [],
        registerId,
        createdBy: req.user!.id,
      },
    });

    // Auditar
    await auditFromController(
      req,
      'invoice',
      AUDITABLE_ACTIONS.CREATE,
      expense.id,
      undefined,
      { description, amount, currency, category }
    );

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Error al crear gasto' });
  }
};

/**
 * Obtener gastos de una caja
 * GET /api/cash-register/:registerId/expenses
 */
export const getExpenses = async (req: Request, res: Response) => {
  try {
    const { registerId } = req.params;
    const { category, page = '1', limit = '20' } = req.query;

    const { storeId, isSuperAdmin } = req.storeContext || {};

    // Verificar acceso
    const register = await prisma.cashRegister.findUnique({
      where: { id: registerId },
    });

    if (!register) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    if (!isSuperAdmin && register.storeId !== storeId) {
      return res.status(403).json({ error: 'No tiene acceso' });
    }

    const where = {
      registerId,
      ...(category && { category: category as string }),
    };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [expenses, total] = await Promise.all([
      prisma.pettyCashExpense.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.pettyCashExpense.count({ where }),
    ]);

    // Calcular totales
    const totals = await prisma.pettyCashExpense.aggregate({
      where: { registerId },
      _sum: { amount: true },
      _count: { id: true },
    });

    res.json({
      data: expenses,
      summary: {
        totalExpenses: totals._count.id,
        totalAmount: totals._sum.amount,
      },
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Error al obtener gastos' });
  }
};

/**
 * Obtener todos los gastos de la sede (reporte)
 * GET /api/expenses/report
 */
export const getExpensesReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, category } = req.query;

    const where = buildWhereClause(req, {
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      }),
      ...(category && { category: category as string }),
    });

    const expenses = await prisma.pettyCashExpense.findMany({
      where,
      include: {
        register: {
          select: {
            storeId: true,
            openedById: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Agrupar por categoría
    const byCategory = await prisma.pettyCashExpense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    // Agrupar por día
    const byDay = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        SUM(amount) as total,
        COUNT(*) as count
      FROM petty_cash_expenses
      WHERE ${where}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    res.json({
      data: expenses,
      summary: {
        byCategory,
        byDay,
        totalAmount: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
      },
    });
  } catch (error) {
    console.error('Error fetching expenses report:', error);
    res.status(500).json({ error: 'Error al obtener reporte' });
  }
};

/**
 * Subir fotos de comprobantes (presigned URL para S3)
 * POST /api/expenses/upload-url
 */
export const getUploadUrl = async (req: Request, res: Response) => {
  try {
    const { filename, contentType } = req.body;

    // Aquí se integraría con S3, Cloudinary o Supabase Storage
    // Por ahora devolvemos un mock
    
    const mockUploadUrl = `https://storage.servistech.com/temp/${Date.now()}-${filename}`;
    const mockPublicUrl = `https://cdn.servistech.com/expenses/${Date.now()}-${filename}`;

    res.json({
      uploadUrl: mockUploadUrl,
      publicUrl: mockPublicUrl,
      expiresIn: 300, // 5 minutos
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Error al generar URL de subida' });
  }
};

/**
 * Eliminar un gasto (solo con permisos)
 * DELETE /api/expenses/:id
 */
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { storeId, isSuperAdmin } = req.storeContext || {};

    const expense = await prisma.pettyCashExpense.findUnique({
      where: { id },
      include: { register: true },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    // Solo super-admin o quien creó el gasto puede eliminarlo
    const canDelete = isSuperAdmin || 
                      expense.createdBy === req.user!.id ||
                      expense.register.storeId === storeId;

    if (!canDelete) {
      return res.status(403).json({ error: 'No tiene permiso para eliminar' });
    }

    // Solo se puede eliminar si la caja está abierta
    if (expense.register.status !== 'OPEN') {
      return res.status(400).json({ error: 'No se puede eliminar, la caja está cerrada' });
    }

    await prisma.pettyCashExpense.delete({
      where: { id },
    });

    // Auditar
    await auditFromController(
      req,
      'invoice',
      AUDITABLE_ACTIONS.DELETE,
      id,
      expense,
      undefined
    );

    res.json({ message: 'Gasto eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Error al eliminar gasto' });
  }
};
