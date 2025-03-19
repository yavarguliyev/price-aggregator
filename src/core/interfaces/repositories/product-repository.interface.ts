export interface ProductRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any>;
  findByProvider(provider: string): Promise<any[]>;
  create(product: any): Promise<any>;
  update(id: string, product: any): Promise<any>;
  remove(id: string): Promise<void>;
}
