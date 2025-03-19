export interface ProviderService {
  getProducts(): Promise<any[]>;
  getProductById(id: string): Promise<any>;
  getProviderName(): string;
}
