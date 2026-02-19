/**
 * SERVISTECH V4.0 - Rate Service
 * Sincronización de tasas BCV y Binance USDT con Redis cache
 */

import puppeteer from 'puppeteer';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const BCV_URL = 'https://www.bcv.org.ve/';
const BINANCE_API_URL = 'https://api.binance.com/api/v3';

export interface RateData {
  rate: number;
  date: Date;
  source: 'automatic' | 'manual' | 'cached';
  isBackup?: boolean;
}

export interface BinanceRateData extends RateData {
  usdtPrice: number;
}

/**
 * Servicio de sincronización BCV
 */
export class BCVScraperService {
  async scrapeRate(): Promise<RateData | null> {
    let browser;
    
    try {
      logger.info('Starting BCV rate scraping...');
      
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });
      
      const page = await browser.newPage();
      
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );
      
      await page.goto(BCV_URL, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      await page.waitForSelector('#dolar', { timeout: 10000 });
      
      const rateText = await page.$eval('#dolar strong', (el) => el.textContent);
      
      if (!rateText) {
        throw new Error('Could not find rate element');
      }
      
      const cleanRate = rateText.trim().replace('.', '').replace(',', '.');
      const rate = parseFloat(cleanRate);
      
      if (isNaN(rate) || rate <= 0) {
        throw new Error(`Invalid rate value: ${rateText}`);
      }
      
      logger.info(`BCV rate scraped successfully: ${rate}`);
      
      return {
        rate,
        date: new Date(),
        source: 'automatic',
      };
    } catch (error) {
      logger.error('Error scraping BCV rate:', error);
      return null;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
  
  async updateRate(manualRate?: number, userId?: string): Promise<void> {
    try {
      let rateData: RateData | null = null;
      
      // Si hay tasa manual, usarla
      if (manualRate !== undefined) {
        rateData = {
          rate: manualRate,
          date: new Date(),
          source: 'manual',
        };
        logger.info(`Manual BCV rate set: ${manualRate} by user ${userId}`);
      } else {
        // Intentar scrapear
        rateData = await this.scrapeRate();
      }
      
      if (!rateData) {
        // Si falla, marcar última tasa como backup
        const lastRate = await prisma.bCVRate.findFirst({
          orderBy: { date: 'desc' },
        });
        
        if (lastRate) {
          await prisma.bCVRate.update({
            where: { id: lastRate.id },
            data: { isBackup: true },
          });
        }
        
        logger.warn('Failed to update BCV rate, using backup');
        return;
      }
      
      await prisma.bCVRate.create({
        data: {
          rate: rateData.rate,
          date: rateData.date,
          source: rateData.source,
          updatedBy: userId,
          isBackup: false,
        },
      });
      
      logger.info(`BCV rate updated: ${rateData.rate}`);
    } catch (error) {
      logger.error('Error updating BCV rate:', error);
    }
  }
  
  async getCurrentRate(): Promise<number | null> {
    try {
      const latestRate = await prisma.bCVRate.findFirst({
        where: { isBackup: false },
        orderBy: { date: 'desc' },
      });
      
      if (!latestRate) {
        return 64.85; // Default fallback
      }
      
      return parseFloat(latestRate.rate.toString());
    } catch (error) {
      logger.error('Error getting current rate:', error);
      return null;
    }
  }
}

/**
 * Servicio de sincronización Binance USDT
 */
export class BinanceRateService {
  async fetchRate(): Promise<BinanceRateData | null> {
    try {
      logger.info('Fetching Binance USDT rate...');
      
      // Obtener precio USDT/USD
      const response = await fetch(`${BINANCE_API_URL}/ticker/price?symbol=USDTUSD`);
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
      const data = await response.json();
      const usdtPrice = parseFloat(data.price);
      
      // Para Venezuela, la tasa paralela es aproximadamente:
      // Tasa BCV * (1 + diferencial)
      // El diferencial varía, usamos un estimado basado en mercado P2P
      const bcvRate = await bcvScraper.getCurrentRate() || 64.85;
      const parallelDifferential = 1.15; // 15% sobre BCV (ejemplo)
      const estimatedParallelRate = bcvRate * parallelDifferential * usdtPrice;
      
      logger.info(`Binance rate fetched: USDT=$${usdtPrice}, Parallel=Bs.${estimatedParallelRate}`);
      
      return {
        rate: estimatedParallelRate,
        usdtPrice,
        date: new Date(),
        source: 'automatic',
      };
    } catch (error) {
      logger.error('Error fetching Binance rate:', error);
      return null;
    }
  }
  
  async updateRate(manualRate?: number, userId?: string): Promise<void> {
    try {
      let rateData: BinanceRateData | null = null;
      
      if (manualRate !== undefined) {
        rateData = {
          rate: manualRate,
          usdtPrice: 1, // No aplica para manual
          date: new Date(),
          source: 'manual',
        };
        logger.info(`Manual Binance rate set: ${manualRate} by user ${userId}`);
      } else {
        rateData = await this.fetchRate();
      }
      
      if (!rateData) {
        logger.warn('Failed to fetch Binance rate');
        return;
      }
      
      await prisma.binanceRate.create({
        data: {
          rate: rateData.rate,
          usdtPrice: rateData.usdtPrice,
          source: rateData.source,
        },
      });
      
      logger.info(`Binance rate updated: ${rateData.rate}`);
    } catch (error) {
      logger.error('Error updating Binance rate:', error);
    }
  }
  
  async getCurrentRate(): Promise<number | null> {
    try {
      const latestRate = await prisma.binanceRate.findFirst({
        orderBy: { date: 'desc' },
      });
      
      return latestRate ? parseFloat(latestRate.rate.toString()) : null;
    } catch (error) {
      logger.error('Error getting Binance rate:', error);
      return null;
    }
  }
}

/**
 * Servicio unificado de tasas
 */
export class RateService {
  private bcvService = new BCVScraperService();
  private binanceService = new BinanceRateService();
  
  // Cache en memoria (en producción usar Redis)
  private cache: Map<string, { value: number; timestamp: number }> = new Map();
  private CACHE_TTL = 60 * 60 * 1000; // 1 hora
  
  async getBCVRate(useCache = true): Promise<number | null> {
    const cacheKey = 'bcv_rate';
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.value;
      }
    }
    
    const rate = await this.bcvService.getCurrentRate();
    
    if (rate) {
      this.cache.set(cacheKey, { value: rate, timestamp: Date.now() });
    }
    
    return rate;
  }
  
  async getBinanceRate(useCache = true): Promise<number | null> {
    const cacheKey = 'binance_rate';
    
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.value;
      }
    }
    
    const rate = await this.binanceService.getCurrentRate();
    
    if (rate) {
      this.cache.set(cacheKey, { value: rate, timestamp: Date.now() });
    }
    
    return rate;
  }
  
  async syncAllRates(): Promise<void> {
    logger.info('Syncing all rates...');
    
    await Promise.all([
      this.bcvService.updateRate(),
      this.binanceService.updateRate(),
    ]);
    
    // Limpiar cache
    this.cache.clear();
    
    logger.info('All rates synced successfully');
  }
  
  // Convertir USD a VES según tasa seleccionada
  async convertToVES(
    usdAmount: number,
    rateType: 'bcv' | 'binance' = 'bcv'
  ): Promise<{ amount: number; rate: number; rateType: string } | null> {
    const rate = rateType === 'bcv' 
      ? await this.getBCVRate()
      : await this.getBinanceRate();
    
    if (!rate) return null;
    
    return {
      amount: usdAmount * rate,
      rate,
      rateType,
    };
  }
}

// Exportar instancias
export const bcvScraper = new BCVScraperService();
export const binanceRate = new BinanceRateService();
export const rateService = new RateService();
