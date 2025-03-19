import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductRepository } from '../../infrastructure/persistence/product.repository';
import { Prisma } from '@prisma/client';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    prices: true;
    availability: true;
  };
}>;

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private handleError(error: unknown, context: string): never {
    if (error instanceof Error) {
      throw new Error(`Error in ${context}: ${error.message}`);
    }

    throw new Error(`Unknown error in ${context}`);
  }

  async checkAndMarkStaleProducts(): Promise<void> {
    try {
      const stalenessThreshold = 24 * 60 * 60 * 1000;
      await this.productRepository.markStaleProducts(stalenessThreshold);
      this.eventEmitter.emit('products.stale.checked', { timestamp: new Date() });
    } catch (error) {
      this.handleError(error, 'checkAndMarkStaleProducts');
    }
  }

  async getStaleProducts() {
    try {
      return await this.productRepository.findStaleProducts();
    } catch (error) {
      this.handleError(error, 'getStaleProducts');
    }
  }

  async getProductById(id: string) {
    try {
      const product = await this.productRepository.findById(id);
      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }

      return product;
    } catch (error) {
      this.handleError(error, 'getProductById');
    }
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
    try {
      const where: Prisma.ProductWhereInput = {};

      if (filters?.name) {
        where.name = { contains: filters.name, mode: 'insensitive' };
      }

      if (filters?.provider) {
        where.providerName = filters.provider;
      }

      if (!filters?.includeStale) {
        where.isStale = false;
      }

      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        this.productRepository.findMany({
          skip,
          take: limit,
          where,
          orderBy: { updatedAt: 'desc' },
        }),
        this.productRepository.count(where)
      ]);

      const mappedProducts = products.map((product: ProductWithRelations) => {
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.prices?.[0]?.value || 0,
          currency: product.prices?.[0]?.currency || 'USD',
          isAvailable: product.availability?.[0]?.isAvailable || false,
          provider: product.providerName,
          providerId: product.providerId,
          lastFetchedAt: product.lastFetchedAt,
          isStale: product.isStale,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        };
      });

      let filteredProducts = mappedProducts;

      if (filters?.minPrice !== undefined) {
        filteredProducts = filteredProducts.filter((p) => p.price >= filters.minPrice!);
      }

      if (filters?.maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter((p) => p.price <= filters.maxPrice!);
      }

      if (filters?.availability !== undefined) {
        filteredProducts = filteredProducts.filter((p) => p.isAvailable === filters.availability);
      }

      return {
        data: filteredProducts,
        total,
        page,
        limit
      };
    } catch (error) {
      this.handleError(error, 'getAllProducts');
    }
  }
}
