import { Injectable } from "@nestjs/common";
import { BaseProviderService } from "./base-provider.service";
import { ProviderProduct } from "../../domain/entities/product.model";

@Injectable()
export class ProviderTwoService extends BaseProviderService {
  protected readonly updateInterval = 20000;
  protected readonly provider = "provider-two";

  protected initializeProducts(): void {
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

  protected updateRandomProduct(): void {
    if (this.products.length === 0) return;

    const randomIndex = Math.floor(Math.random() * this.products.length);
    const product = this.products[randomIndex];

    if (Math.random() < 0.3) {
      const priceChange = (Math.random() - 0.5) * 12;
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
