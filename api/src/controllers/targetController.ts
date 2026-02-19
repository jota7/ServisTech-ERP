/**
 * SERVISTECH V4.0 - Target Controller
 * Módulo de Metas: Gastos fijos vs Meta diaria de facturación
 * Calcula el punto de equilibrio y resta gastos para mostrar meta neta
 */

import { Request, Response } from 'express';
import { PrismaClient, ExpenseCategory } from '@prisma/client';
import { buildWhereClause } from '../middleware/storeIsolation';

const prisma = new PrismaClient();

/**
 * Crear gasto fijo
 * POST /api/expenses/fixed
 */
export const createFixedExpense = async (req: Request, res: Response) => {
  try {
    const {
      name,
      amount,
      category,
      isRecurring,
      dayOfMonth,
    } = req.body;

    const { storeId } = req.storeContext || {};

    if (!storeId) {
      return res.status(400).json({ error: 'No se pudo determinar la sede' });
    }

    const expense = await prisma.fixedExpense.create({
      data: {
        name,
        amount,
        category: category as ExpenseCategory,
        isRecurring: isRecurring ?? true,
        dayOfMonth,
        storeId,
      },
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating fixed expense:', error);
    res.status(500).json({ error: 'Error al crear gasto fijo' });
  }
};

/**
 * Obtener gastos fijos
 * GET /api/expenses/fixed
 */
export const getFixedExpenses = async (req: Request, res: Response) => {
  try {
    const { category, isActive } = req.query;

    const where = buildWhereClause(req, {
      ...(category && { category: category as ExpenseCategory }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    });

    const expenses = await prisma.fixedExpense.findMany({
      where,
      orderBy: { category: 'asc' },
    });

    // Calcular total mensual
    const monthlyTotal = expenses
      .filter(e => e.isActive)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    res.json({
      data: expenses,
      summary: {
        monthlyTotal,
        dailyAverage: monthlyTotal / 30,
      },
    });
  } catch (error) {
    console.error('Error fetching fixed expenses:', error);
    res.status(500).json({ error: 'Error al obtener gastos' });
  }
};

/**
 * Calcular meta diaria
 * GET /api/targets/daily-calculation
 */
export const calculateDailyTarget = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    
    const { storeId } = req.storeContext || {};
    
    if (!storeId) {
      return res.status(400).json({ error: 'No se pudo determinar la sede' });
    }

    // Obtener gastos fijos activos
    const fixedExpenses = await prisma.fixedExpense.findMany({
      where: {
        storeId,
        isActive: true,
      },
    });

    // Calcular gastos diarios
    const dailyFixedExpenses = fixedExpenses.reduce(
      (sum, e) => sum + Number(e.amount) / 30,
      0
    );

    // Obtener petty cash del día
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyPettyCash = await prisma.pettyCashExpense.aggregate({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        register: {
          storeId,
        },
      },
      _sum: { amount: true },
    });

    const pettyCashTotal = Number(dailyPettyCash._sum.amount || 0);

    // Obtener ventas del día
    const dailySales = await prisma.invoice.aggregate({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        storeId,
        status: { in: ['PAID', 'PARTIAL'] },
      },
      _sum: { total: true },
    });

    const actualSales = Number(dailySales._sum.total || 0);

    // Calcular meta
    // Asumimos que queremos un margen de ganancia del 30%
    const desiredMargin = 0.30;
    const targetAmount = (dailyFixedExpenses + pettyCashTotal) / (1 - desiredMargin);

    // Guardar o actualizar registro de meta
    const [month, year] = [targetDate.getMonth() + 1, targetDate.getFullYear()];
    
    const dailyTarget = await prisma.dailyTarget.upsert({
      where: {
        date_storeId: {
          date: startOfDay,
          storeId,
        },
      },
      update: {
        targetAmount,
        actualAmount: actualSales,
        fixedExpenses: dailyFixedExpenses,
        pettyCashTotal,
        netTarget: targetAmount - dailyFixedExpenses - pettyCashTotal,
        isMet: actualSales >= targetAmount,
      },
      create: {
        date: startOfDay,
        storeId,
        targetAmount,
        actualAmount: actualSales,
        fixedExpenses: dailyFixedExpenses,
        pettyCashTotal,
        netTarget: targetAmount - dailyFixedExpenses - pettyCashTotal,
        isMet: actualSales >= targetAmount,
      },
    });

    res.json({
      date: targetDate.toISOString().split('T')[0],
      calculations: {
        dailyFixedExpenses: dailyFixedExpenses.toFixed(2),
        pettyCashTotal: pettyCashTotal.toFixed(2),
        totalExpenses: (dailyFixedExpenses + pettyCashTotal).toFixed(2),
        targetAmount: targetAmount.toFixed(2),
        netTarget: dailyTarget.netTarget.toFixed(2),
        actualSales: actualSales.toFixed(2),
        remaining: (targetAmount - actualSales).toFixed(2),
        isMet: dailyTarget.isMet,
      },
      expenses: fixedExpenses.map(e => ({
        name: e.name,
        amount: e.amount,
        category: e.category,
      })),
    });
  } catch (error) {
    console.error('Error calculating daily target:', error);
    res.status(500).json({ error: 'Error al calcular meta diaria' });
  }
};

/**
 * Obtener dashboard de metas
 * GET /api/targets/dashboard
 */
export const getTargetsDashboard = async (req: Request, res: Response) => {
  try {
    const { days = '7' } = req.query;
    const { storeId } = req.storeContext || {};

    if (!storeId) {
      return res.status(400).json({ error: 'No se pudo determinar la sede' });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days as string));

    // Obtener histórico de metas
    const targets = await prisma.dailyTarget.findMany({
      where: {
        storeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Calcular estadísticas
    const stats = {
      totalTarget: targets.reduce((sum, t) => sum + Number(t.targetAmount), 0),
      totalActual: targets.reduce((sum, t) => sum + Number(t.actualAmount), 0),
      daysMet: targets.filter(t => t.isMet).length,
      totalDays: targets.length,
    };

    const completionRate = stats.totalDays > 0 
      ? (stats.daysMet / stats.totalDays) * 100 
      : 0;

    res.json({
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      stats: {
        ...stats,
        completionRate: completionRate.toFixed(1),
        averageDailyTarget: stats.totalTarget / (stats.totalDays || 1),
        averageDailySales: stats.totalActual / (stats.totalDays || 1),
      },
      dailyData: targets.map(t => ({
        date: t.date.toISOString().split('T')[0],
        target: t.targetAmount,
        actual: t.actualAmount,
        isMet: t.isMet,
      })),
    });
  } catch (error) {
    console.error('Error fetching targets dashboard:', error);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
};

/**
 * Actualizar gasto fijo
 * PATCH /api/expenses/fixed/:id
 */
export const updateFixedExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, amount, category, isActive, isRecurring, dayOfMonth } = req.body;

    const { storeId, isSuperAdmin } = req.storeContext || {};

    // Verificar que el gasto pertenece a la sede
    const expense = await prisma.fixedExpense.findUnique({
      where: { id },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    if (!isSuperAdmin && expense.storeId !== storeId) {
      return res.status(403).json({ error: 'No tiene acceso a este gasto' });
    }

    const updated = await prisma.fixedExpense.update({
      where: { id },
      data: {
        name,
        amount,
        category: category as ExpenseCategory,
        isActive,
        isRecurring,
        dayOfMonth,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating fixed expense:', error);
    res.status(500).json({ error: 'Error al actualizar gasto' });
  }
};
