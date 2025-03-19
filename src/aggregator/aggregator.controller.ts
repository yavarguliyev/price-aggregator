import { Controller, Get, Param, Query } from '@nestjs/common';
import { AggregatorService } from './aggregator.service';

@Controller('api/products')
export class AggregatorController {
  constructor(private readonly aggregatorService: AggregatorService) {}

  @Get('changes')
  async getChanges(@Query('timeframe') timeframe?: number) {
    return this.aggregatorService.getChanges(timeframe ? parseInt(timeframe.toString()) : undefined);
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.aggregatorService.getProductById(id);
  }

  @Get()
  async getAllProducts(
    @Query('name') name?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('availability') availability?: boolean,
    @Query('provider') provider?: string,
  ) {
    return this.aggregatorService.getAllProducts({
      name,
      minPrice: minPrice ? parseFloat(minPrice.toString()) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice.toString()) : undefined,
      availability: availability !== undefined ? availability === true : undefined,
      provider,
    });
  }
} 