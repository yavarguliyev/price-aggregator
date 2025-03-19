import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { AggregatorService } from './aggregator.service';
import { ApiQuery, ApiParam, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

@Controller('products')
@ApiTags('Products')
export class AggregatorController {
  constructor(private readonly aggregatorService: AggregatorService) {}

  @ApiOperation({ summary: 'Get products with price or availability changes' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Time frame in minutes to check for changes' })
  @Get('changes')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('products-changes')
  @CacheTTL(30) // 30 seconds cache for changes - shorter TTL due to frequent changes
  async getChanges(@Query('timeframe') timeframe?: number) {
    return this.aggregatorService.getChanges(timeframe ? parseInt(timeframe.toString()) : undefined);
  }

  @ApiOperation({ summary: 'Get stale products' })
  @Get('stale')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('products-stale')
  @CacheTTL(60) // 60 seconds cache
  async getStaleProducts() {
    return this.aggregatorService.getStaleProducts();
  }

  @ApiOperation({ summary: 'Get detailed product information by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60) // 60 seconds cache
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
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30) // 30 seconds cache for the main product list
  async getAllProducts(
    @Query('name') name?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('availability') availability?: boolean,
    @Query('provider') provider?: string,
    @Query('includeStale') includeStale?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Generate a cache key based on query parameters
    const cacheKey = `products-${name || ''}-${minPrice || ''}-${maxPrice || ''}-${availability || ''}-${provider || ''}-${includeStale || ''}-${page || '1'}-${limit || '10'}`;
    
    return this.aggregatorService.getAllProducts({
      name,
      minPrice: minPrice ? parseFloat(minPrice.toString()) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice.toString()) : undefined,
      availability: availability !== undefined ? availability === true : undefined,
      provider,
      includeStale: includeStale === 'true',
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }
} 