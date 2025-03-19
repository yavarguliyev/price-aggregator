import { Injectable } from "@nestjs/common";
import { BaseProviderService } from "./base-provider.service";

@Injectable()
export class ProviderThreeService extends BaseProviderService {
  protected readonly updateInterval = 25000;
  protected readonly provider = "provider-three";

  protected initializeProducts(): void {
    this.products = [
      {
        id: "course-001",
        name: "DevOps Fundamentals",
        description: "Learn CI/CD, containerization, and cloud deployment",
        price: 79.99,
        currency: "GBP",
        availability: true,
        isAvailable: true,
        lastUpdated: new Date(),
      },
      {
        id: "course-002",
        name: "Microservices Architecture",
        description: "Design and implement scalable microservices",
        price: 89.99,
        currency: "GBP",
        availability: true,
        isAvailable: true,
        lastUpdated: new Date(),
      },
      {
        id: "course-003",
        name: "GraphQL API Development",
        description: "Build efficient APIs with GraphQL",
        price: 69.99,
        currency: "GBP",
        availability: false,
        isAvailable: false,
        lastUpdated: new Date(),
      },
      {
        id: "course-004",
        name: "Serverless Computing",
        description:
          "Build applications using AWS Lambda and other serverless technologies",
        price: 74.99,
        currency: "GBP",
        availability: true,
        isAvailable: true,
        lastUpdated: new Date(),
      },
      {
        id: "course-005",
        name: "Cybersecurity Essentials",
        description: "Learn how to secure applications and infrastructure",
        price: 99.99,
        currency: "GBP",
        availability: true,
        isAvailable: true,
        lastUpdated: new Date(),
      },
    ];
  }

  // Override the default random product update to use different probability factors
  protected updateRandomProduct(): void {
    if (this.products.length === 0) return;

    const randomIndex = Math.floor(Math.random() * this.products.length);
    const product = this.products[randomIndex];

    if (Math.random() < 0.25) {
      // Different probability
      const priceChange = (Math.random() - 0.5) * 15; // Different price change factor
      product.price = Math.max(
        19.99,
        +(product.price + priceChange).toFixed(2),
      );
    }

    if (Math.random() < 0.15) {
      // Different probability
      product.availability = !product.availability;
      product.isAvailable = product.availability;
    }

    product.lastUpdated = new Date();
  }
}
