import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ProductService } from "./product.service";
import { ProviderService } from "./provider.service";

@Injectable()
export class AggregatorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AggregatorService.name);
  private stalenessCheckIntervalId: NodeJS.Timeout | null = null;

  constructor(
    private readonly productService: ProductService,
    private readonly providerService: ProviderService,
  ) {}

  onModuleInit() {
    this.providerService.startFetchingData();

    this.stalenessCheckIntervalId = setInterval(() => {
      void this.productService.checkAndMarkStaleProducts();
    }, 60000);
  }

  onModuleDestroy() {
    this.providerService.stopFetchingData();

    if (this.stalenessCheckIntervalId) {
      clearInterval(this.stalenessCheckIntervalId);
      this.stalenessCheckIntervalId = null;
    }
  }

  async getStaleProducts() {
    try {
      const products = await this.productService.getStaleProducts();
      return { data: products };
    } catch (error) {
      this.logger.error(
        `Error getting stale products: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { data: [] };
    }
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
    try {
      return await this.productService.getAllProducts(filters);
    } catch (error) {
      this.logger.error(
        `Error getting all products: ${error instanceof Error ? error.message : String(error)}`,
      );

      return {
        data: [],
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 10,
      };
    }
  }

  async getProductById(id: string) {
    try {
      const product = await this.productService.getProductById(id);
      return { data: product };
    } catch (error) {
      this.logger.error(
        `Error getting product by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );

      return { data: null };
    }
  }

  async getChanges(timeframe?: number) {
    try {
      const changes = await this.providerService.getChanges(timeframe);
      return { data: changes };
    } catch (error) {
      this.logger.error(
        `Error getting changes: ${error instanceof Error ? error.message : String(error)}`,
      );

      return { data: [] };
    }
  }
}
