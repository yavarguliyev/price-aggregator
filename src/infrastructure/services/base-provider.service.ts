import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ProviderProduct } from '../../domain/entities/product.model';

@Injectable()
export abstract class BaseProviderService implements OnModuleDestroy {
  protected products: ProviderProduct[] = [];
  protected abstract readonly updateInterval: number;
  protected abstract readonly provider: string;
  private updateIntervalId?: NodeJS.Timeout;

  constructor () {
    this.initializeProducts();
    this.startUpdating();
  }

  protected abstract initializeProducts(): void;

  private startUpdating (): void {
    this.updateIntervalId = setInterval(() => {
      this.updateRandomProduct();
    }, this.updateInterval);
  }

  public onModuleDestroy (): void {
    this.stopUpdating();
  }

  public stopUpdating (): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      delete this.updateIntervalId;
    }
  }

  protected updateRandomProduct (): void {
    if (this.products.length === 0) return;

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

  public getProducts (): ProviderProduct[] {
    return this.products;
  }
}
