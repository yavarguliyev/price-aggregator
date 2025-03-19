import { Injectable } from '@nestjs/common';
import { ProviderProduct } from '../../domain/entities/product.model';

@Injectable()
export class ProviderOneService {
  private products: ProviderProduct[] = [];
  private readonly updateInterval = 5000;

  constructor() {
    this.initializeProducts();
    this.startUpdating();
  }

  private initializeProducts(): void {
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
      },
    ];
  }

  private startUpdating(): void {
    setInterval(() => {
      this.updateRandomProduct();
    }, this.updateInterval);
  }

  private updateRandomProduct(): void {
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

  getProducts(): ProviderProduct[] {
    return this.products;
  }
}
