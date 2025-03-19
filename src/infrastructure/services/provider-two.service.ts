import { Injectable } from "@nestjs/common";
import { ProviderProduct } from "../../domain/entities/product.model";

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
        id: "book-123",
        name: "JavaScript: The Good Parts",
        description: "Learn JavaScript best practices",
        price: 29.99,
        currency: "EUR",
        availability: true,
        isAvailable: true,
        lastUpdated: new Date(),
      },
      {
        id: "book-124",
        name: "Machine Learning for Beginners",
        description: "Gentle introduction to machine learning concepts",
        price: 39.99,
        currency: "EUR",
        availability: true,
        isAvailable: true,
        lastUpdated: new Date(),
      },
      {
        id: "book-125",
        name: "Cloud Computing Essentials",
        description: "Learn cloud computing from scratch",
        price: 49.99,
        currency: "EUR",
        availability: true,
        isAvailable: true,
        lastUpdated: new Date(),
      },
      {
        id: "book-126",
        name: "Blockchain Development",
        description: "Create your own blockchain applications",
        price: 59.99,
        currency: "EUR",
        availability: true,
        isAvailable: true,
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
    const randomIndex = Math.floor(Math.random() * this.products.length);
    const product = this.products[randomIndex];

    // Randomly change price
    if (Math.random() < 0.3) {
      const priceChange = (Math.random() - 0.5) * 12; // -6 to +6
      product.price = Math.max(9.99, +(product.price + priceChange).toFixed(2));
    }

    // Randomly change availability
    if (Math.random() < 0.2) {
      product.availability = !product.availability;
      product.isAvailable = product.availability; // Keep them in sync
    }

    product.lastUpdated = new Date();
  }

  getProducts(): ProviderProduct[] {
    return this.products;
  }
}
