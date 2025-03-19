import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Prisma, Product } from '@prisma/client';
import { ProviderProduct } from '../../domain/entities/product.model';

type PrismaProduct = Prisma.ProductGetPayload<{
  include: {
    prices: true;
    availability: true;
  };
}>;

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        prices: { orderBy: { createdAt: 'desc' },  take: 1 },
        availability: { orderBy: { createdAt: 'desc' },  take: 1 }
      },
    });
    return product ? this.mapToEntity(product) : null;
  }

  async findAll(): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      include: {
        prices: { orderBy: { createdAt: 'desc' },  take: 1 },
        availability: { orderBy: { createdAt: 'desc' },  take: 1 }
      },
    });
    return products.map((product) => this.mapToEntity(product));
  }

  async findStaleProducts(): Promise<Product[]> {
    const now = new Date();
    const products = await this.prisma.product.findMany({
      where: { lastFetchedAt: { lt: now } },
      include: {
        prices: { orderBy: { createdAt: 'desc' }, take: 1 },
        availability: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
    });

    return products.map((product) => this.mapToEntity(product));
  }

  async updateById(id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id },
      data,
      include: {
        prices: { orderBy: { createdAt: 'desc' }, take: 1 },
        availability: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });
    return this.mapToEntity(product);
  }

  private mapToEntity(data: PrismaProduct): Product {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      providerName: data.providerName,
      providerId: data.providerId,
      lastFetchedAt: data.lastFetchedAt,
      isStale: data.isStale,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
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
        prices: { orderBy: { createdAt: 'desc' }, take: 1 },
        availability: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
    });
  }

  async count(where?: Prisma.ProductWhereInput) {
    return this.prisma.product.count({ where });
  }

  async markStaleProducts(stalenessThreshold: number) {
    const staleDate = new Date(Date.now() - stalenessThreshold);
    return this.prisma.product.updateMany({
      where: { lastFetchedAt: { lt: staleDate }, isStale: false },
      data: { isStale: true },
    });
  }

  async createOrUpdateProduct(
    providerName: string,
    providerProduct: ProviderProduct,
  ) {
    const existingProduct = await this.prisma.product.findFirst({
      where: { providerName, providerId: providerProduct.id },
      include: {
        prices: { orderBy: { createdAt: 'desc' }, take: 1 },
        availability: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
    });

    const product = await this.prisma.product.upsert({
      where: { id: existingProduct?.id || 'create-new' },
      update: {
        name: providerProduct.name,
        description: providerProduct.description,
        lastFetchedAt: new Date(),
        isStale: false
      },
      create: {
        providerName,
        providerId: providerProduct.id,
        name: providerProduct.name,
        description: providerProduct.description,
        lastFetchedAt: new Date(),
        isStale: false
      },
    });

    if (!existingProduct?.prices[0] || existingProduct.prices[0].value !== providerProduct.price || existingProduct.prices[0].currency !== providerProduct.currency) {
      await this.prisma.price.create({
        data: {
          productId: product.id,
          value: providerProduct.price,
          currency: providerProduct.currency,
        },
      });
    }

    if (!existingProduct?.availability[0] || existingProduct.availability[0].isAvailable !== providerProduct.isAvailable) {
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
      where: { createdAt: { gt: timeLimit } },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAvailabilityChanges(timeLimit: Date) {
    return this.prisma.availability.findMany({
      where: { createdAt: { gt: timeLimit } },
      include: { product: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}
