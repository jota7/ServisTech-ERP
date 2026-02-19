import { Router } from 'express';
import { Request, Response } from 'express';
import { bcvScraper } from '@/services/bcvScraper';
import { prisma } from '@/config/database';
import { successResponse, errorResponse } from '@/utils/response';
import { authenticate, authorize } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Get current rate (public)
router.get('/current', asyncHandler(async (_req: Request, res: Response) => {
  const rate = await bcvScraper.getCurrentRate();
  
  if (!rate) {
    errorResponse(res, 'Rate not available', 404);
    return;
  }
  
  successResponse(res, { rate });
}));

// Get rate history
router.get('/history', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 30;
  
  const rates = await prisma.bCVRate.findMany({
    take: limit,
    orderBy: { date: 'desc' },
  });
  
  successResponse(res, rates);
}));

// Manual update (admin only)
router.post('/update', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { rate } = req.body;
  
  if (!rate || rate <= 0) {
    errorResponse(res, 'Invalid rate value', 400);
    return;
  }
  
  const newRate = await prisma.bCVRate.create({
    data: {
      rate,
      date: new Date(),
      source: 'manual',
      updatedBy: req.user!.id,
    },
  });
  
  successResponse(res, newRate, 'Rate updated successfully');
}));

// Trigger scrape (admin only)
router.post('/scrape', authenticate, authorize('SUPER_ADMIN'), asyncHandler(async (_req: Request, res: Response) => {
  await bcvScraper.updateRate();
  
  const rate = await bcvScraper.getCurrentRate();
  
  successResponse(res, { rate }, 'BCV rate scraped successfully');
}));

// Convert USD to VES
router.post('/convert', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    errorResponse(res, 'Invalid amount', 400);
    return;
  }
  
  const vesAmount = await bcvScraper.convertToVES(amount);
  
  if (!vesAmount) {
    errorResponse(res, 'Conversion failed', 500);
    return;
  }
  
  successResponse(res, {
    usd: amount,
    ves: vesAmount,
  });
}));

export default router;
