import { Controller, Get } from '@nestjs/common';
import { ProviderOneService } from '../providers/provider-one.service';
import { Public } from '../../auth/public.decorator';

@Controller('provider-one')
export class ProviderOneController {
  constructor(private readonly providerOneService: ProviderOneService) {}

  @Get()
  @Public()
  getProducts() {
    return this.providerOneService.getProducts();
  }
} 