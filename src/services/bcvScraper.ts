import puppeteer from 'puppeteer';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const BCV_URL = 'https://www.bcv.org.ve/';

export interface BCVRateData {
  rate: number;
  date: Date;
  source: 'automatic' | 'manual';
}

export class BCVScraperService {
  async scrapeRate(): Promise<BCVRateData | null> {
    let browser;
    
    try {
      logger.info('Starting BCV rate scraping...');
      
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });
      
      const page = await browser.newPage();
      
      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      
      // Navigate to BCV
      await page.goto(BCV_URL, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      // Wait for the rate element
      await page.waitForSelector('#dolar', { timeout: 10000 });
      
      // Extract the rate
      const rateText = await page.$eval('#dolar strong', (el) => el.textContent);
      
      if (!rateText) {
        throw new Error('Could not find rate element');
      }
      
      // Parse rate (format: "36,4521" -> 36.4521)
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
  
  async updateRate(): Promise<void> {
    try {
      const rateData = await this.scrapeRate();
      
      if (!rateData) {
        logger.warn('Failed to scrape BCV rate, skipping update');
        return;
      }
      
      // Save to database
      await prisma.bCVRate.create({
        data: {
          rate: rateData.rate,
          date: rateData.date,
          source: rateData.source,
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
        orderBy: { date: 'desc' },
      });
      
      if (!latestRate) {
        // Return default rate if none exists
        return 64.85;
      }
      
      return parseFloat(latestRate.rate.toString());
    } catch (error) {
      logger.error('Error getting current rate:', error);
      return null;
    }
  }
  
  // Convert USD to VES
  async convertToVES(usdAmount: number): Promise<number | null> {
    const rate = await this.getCurrentRate();
    if (!rate) return null;
    return usdAmount * rate;
  }
}

export const bcvScraper = new BCVScraperService();
