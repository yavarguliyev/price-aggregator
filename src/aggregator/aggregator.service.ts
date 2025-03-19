import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ProductService } from './services/product.service';
import { ProviderService } from './services/provider.service';

@Injectable()
export class AggregatorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AggregatorService.name);
  private stalenessCheckIntervalId: NodeJS.Timeout | null = null;
  
  constructor(
    private readonly productService: ProductService,
    private readonly providerService: ProviderService,
  ) {}

  async onModuleInit() {
    // Start periodic fetching of provider data
    this.providerService.startFetchingData();
    
    // Start periodic checks for stale products
    this.stalenessCheckIntervalId = setInterval(async () => {
      await this.productService.checkAndMarkStaleProducts();
    }, 60000); // Check every minute
  }

  onModuleDestroy() {
    this.providerService.stopFetchingData();
    
    if (this.stalenessCheckIntervalId) {
      clearInterval(this.stalenessCheckIntervalId);
      this.stalenessCheckIntervalId = null;
    }
  }

  async getStaleProducts() {
    return this.productService.getStaleProducts();
  }

  async getAllProducts(filters?: {
    name?: string;
    minPrice?: number;
    maxPrice?: number;
    availability?: boolean;
    provider?: string;
    includeStale?: boolean;
    page?: number;
    limit?: number;
  }) {
    return this.productService.getAllProducts(filters);
  }

  async getProductById(id: string) {
    return this.productService.getProductById(id);
  }

  async getChanges(timeframe?: number) {
    return this.providerService.getChanges(timeframe);
  }
} 