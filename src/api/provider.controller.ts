import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { ProviderService } from '../application/services/provider.service';

@ApiTags('providers')
@Controller('providers')
export class ProviderController {
  constructor (private readonly providerService: ProviderService) {}

  @Get(':providerId')
  @ApiOperation({ summary: 'Get products from a specific provider' })
  @ApiParam({ name: 'providerId', description: 'Provider ID (one, two, three, four)' })
  getProviderProducts (@Param('providerId') providerId: string) {
    return this.providerService.getProviderProducts(providerId);
  }
}
