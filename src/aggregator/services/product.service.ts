import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductRepository } from '../repositories/product.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProviderProduct } from '../../provider-simulator/models/product.model';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  private readonly stalenessThreshold: number;

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.stalenessThreshold = this.configService.get<number>('STALENESS_THRESHOLD', 60000);
    this.logger.log(`Staleness threshold set to ${this.stalenessThreshold}ms`);
  }

  async getStaleProducts() {
    const staleProducts = await this.productRepository.findStaleProducts(this.stalenessThreshold);
    
    this.logger.log(`Retrieved ${staleProducts.length} stale products`);
    
    return staleProducts.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      provider: product.providerName,
      providerId: product.providerId,
      price: product.prices[0]?.value,
      currency: product.prices[0]?.currency,
      isAvailable: product.availability[0]?.isAvailable,
      isStale: product.isStale,
      staleReason: this.getStaleReason(product.lastFetchedAt),
      lastFetchedAt: product.lastFetchedAt,
      updatedAt: product.updatedAt,
    }));
  }

  async checkAndMarkStaleProducts() {
    const staleDate = new Date(Date.now() - this.stalenessThreshold);
    const result = await this.productRepository.markStaleProducts(this.stalenessThreshold);
    
    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} products as stale due to age (not updated since ${staleDate.toISOString()})`);
      this.eventEmitter.emit('products.stale', { count: result.count, timestamp: new Date() });
    }
    
    return result;
  }

  private getStaleReason(lastFetchedAt: Date): string {
    const staleDate = new Date(Date.now() - this.stalenessThreshold);
    if (lastFetchedAt < staleDate) {
      return `Product data is stale (last fetched at ${lastFetchedAt.toISOString()})`;
    }
    return 'Product is no longer provided by the source';
  }

  async getAllProducts(filters?: {
    name?: string;
    minPrice?: number;
    maxPrice?: number;
    availability?: boolean;
    provider?: string;
    includeStale?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { 
      name, 
      minPrice, 
      maxPrice, 
      availability, 
      provider, 
      includeStale = false,
      page = 1, 
      limit = 10 
    } = filters || {};

    const skip = (page - 1) * limit;
    
    // Build filters for the database query
    const where: Prisma.ProductWhereInput = {};
    
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }
    
    if (provider) {
      where.providerName = provider;
    }
    
    if (!includeStale) {
      where.isStale = false;
    }
    
    // Count total products matching the filters
    const totalCount = await this.productRepository.count(where);
    
    // Get filtered products
    const products = await this.productRepository.findMany({
      skip,
      take: limit,
      where,
      orderBy: { updatedAt: 'desc' }
    });
    
    // Further filter results based on price and availability
    // (These filters need post-processing since they're related to nested data)
    let filteredProducts = products;
    
    if (minPrice !== undefined || maxPrice !== undefined || availability !== undefined) {
      filteredProducts = products.filter(product => {
        const price = product.prices[0]?.value;
        const isAvailable = product.availability[0]?.isAvailable;
        
        // Apply price filters
        if (minPrice !== undefined && (price === undefined || price < minPrice)) {
          return false;
        }
        
        if (maxPrice !== undefined && (price === undefined || price > maxPrice)) {
          return false;
        }
        
        // Apply availability filter
        if (availability !== undefined && isAvailable !== availability) {
          return false;
        }
        
        return true;
      });
    }
    
    // Map products to a clean response format
    return {
      data: filteredProducts.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        provider: product.providerName,
        providerId: product.providerId,
        price: product.prices[0]?.value,
        currency: product.prices[0]?.currency,
        isAvailable: product.availability[0]?.isAvailable,
        isStale: product.isStale,
        lastFetchedAt: product.lastFetchedAt,
        updatedAt: product.updatedAt,
      })),
      meta: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    };
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findUnique(id);

    if (!product) {
      return null;
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      provider: product.providerName,
      providerId: product.providerId,
      priceHistory: product.prices.map(price => ({
        value: price.value,
        currency: price.currency,
        timestamp: price.createdAt,
      })),
      isAvailable: product.availability[0]?.isAvailable,
      isStale: product.isStale,
      lastFetchedAt: product.lastFetchedAt,
      updatedAt: product.updatedAt,
    };
  }
} 