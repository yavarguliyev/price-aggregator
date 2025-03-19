import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../../core/interfaces/repositories/product-repository.interface';

@Injectable()
export class GetProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(): Promise<any[]> {
    return this.productRepository.findAll();
  }
}
