import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderOneService } from '../provider-simulator/providers/provider-one.service';
import { ProviderTwoService } from '../provider-simulator/providers/provider-two.service';
import { ProviderProduct } from '../provider-simulator/models/product.model';
import { Availability, Price, Product } from '@prisma/client';

@Injectable()
export class AggregatorService implements OnModuleInit {
  private readonly logger = new Logger(AggregatorService.name);
  private readonly fetchInterval = 10000; // 10 seconds
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerOneService: ProviderOneService,
    private readonly providerTwoService: ProviderTwoService,
  ) {}

  async onModuleInit() {
    // Initial fetch from all providers
    await this.fetchAllProviders();
    
    // Set up interval for regular fetching
    setInterval(async () => {
      await this.fetchAllProviders();
    }, this.fetchInterval);
  }

  async fetchAllProviders() {
    try {
      // Fetch concurrently from all providers
      await Promise.all([
        this.fetchAndSaveProviderData('provider-one', this.providerOneService.getProducts()),
        this.fetchAndSaveProviderData('provider-two', this.providerTwoService.getProducts()),
      ]);
      this.logger.log('Successfully fetched data from all providers');
    } catch (error) {
      this.logger.error(`Error fetching provider data: ${error.message}`);
    }
  }

  private async fetchAndSaveProviderData(providerName: string, products: ProviderProduct[]) {
    for (const product of products) {
      await this.saveProduct(providerName, product);
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
      
      if (existingProduct) {
        // Update the existing product
        product = await this.prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            name: providerProduct.name,
            description: providerProduct.description,
            updatedAt: new Date(),
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
          },
        });
      }

      // Save the current price
      const lastPrice = await this.prisma.price.findFirst({
        where: { productId: product.id },
        orderBy: { createdAt: 'desc' },
      });

      // Only create a new price record if the price has changed
      if (!lastPrice || lastPrice.value !== providerProduct.price || lastPrice.currency !== providerProduct.currency) {
        await this.prisma.price.create({
          data: {
            value: providerProduct.price,
            currency: providerProduct.currency,
            productId: product.id,
          },
        });
      }

      // Save the current availability
      const lastAvailability = await this.prisma.availability.findFirst({
        where: { productId: product.id },
        orderBy: { createdAt: 'desc' },
      });

      // Only create a new availability record if it has changed
      if (!lastAvailability || lastAvailability.isAvailable !== providerProduct.availability) {
        await this.prisma.availability.create({
          data: {
            isAvailable: providerProduct.availability,
            productId: product.id,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error saving product ${providerProduct.id} from ${providerName}: ${error.message}`);
      throw error;
    }
  }

  async getAllProducts(filters?: {
    name?: string;
    minPrice?: number;
    maxPrice?: number;
    availability?: boolean;
    provider?: string;
  }) {
    const products = await this.prisma.product.findMany({
      where: {
        ...(filters?.name && { name: { contains: filters.name, mode: 'insensitive' } }),
        ...(filters?.provider && { providerName: filters.provider }),
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

    return products
      .filter(product => {
        const currentPrice = product.prices[0]?.value;
        const isAvailable = product.availability[0]?.isAvailable;
        
        return (
          (filters?.minPrice === undefined || currentPrice >= filters.minPrice) &&
          (filters?.maxPrice === undefined || currentPrice <= filters.maxPrice) &&
          (filters?.availability === undefined || isAvailable === filters.availability)
        );
      })
      .map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        provider: product.providerName,
        providerId: product.providerId,
        price: product.prices[0]?.value,
        currency: product.prices[0]?.currency,
        isAvailable: product.availability[0]?.isAvailable,
        updatedAt: product.updatedAt,
      }));
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