import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ProviderOneService } from "../../infrastructure/services/provider-one.service";
import { ProviderTwoService } from "../../infrastructure/services/provider-two.service";
import { ProviderThreeService } from "../../infrastructure/services/provider-three.service";
import { ProviderFourService } from "../../infrastructure/services/provider-four.service";
import { ProductRepository } from "../../infrastructure/persistence/product.repository";
import { ProviderProduct } from "../../domain/entities/product.model";
import { handleError } from "../../core/utils/error-handler.util";

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  private readonly fetchInterval: number;
  private intervalId?: NodeJS.Timeout;

  constructor(
    private readonly providerOneService: ProviderOneService,
    private readonly providerTwoService: ProviderTwoService,
    private readonly providerThreeService: ProviderThreeService,
    private readonly providerFourService: ProviderFourService,
    private readonly productRepository: ProductRepository,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.fetchInterval = this.configService.get<number>(
      "FETCH_INTERVAL",
      10000,
    );
    this.logger.log(`Fetch interval set to ${this.fetchInterval}ms`);
  }

  startFetchingData() {
    if (this.intervalId) {
      this.stopFetchingData();
    }

    this.logger.log("Starting periodic data fetching");
    void this.fetchAllProviders();

    this.intervalId = setInterval(() => {
      void this.fetchAllProviders();
    }, this.fetchInterval);
  }

  stopFetchingData() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      delete this.intervalId;
      this.logger.log("Data fetching interval cleared");
    }
  }

  async fetchAllProviders(): Promise<void> {
    try {
      await Promise.all([
        this.fetchProviderData(this.providerOneService),
        this.fetchProviderData(this.providerTwoService),
        this.fetchProviderData(this.providerThreeService),
        this.fetchProviderData(this.providerFourService),
      ]);
    } catch (error) {
      handleError(error, "fetchAllProviders");
    }
  }

  private async fetchProviderData(providerService: any) {
    try {
      const products = await providerService.getProducts();
      await this.fetchAndSaveProviderData(
        providerService.constructor.name,
        products,
      );
    } catch (error) {
      handleError(
        error,
        `fetchProviderData for ${providerService.constructor.name}`,
      );
    }
  }

  private async fetchAndSaveProviderData(
    provider: string,
    products: ProviderProduct[],
  ) {
    try {
      this.logger.debug(
        `Fetched ${products.length} products from ${provider}`,
      );

      for (const product of products) {
        await this.productRepository.createOrUpdateProduct(
          provider,
          product,
        );
      }

      this.logger.debug(
        `Saved ${products.length} products from ${provider}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Error processing data from ${provider}: ${errorMessage}`,
      );
      throw error;
    }
  }

  async getChanges(timeframe?: number) {
    const timeLimit = timeframe
      ? new Date(Date.now() - timeframe * 60 * 1000)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [priceChanges, availabilityChanges] = await Promise.all([
      this.productRepository.findPriceChanges(timeLimit),
      this.productRepository.findAvailabilityChanges(timeLimit),
    ]);

    const priceChangeResult = priceChanges.map((price) => ({
      id: price.product.id,
      name: price.product.name,
      provider: price.product.provider,
      providerId: price.product.providerId,
      changeType: "price",
      newValue: price.amount,
      currency: price.currency,
      timestamp: price.createdAt,
    }));

    const availabilityChangeResult = availabilityChanges.map(
      (availability) => ({
        id: availability.product.id,
        name: availability.product.name,
        provider: availability.product.provider,
        providerId: availability.product.providerId,
        changeType: "availability",
        newValue: availability.isAvailable,
        timestamp: availability.createdAt,
      }),
    );

    const allChanges = [...priceChangeResult, ...availabilityChangeResult].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    return allChanges;
  }
}
