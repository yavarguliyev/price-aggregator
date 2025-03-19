export interface ProviderProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  availability: boolean;
  isAvailable: boolean;
  lastUpdated: Date;
} 