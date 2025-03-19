import { Controller, Get } from '@nestjs/common';
import { ProviderOneService } from '../providers/provider-one.service';
import { ProviderProduct } from '../models/product.model';

@Controller('api/provider-one')
export class ProviderOneController {
  constructor(private readonly providerOneService: ProviderOneService) {}

  @Get('products')
  getProducts(): ProviderProduct[] {
    return this.providerOneService.getProducts();
  }
} 