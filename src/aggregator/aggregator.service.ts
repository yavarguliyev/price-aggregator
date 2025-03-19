import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderOneService } from '../provider-simulator/providers/provider-one.service';
import { ProviderTwoService } from '../provider-simulator/providers/provider-two.service';
import { ProviderThreeService } from '../provider-simulator/providers/provider-three.service';
import { ProviderProduct } from '../provider-simulator/models/product.model';
import { Availability, Price, Product } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AggregatorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AggregatorService.name);
  private readonly fetchInterval: number;
  private readonly stalenessThreshold: number;
  private intervalId: NodeJS.Timeout | null = null;
  private stalenessCheckIntervalId: NodeJS.Timeout | null = null;
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerOneService: ProviderOneService,
    private readonly providerTwoService: ProviderTwoService,
    private readonly providerThreeService: ProviderThreeService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2
  ) {
    // Read configuration from environment variables or use defaults
    this.fetchInterval = this.configService.get<number>('FETCH_INTERVAL') || 10000; // 10 seconds
    
    // Staleness threshold - time after which data is considered stale if not updated
    this.stalenessThreshold = this.configService.get<number>('STALENESS_THRESHOLD') || 60000; // 1 minute
    
    this.logger.log(`Fetch interval set to ${this.fetchInterval}ms`);
    this.logger.log(`Staleness threshold set to ${this.stalenessThreshold}ms`);
  }

  async onModuleInit() {
    // Initial fetch from all providers
    await this.fetchAllProviders();
    
    // Set up interval for regular fetching
    this.intervalId = setInterval(async () => {
      await this.fetchAllProviders();
    }, this.fetchInterval);
    
    // Set up interval for staleness checking
    this.stalenessCheckIntervalId = setInterval(async () => {
      await this.checkAndMarkStaleProducts();
    }, this.fetchInterval * 2); // Check less frequently than fetching
    
    // Prevent keeping Node process alive
    if (this.intervalId.unref) {
      this.intervalId.unref();
    }
    
    if (this.stalenessCheckIntervalId.unref) {
      this.stalenessCheckIntervalId.unref();
    }
  }
  
  onModuleDestroy() {
    // Clean up the intervals when the module is destroyed
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.log('Data fetching interval cleared');
    }
    
    if (this.stalenessCheckIntervalId) {
      clearInterval(this.stalenessCheckIntervalId);
      this.stalenessCheckIntervalId = null;
      this.logger.log('Staleness check interval cleared');
    }
  }

  async fetchAllProviders() {
    try {
      // Fetch concurrently from all providers
      await Promise.all([
        this.fetchAndSaveProviderData('provider-one', this.providerOneService.getProducts()),
        this.fetchAndSaveProviderData('provider-two', this.providerTwoService.getProducts()),
        this.fetchAndSaveProviderData('provider-three', this.providerThreeService.getProducts()),
      ]);
      this.logger.log('Successfully fetched data from all providers');
    } catch (error) {
      this.logger.error(`Error fetching provider data: ${error.message}`);
    }
  }

  private async fetchAndSaveProviderData(providerName: string, products: ProviderProduct[]) {
    // Keep track of all products from this provider to mark stale ones later
    const fetchedProductIds = products.map(p => p.id);
    
    for (const product of products) {
      await this.saveProduct(providerName, product);
    }
    
    // Update products from this provider that were not in this fetch
    // This marks products as stale if they disappeared from the provider's data
    const staleProductsCount = await this.prisma.product.updateMany({
      where: {
        providerName: providerName,
        providerId: { notIn: fetchedProductIds },
        isStale: false
      },
      data: {
        isStale: true
      }
    });
    
    if (staleProductsCount.count > 0) {
      this.logger.log(`Marked ${staleProductsCount.count} products from ${providerName} as stale (no longer provided)`);
    }
  }

  private async saveProduct(providerName: string, providerProduct: ProviderProduct) {
    try {
      // Find an existing product or create a new one
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          providerId: providerProduct.id,
          providerName: providerName,
        },
      });

      let product: Product;
      let productCreated = false;
      
      if (existingProduct) {
        // Update the existing product
        product = await this.prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            name: providerProduct.name,
            description: providerProduct.description,
            updatedAt: new Date(),
            lastFetchedAt: new Date(),
            isStale: false, // Reset stale flag since we just fetched it
          },
        });
      } else {
        // Create a new product
        product = await this.prisma.product.create({
          data: {
            name: providerProduct.name,
            description: providerProduct.description,
            providerId: providerProduct.id,
            providerName: providerName,
            lastFetchedAt: new Date(),
            isStale: false,
          },
        });
        productCreated = true;
      }

      // Save the current price
      const lastPrice = await this.prisma.price.findFirst({
        where: { productId: product.id },
        orderBy: { createdAt: 'desc' },
      });

      let priceChanged = false;
      
      // Only create a new price record if the price has changed
      if (!lastPrice || lastPrice.value !== providerProduct.price || lastPrice.currency !== providerProduct.currency) {
        await this.prisma.price.create({
          data: {
            value: providerProduct.price,
            currency: providerProduct.currency,
            productId: product.id,
          },
        });
        priceChanged = true;
      }

      // Save the current availability
      const lastAvailability = await this.prisma.availability.findFirst({
        where: { productId: product.id },
        orderBy: { createdAt: 'desc' },
      });

      let availabilityChanged = false;
      
      // Only create a new availability record if it has changed
      if (!lastAvailability || lastAvailability.isAvailable !== providerProduct.availability) {
        await this.prisma.availability.create({
          data: {
            isAvailable: providerProduct.availability,
            productId: product.id,
          },
        });
        availabilityChanged = true;
      }
      
      // Emit event for real-time updates if something changed
      if (productCreated || priceChanged || availabilityChanged) {
        const productWithLatestData = {
          ...product,
          price: providerProduct.price,
          currency: providerProduct.currency,
          isAvailable: providerProduct.availability
        };
        this.eventEmitter.emit('product.updated', productWithLatestData);
      }
    } catch (error) {
      this.logger.error(`Error saving product ${providerProduct.id} from ${providerName}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Check for products that haven't been updated recently and mark them as stale.
   * This method is called periodically to ensure data freshness.
   * Products are considered stale if they haven't been updated within the staleness threshold.
   */
  async checkAndMarkStaleProducts() {
    const staleThresholdTime = new Date(Date.now() - this.stalenessThreshold);
    
    try {
      const result = await this.prisma.product.updateMany({
        where: {
          lastFetchedAt: { lt: staleThresholdTime },
          isStale: false
        },
        data: {
          isStale: true
        }
      });
      
      if (result.count > 0) {
        this.logger.log(`Marked ${result.count} products as stale due to age (not updated since ${staleThresholdTime.toISOString()})`);
      }
    } catch (error) {
      this.logger.error(`Error checking for stale products: ${error.message}`);
    }
  }

  /**
   * Retrieve all products that are marked as stale.
   * Stale products are those that haven't been updated within the staleness threshold
   * or are no longer provided by their original source.
   */
  async getStaleProducts() {
    try {
      const staleProducts = await this.prisma.product.findMany({
        where: {
          isStale: true
        },
        include: {
          prices: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          availability: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

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
        lastFetchedAt: product.lastFetchedAt,
        updatedAt: product.updatedAt,
        staleReason: this.getStaleReason(product),
      }));
    } catch (error) {
      this.logger.error(`Error retrieving stale products: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Determine why a product is marked as stale.
   * @param product The stale product
   * @returns A description of why the product is stale
   */
  private getStaleReason(product: Product): string {
    const now = new Date();
    const lastFetchDiff = now.getTime() - product.lastFetchedAt.getTime();
    
    if (lastFetchDiff > this.stalenessThreshold) {
      return `Not updated in ${Math.floor(lastFetchDiff / 1000)} seconds (threshold: ${this.stalenessThreshold / 1000} seconds)`;
    } else {
      return 'No longer provided by source';
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
    // Set default pagination values
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;
    
    // Prepare the where clause for the main query
    const whereClause: any = {
      ...(filters?.name && { 
        name: { 
          contains: filters.name, 
          mode: 'insensitive' as const 
        } 
      }),
      ...(filters?.provider && { providerName: filters.provider }),
      ...(!filters?.includeStale && { isStale: false }),
    };

    // First, get the total count for pagination
    const totalCount = await this.prisma.product.count({
      where: whereClause,
    });

    // Then, perform the main query with optimized includes
    const products = await this.prisma.product.findMany({
      where: whereClause,
      include: {
        prices: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        availability: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      // Add pagination
      skip,
      take: limit,
      // Order by recently updated first
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Apply in-memory filters for price and availability
    // These are done in memory because they depend on the latest price/availability
    const filteredProducts = products.filter(product => {
      // Only apply price filters if prices exist
      if (product.prices.length > 0 && (filters?.minPrice !== undefined || filters?.maxPrice !== undefined)) {
        const currentPrice = product.prices[0]?.value;
        
        if (filters?.minPrice !== undefined && currentPrice < filters.minPrice) {
          return false;
        }
        
        if (filters?.maxPrice !== undefined && currentPrice > filters.maxPrice) {
          return false;
        }
      }
      
      // Only apply availability filter if an availability record exists
      if (product.availability.length > 0 && filters?.availability !== undefined) {
        const isAvailable = product.availability[0]?.isAvailable;
        if (isAvailable !== filters.availability) {
          return false;
        }
      }
      
      return true;
    });

    // Map to the response format
    const mappedProducts = filteredProducts.map(product => ({
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
    }));

    // Return with pagination metadata
    return {
      data: mappedProducts,
      meta: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    };
  }

  async getProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        prices: {
          orderBy: { createdAt: 'desc' },
        },
        availability: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

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

  async getChanges(timeframe?: number) {
    const timeLimit = timeframe ? new Date(Date.now() - timeframe * 60 * 1000) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const priceChanges = await this.prisma.price.findMany({
      where: {
        createdAt: { gt: timeLimit },
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const availabilityChanges = await this.prisma.availability.findMany({
      where: {
        createdAt: { gt: timeLimit },
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by product ID
    const changedProducts = new Map<string, any>();

    for (const priceChange of priceChanges) {
      if (!changedProducts.has(priceChange.productId)) {
        changedProducts.set(priceChange.productId, {
          id: priceChange.product.id,
          name: priceChange.product.name,
          description: priceChange.product.description,
          provider: priceChange.product.providerName,
          providerId: priceChange.product.providerId,
          priceChanges: [],
          availabilityChanges: [],
        });
      }
      
      changedProducts.get(priceChange.productId).priceChanges.push({
        value: priceChange.value,
        currency: priceChange.currency,
        timestamp: priceChange.createdAt,
      });
    }

    for (const availChange of availabilityChanges) {
      if (!changedProducts.has(availChange.productId)) {
        changedProducts.set(availChange.productId, {
          id: availChange.product.id,
          name: availChange.product.name,
          description: availChange.product.description,
          provider: availChange.product.providerName,
          providerId: availChange.product.providerId,
          priceChanges: [],
          availabilityChanges: [],
        });
      }
      
      changedProducts.get(availChange.productId).availabilityChanges.push({
        isAvailable: availChange.isAvailable,
        timestamp: availChange.createdAt,
      });
    }

    return Array.from(changedProducts.values());
  }
} 