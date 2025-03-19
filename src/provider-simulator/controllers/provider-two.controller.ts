import { Controller, Get } from '@nestjs/common';
import { ProviderTwoService } from '../providers/provider-two.service';
import { Public } from '../../auth/public.decorator';

@Controller('provider-two')
export class ProviderTwoController {
  constructor(private readonly providerTwoService: ProviderTwoService) {}

  @Get()
  @Public()
  getProducts() {
    return this.providerTwoService.getProducts();
  }
} 