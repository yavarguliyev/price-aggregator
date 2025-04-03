import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { ApiQuery, ApiParam, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

import { AggregatorService } from '../application/services/aggregator.service';
import { ProductChangesDto } from '../domain/dto/product-changes.dto';

@Controller('products')
@ApiTags('Products')
export class AggregatorController {
  constructor (private readonly aggregatorService: AggregatorService) {}

  @ApiOperation({ summary: 'Get products with price or availability changes' })
  @ApiQuery({
    name: 'timeframe',
    required: false,
    description: 'Time frame in minutes to check for changes'
  })
  @Get('changes')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('products-changes')
  @CacheTTL(30)
  async getChanges (@Query('timeframe') timeframe?: number): Promise<ProductChangesDto[]> {
    return this.aggregatorService.getProductChanges(timeframe ? timeframe * 60 * 1000 : 3600000);
  }

  @ApiOperation({ summary: 'Get stale products' })
  @ApiResponse({
    status: 200,
    description:
      'Returns a list of products that have not been updated recently or are no longer provided by their source'
  })
  @Get('stale')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('products-stale')
  @CacheTTL(60)
  async getStaleProducts (): Promise<{ data: any[] }> {
    return this.aggregatorService.getStaleProducts();
  }

  @ApiOperation({ summary: 'Get detailed product information by ID with price history' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns detailed product information including price and availability history',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            currency: { type: 'string' },
            isAvailable: { type: 'boolean' },
            provider: { type: 'string' },
            providerId: { type: 'string' },
            lastFetchedAt: { type: 'string', format: 'date-time' },
            isStale: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        priceHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              amount: { type: 'number' },
              currency: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        },
        availabilityHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              isAvailable: { type: 'boolean' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  })
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  async getProductById (@Param('id') id: string): Promise<{ data: any }> {
    return this.aggregatorService.getProductById(id);
  }

  @ApiOperation({ summary: 'Get a list of products with filters' })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by product name (case insensitive)'
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Filter by minimum price'
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Filter by maximum price'
  })
  @ApiQuery({
    name: 'availability',
    required: false,
    description: 'Filter by availability status'
  })
  @ApiQuery({
    name: 'provider',
    required: false,
    description: 'Filter by provider name'
  })
  @ApiQuery({
    name: 'includeStale',
    required: false,
    description: 'Include stale products in results'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10)'
  })
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30)
  async getAllProducts (
    @Query('name') name?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('availability') availability?: boolean,
    @Query('provider') provider?: string,
    @Query('includeStale') includeStale?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    return this.aggregatorService.getAllProducts({
      name,
      minPrice: minPrice ? parseFloat(minPrice.toString()) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice.toString()) : undefined,
      availability: availability !== undefined ? availability === true : undefined,
      provider,
      includeStale: includeStale === 'true',
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10
    });
  }
}
