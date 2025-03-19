import { Injectable } from '@nestjs/common';
import { ProviderProduct } from '../models/product.model';

@Injectable()
export class ProviderOneService {
  private products: ProviderProduct[] = [];
  private readonly updateInterval = 5000; // 5 seconds

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
        lastUpdated: new Date(),
      },
      {
        id: 'p1-002',
        name: 'Advanced React Patterns',
        description: 'Master React with advanced design patterns',
        price: 49.99,
        currency: 'USD',
        availability: true,
        lastUpdated: new Date(),
      },
      {
        id: 'p1-003',
        name: 'NestJS for Professionals',
        description: 'Build scalable Node.js applications with NestJS',
        price: 39.99,
        currency: 'USD',
        availability: true,
        lastUpdated: new Date(),
      },
    ];
  }

  private startUpdating(): void {
    setInterval(() => {
      this.updateRandomProduct();
    }, this.updateInterval);
  }

  private updateRandomProduct(): void {
    const index = Math.floor(Math.random() * this.products.length);
    const product = this.products[index];
    
    // Randomly change price by +/- 10%
    const priceChange = (Math.random() - 0.5) * 0.2;
    product.price = parseFloat((product.price * (1 + priceChange)).toFixed(2));
    
    // Randomly change availability with 20% chance
    if (Math.random() < 0.2) {
      product.availability = !product.availability;
    }
    
    product.lastUpdated = new Date();
  }

  getProducts(): ProviderProduct[] {
    return this.products;
  }
} 