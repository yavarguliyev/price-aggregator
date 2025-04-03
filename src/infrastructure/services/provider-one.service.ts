import { Injectable } from '@nestjs/common';

import { ProviderProduct } from '../../domain/entities/product.model';
import { BaseProviderService } from './base-provider.service';

@Injectable()
export class ProviderOneService extends BaseProviderService {
  protected readonly updateInterval = 15000;
  protected readonly provider = 'provider-one';

  protected initializeProducts (): void {
    this.products = [
      {
        id: 'p1-001',
        name: 'Introduction to TypeScript',
        description: 'Learn the basics of TypeScript programming',
        price: 29.99,
        currency: 'USD',
        availability: true,
        isAvailable: true,
        lastUpdated: new Date()
      },
      {
        id: 'p1-002',
        name: 'Advanced React Patterns',
        description: 'Master React with advanced design patterns',
        price: 49.99,
        currency: 'USD',
        availability: false,
        isAvailable: false,
        lastUpdated: new Date()
      },
      {
        id: 'p1-003',
        name: 'NestJS for Professionals',
        description: 'Build scalable Node.js applications with NestJS',
        price: 39.99,
        currency: 'USD',
        availability: true,
        isAvailable: true,
        lastUpdated: new Date()
      }
    ];
  }

  protected updateRandomProduct (): void {
    const randomIndex = Math.floor(Math.random() * this.products.length);
    const product = this.products[randomIndex];

    if (Math.random() < 0.3) {
      const priceChange = (Math.random() - 0.5) * 10;
      product.price = Math.max(9.99, +(product.price + priceChange).toFixed(2));
    }

    if (Math.random() < 0.2) {
      product.availability = !product.availability;
      product.isAvailable = product.availability;
    }

    product.lastUpdated = new Date();
  }

  getProducts (): ProviderProduct[] {
    return this.products;
  }
}
