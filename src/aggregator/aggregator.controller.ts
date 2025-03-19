import { Controller, Get, Param, Query } from '@nestjs/common';
import { AggregatorService } from './aggregator.service';
import { ApiQuery, ApiParam, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Products API')
@Controller('api/products')
export class AggregatorController {
  constructor(private readonly aggregatorService: AggregatorService) {}

  @ApiOperation({ summary: 'Get products with price or availability changes' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Time frame in minutes to check for changes' })
  @Get('changes')
  async getChanges(@Query('timeframe') timeframe?: number) {
    return this.aggregatorService.getChanges(timeframe ? parseInt(timeframe.toString()) : undefined);
  }

  @ApiOperation({ summary: 'Get stale products' })
  @Get('stale')
  async getStaleProducts() {
    return this.aggregatorService.getStaleProducts();
  }

  @ApiOperation({ summary: 'Get detailed product information by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.aggregatorService.getProductById(id);
  }

  @ApiOperation({ summary: 'Get a list of products with filters' })
  @ApiQuery({ name: 'name', required: false, description: 'Filter by product name (case insensitive)' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Filter by minimum price' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Filter by maximum price' })
  @ApiQuery({ name: 'availability', required: false, description: 'Filter by availability status' })
  @ApiQuery({ name: 'provider', required: false, description: 'Filter by provider name' })
  @ApiQuery({ name: 'includeStale', required: false, description: 'Include stale products in results' })
  @Get()
  async getAllProducts(
    @Query('name') name?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('availability') availability?: boolean,
    @Query('provider') provider?: string,
    @Query('includeStale') includeStale?: string,
  ) {
    return this.aggregatorService.getAllProducts({
      name,
      minPrice: minPrice ? parseFloat(minPrice.toString()) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice.toString()) : undefined,
      availability: availability !== undefined ? availability === true : undefined,
      provider,
      includeStale: includeStale === 'true',
    });
  }
} 