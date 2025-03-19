export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  isAvailable: boolean;
  provider: string;
  providerId: string;
  lastFetchedAt: Date;
  isStale: boolean;
  createdAt: Date;
  updatedAt: Date;
}
