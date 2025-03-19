import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ProviderProduct } from '../../provider-simulator/models/product.model';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUnique(id: string) {
    return this.prisma.product.findUnique({
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
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.product.findMany({
      skip,
      take,
      where,
      orderBy,
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
  }

  async count(where?: Prisma.ProductWhereInput) {
    return this.prisma.product.count({ where });
  }

  async findStaleProducts(stalenessThreshold: number) {
    const staleDate = new Date(Date.now() - stalenessThreshold);
    return this.prisma.product.findMany({
      where: {
        isStale: true,
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
  }

  async markStaleProducts(stalenessThreshold: number) {
    const staleDate = new Date(Date.now() - stalenessThreshold);
    return this.prisma.product.updateMany({
      where: {
        lastFetchedAt: { lt: staleDate },
        isStale: false,
      },
      data: {
        isStale: true,
      },
    });
  }

  async createOrUpdateProduct(providerName: string, providerProduct: ProviderProduct) {
    // First, find if the product already exists
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        providerName,
        providerId: providerProduct.id,
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

    // Create or update product
    const product = await this.prisma.product.upsert({
      where: {
        id: existingProduct?.id || 'create-new',
      },
      update: {
        name: providerProduct.name,
        description: providerProduct.description,
        lastFetchedAt: new Date(),
        isStale: false,
      },
      create: {
        providerName,
        providerId: providerProduct.id,
        name: providerProduct.name,
        description: providerProduct.description,
        lastFetchedAt: new Date(),
        isStale: false,
      },
    });

    // Handle price update if needed
    if (!existingProduct?.prices[0] || 
        existingProduct.prices[0].value !== providerProduct.price || 
        existingProduct.prices[0].currency !== providerProduct.currency) {
      await this.prisma.price.create({
        data: {
          productId: product.id,
          value: providerProduct.price,
          currency: providerProduct.currency,
        },
      });
    }

    // Handle availability update if needed
    if (!existingProduct?.availability[0] || 
        existingProduct.availability[0].isAvailable !== providerProduct.isAvailable) {
      await this.prisma.availability.create({
        data: {
          productId: product.id,
          isAvailable: providerProduct.isAvailable,
        },
      });
    }

    return product;
  }

  async findPriceChanges(timeLimit: Date) {
    return this.prisma.price.findMany({
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
  }

  async findAvailabilityChanges(timeLimit: Date) {
    return this.prisma.availability.findMany({
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
  }
} 