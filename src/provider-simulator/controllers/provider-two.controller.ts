import { Controller, Get } from '@nestjs/common';
import { ProviderTwoService } from '../providers/provider-two.service';
import { ProviderProduct } from '../models/product.model';
import { Public } from '../../auth/public.decorator';

@Controller('api/provider-two')
export class ProviderTwoController {
  constructor(private readonly providerTwoService: ProviderTwoService) {}

  @Public()
  @Get('products')
  getProducts(): ProviderProduct[] {
    return this.providerTwoService.getProducts();
  }
} 