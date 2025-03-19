import { Controller, Get } from '@nestjs/common';
import { ProviderThreeService } from '../providers/provider-three.service';
import { Public } from '../../auth/public.decorator';

@Controller('provider-three')
export class ProviderThreeController {
  constructor(private readonly providerThreeService: ProviderThreeService) {}

  @Get()
  @Public()
  getProducts() {
    return this.providerThreeService.getProducts();
  }
} 