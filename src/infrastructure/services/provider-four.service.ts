import { Injectable } from "@nestjs/common";
import { ProviderProduct } from "../../domain/entities/product.model";
import { BaseProviderService } from "./base-provider.service";

@Injectable()
export class ProviderFourService extends BaseProviderService {
  protected readonly updateInterval = 30000;
  protected readonly provider = "provider-four";

  protected initializeProducts(): void {
    this.products = [
      {
        id: "p4-001",
        name: "Microservices Architecture",
        description: "Building scalable systems with microservices",
        price: 54.99,
        currency: "USD",
        availability: true,
        isAvailable: true,
        lastUpdated: new Date(),
      },
      {
        id: "p4-002",
        name: "Cloud Native Applications",
        description: "Develop applications optimized for cloud environments",
        price: 47.99,
        currency: "USD",
        availability: true,
        isAvailable: true,
        lastUpdated: new Date(),
      },
      {
        id: "p4-003",
        name: "Serverless Computing",
        description: "Building applications without managing servers",
        price: 39.99,
        currency: "USD",
        availability: false,
        isAvailable: false,
        lastUpdated: new Date(),
      },
      {
        id: "p4-004",
        name: "DevOps Essentials",
        description: "Streamlining development and operations",
        price: 42.99,
        currency: "USD",
        availability: true,
        isAvailable: true,
        lastUpdated: new Date(),
      },
    ];
  }

  // Override the base updateRandomProduct method to add custom behavior
  protected updateRandomProduct(): void {
    if (this.products.length === 0) return;

    const randomIndex = Math.floor(Math.random() * this.products.length);
    const product = this.products[randomIndex];

    // Update price with 35% probability (more frequent than base)
    if (Math.random() < 0.35) {
      const priceChange = (Math.random() - 0.5) * 12; // Slightly larger price changes
      product.price = Math.max(9.99, +(product.price + priceChange).toFixed(2));
    }

    // Update availability with 15% probability
    if (Math.random() < 0.15) {
      product.availability = !product.availability;
      product.isAvailable = product.availability;
    }

    product.lastUpdated = new Date();
  }
}
