export class Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  isAvailable: boolean;
  provider: string;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(params: {
    id?: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    isAvailable: boolean;
    provider: string;
    providerId: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = params.id || Math.random().toString(36).substring(2, 15);
    this.name = params.name;
    this.description = params.description || "";
    this.price = params.price;
    this.currency = params.currency;
    this.isAvailable = params.isAvailable;
    this.provider = params.provider;
    this.providerId = params.providerId;
    this.createdAt = params.createdAt || new Date();
    this.updatedAt = params.updatedAt || new Date();
  }

  updatePrice(price: number, currency: string): void {
    this.price = price;
    this.currency = currency;
    this.updatedAt = new Date();
  }

  updateAvailability(isAvailable: boolean): void {
    this.isAvailable = isAvailable;
    this.updatedAt = new Date();
  }
}
