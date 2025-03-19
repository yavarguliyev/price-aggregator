import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../../core/interfaces/repositories/product-repository.interface';

@Injectable()
export class GetProductByIdUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: string): Promise<any> {
    return this.productRepository.findById(id);
  }
}
