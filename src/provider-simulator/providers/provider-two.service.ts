import { Injectable } from '@nestjs/common';
import { ProviderProduct } from '../models/product.model';

@Injectable()
export class ProviderTwoService {
  private products: ProviderProduct[] = [];
  private readonly updateInterval = 7000; // 7 seconds

  constructor() {
    this.initializeProducts();
    this.startUpdating();
  }

  private initializeProducts(): void {
    this.products = [
      {
        id: 'book-123',
        name: 'Python Data Science Handbook',
        description: 'Comprehensive guide to data science with Python',
        price: 45.50,
        currency: 'EUR',
        availability: true,
        lastUpdated: new Date(),
      },
      {
        id: 'book-124',
        name: 'Machine Learning for Beginners',
        description: 'Gentle introduction to machine learning concepts',
        price: 35.75,
        currency: 'EUR',
        availability: false,
        lastUpdated: new Date(),
      },
      {
        id: 'book-125',
        name: 'Cloud Computing Essentials',
        description: 'Learn cloud computing from scratch',
        price: 55.25,
        currency: 'EUR',
        availability: true,
        lastUpdated: new Date(),
      },
      {
        id: 'book-126',
        name: 'Blockchain Development',
        description: 'Create your own blockchain applications',
        price: 65.00,
        currency: 'EUR',
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
    
    // Randomly change price by +/- 5%
    const priceChange = (Math.random() - 0.5) * 0.1;
    product.price = parseFloat((product.price * (1 + priceChange)).toFixed(2));
    
    // Randomly change availability with 25% chance
    if (Math.random() < 0.25) {
      product.availability = !product.availability;
    }
    
    product.lastUpdated = new Date();
  }

  getProducts(): ProviderProduct[] {
    return this.products;
  }
} 