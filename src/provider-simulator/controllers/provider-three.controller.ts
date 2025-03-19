import { Controller, Get } from '@nestjs/common';
import { ProviderThreeService } from '../providers/provider-three.service';
import { ProviderProduct } from '../models/product.model';
import { Public } from '../../auth/public.decorator';

@Controller('api/provider-three')
export class ProviderThreeController {
  constructor(private readonly providerThreeService: ProviderThreeService) {}

  @Public()
  @Get('products')
  getProducts(): ProviderProduct[] {
    return this.providerThreeService.getProducts();
  }
} 