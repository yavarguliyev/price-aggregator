import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ProviderProduct } from "../../domain/entities/product.model";

/**
 * Abstract base class for provider services to eliminate code duplication
 * All provider services share the same core functionality and only differ in:
 * - Product data
 * - Update intervals
 * - Specific update logic parameters
 */
@Injectable()
export abstract class BaseProviderService implements OnModuleDestroy {
  protected products: ProviderProduct[] = [];
  protected abstract readonly updateInterval: number;
  protected abstract readonly provider: string;
  private updateIntervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeProducts();
    this.startUpdating();
  }

  /**
   * Initialize the product data for this provider
   * Each concrete provider will implement this with its own data
   */
  protected abstract initializeProducts(): void;

  /**
   * Start the periodic product updates
   */
  private startUpdating(): void {
    this.updateIntervalId = setInterval(() => {
      this.updateRandomProduct();
    }, this.updateInterval);
  }

  /**
   * Stop the periodic product updates
   */
  public onModuleDestroy(): void {
    this.stopUpdating();
  }

  /**
   * Clean up resources
   */
  public stopUpdating(): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
  }

  /**
   * Update a random product's price and/or availability
   * Base implementation that can be overridden by concrete providers
   */
  protected updateRandomProduct(): void {
    if (this.products.length === 0) return;

    const randomIndex = Math.floor(Math.random() * this.products.length);
    const product = this.products[randomIndex];

    // Update price with 30% probability
    if (Math.random() < 0.3) {
      const priceChange = (Math.random() - 0.5) * 10;
      product.price = Math.max(9.99, +(product.price + priceChange).toFixed(2));
    }

    // Update availability with 20% probability
    if (Math.random() < 0.2) {
      product.availability = !product.availability;
      product.isAvailable = product.availability;
    }

    product.lastUpdated = new Date();
  }

  /**
   * Get all products from this provider
   */
  public getProducts(): ProviderProduct[] {
    return this.products;
  }
}
