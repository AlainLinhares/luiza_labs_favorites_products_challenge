import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ProductsService {
  private cache = new Map<string, { data: any; expiresAt: number }>();
  private failures = 0;
  private circuitOpenUntil = 0;
  private logger = new Logger(ProductsService.name);

  private httpsAgent = new https.Agent({ rejectUnauthorized: false });

  private mockProducts: Array<{
    id: string;
    title: string;
    price: number;
    image: string;
    brand: string;
    reviewScore: number;
  }> = [];

  constructor() {
    this.mockProducts = this.loadMockProducts();
  }

  private loadMockProducts(): typeof this.mockProducts {
    const mockPath = path.resolve(__dirname, '../../../src/mocks/mock-products.json');
    try {
      const rawData = fs.readFileSync(mockPath, 'utf-8');
      this.logger.log(`Mock products loaded from ${mockPath}`);
      const parsed = JSON.parse(rawData);
      return parsed;
    } catch (err) {
      this.logger.error(`Failed to load mock products from ${mockPath}`, err);
      return [];
    }
  }

  private isCircuitOpen(): boolean {
    return Date.now() < this.circuitOpenUntil;
  }

  private recordFailure() {
    this.failures += 1;
    if (this.failures >= 3) {
      this.circuitOpenUntil = Date.now() + 30_000;
      this.logger.warn('ProductsService circuit opened due to repeated failures');
    }
  }

  private recordSuccess() {
    this.failures = 0;
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, { data, expiresAt: Date.now() + 60_000 });
  }

  async findById(productId: string): Promise<any | null> {
    if (this.isCircuitOpen()) {
      this.logger.warn(`Circuit open, returning mock product for id ${productId}`);
      return this.mockProducts.find(p => p.id === productId) || null;
    }

    const cacheKey = `product:${productId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.get(`${process.env.PRODUCTS_API_ENDPOINT}/${productId}/`, {
        timeout: 5000,
        httpsAgent: this.httpsAgent,
        headers: { 'Content-Type': 'application/json' },
      });

      const product = res.data;

      if (!product || !product.id) {
        this.logger.warn(`Product with id ${productId} not found or invalid`);
        return null;
      }

      this.setCache(cacheKey, product);
      this.recordSuccess();
      return product;
    } catch (e) {
      this.recordFailure();
      this.logger.debug(e instanceof Error ? e.message : 'Unknown error');
      this.logger.warn(`Using mock product for id ${productId} due to API failure`);
      return this.mockProducts.find(p => p.id === productId) || null;
    }
  }

  async listByPage(page: number = 1): Promise<any[]> {
    if (this.isCircuitOpen()) {
      this.logger.warn(`Circuit open, returning mock product list for page ${page}`);
      return this.mockProducts;
    }

    const cacheKey = `page:${page}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.get(`${process.env.PRODUCTS_API_ENDPOINT}/?page=${page}`, {
        timeout: 5000,
        httpsAgent: this.httpsAgent,
      });

      const data = res.data;

      if (!Array.isArray(data)) {
        this.logger.warn('Unexpected response format from product list');
        return this.mockProducts;
      }

      this.setCache(cacheKey, data);
      this.recordSuccess();
      return data;
    } catch (e) {
      this.recordFailure();
      this.logger.debug(e instanceof Error ? e.message : 'Unknown error');
      this.logger.warn(`Using mock product list for page ${page} due to API failure`);
      return this.mockProducts;
    }
  }
}
