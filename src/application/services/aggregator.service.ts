import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { ProductChangesDto } from '../../domain/dto/product-changes.dto';
import { ProductService } from './product.service';
import { ProviderService } from './provider.service';

interface ProductWithHistory {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  isAvailable: boolean;
  provider: string;
  providerId: string;
  lastFetchedAt: Date;
  isStale: boolean;
  createdAt: Date;
  updatedAt: Date;
  priceHistory?: Array<{
    amount: number;
    currency: string;
    timestamp: Date;
  }>;
  availabilityHistory?: Array<{
    isAvailable: boolean;
    timestamp: Date;
  }>;
}

@Injectable()
export class AggregatorService implements OnModuleInit, OnModuleDestroy {
  private stalenessCheckIntervalId?: NodeJS.Timeout;

  constructor (
    private readonly productService: ProductService,
    private readonly providerService: ProviderService,
    private readonly prisma: PrismaService
  ) {}

  onModuleInit () {
    this.providerService.startFetchingData();

    this.stalenessCheckIntervalId = setInterval(() => {
      void this.productService.checkAndMarkStaleProducts();
    }, 60000);
  }

  onModuleDestroy () {
    this.providerService.stopFetchingData();

    if (this.stalenessCheckIntervalId) {
      clearInterval(this.stalenessCheckIntervalId);
      delete this.stalenessCheckIntervalId;
    }
  }

  async getStaleProducts () {
    try {
      const products = await this.productService.getStaleProducts();
      return { data: products };
    } catch {
      return { data: [] };
    }
  }

  async getAllProducts (filters?: {
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
      return await this.productService.getAllProducts(filters);
    } catch {
      return {
        data: [],
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 10
      };
    }
  }

  async getProductById (id: string) {
    try {
      const product = (await this.productService.getProductById(id)) as unknown as ProductWithHistory;
      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }

      return {
        data: product,
        priceHistory: product.priceHistory || [],
        availabilityHistory: product.availabilityHistory || []
      };
    } catch {
      return { data: null, priceHistory: [], availabilityHistory: [] };
    }
  }

  async getChanges (timeframe?: number) {
    try {
      const changes = await this.providerService.getChanges(timeframe);
      return { data: changes };
    } catch {
      return { data: [] };
    }
  }

  async getProductChanges (timeframe: number): Promise<ProductChangesDto[]> {
    const cutoffTime = new Date(Date.now() - timeframe);

    const changes = await this.prisma.product.findMany({
      where: {
        OR: [
          {
            prices: {
              some: {
                createdAt: {
                  gte: cutoffTime
                }
              }
            }
          },
          {
            availability: {
              some: {
                createdAt: {
                  gte: cutoffTime
                }
              }
            }
          }
        ]
      },
      include: {
        prices: {
          where: {
            createdAt: {
              gte: cutoffTime
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        availability: {
          where: {
            createdAt: {
              gte: cutoffTime
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    return changes.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.prices[0]?.amount ?? product.price,
      currency: product.prices[0]?.currency ?? product.currency,
      isAvailable: product.availability[0]?.isAvailable ?? product.isAvailable,
      provider: product.provider,
      changedAt: product.prices[0]?.createdAt ?? product.availability[0]?.createdAt ?? product.updatedAt
    }));
  }
}
