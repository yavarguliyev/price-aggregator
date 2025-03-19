import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProviderOneService } from '../../infrastructure/services/provider-one.service';
import { ProviderTwoService } from '../../infrastructure/services/provider-two.service';
import { ProviderThreeService } from '../../infrastructure/services/provider-three.service';
import { ProductRepository } from '../../infrastructure/persistence/product.repository';
import { ProviderProduct } from '../../domain/entities/product.model';

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  private readonly fetchInterval: number;
  private intervalId?: NodeJS.Timeout;

  constructor(
    private readonly providerOneService: ProviderOneService,
    private readonly providerTwoService: ProviderTwoService,
    private readonly providerThreeService: ProviderThreeService,
    private readonly productRepository: ProductRepository,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.fetchInterval = this.configService.get<number>('FETCH_INTERVAL', 10000);
    this.logger.log(`Fetch interval set to ${this.fetchInterval}ms`);
  }

  startFetchingData() {
    if (this.intervalId) {
      this.stopFetchingData();
    }

    this.logger.log('Starting periodic data fetching');
    void this.fetchAllProviders();

    this.intervalId = setInterval(() => {
      void this.fetchAllProviders();
    }, this.fetchInterval);
  }

  stopFetchingData() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      delete this.intervalId;
      this.logger.log('Data fetching interval cleared');
    }
  }

  async fetchAllProviders() {
    try {
      const [provider1Products, provider2Products, provider3Products] = await Promise.all([
        this.providerOneService.getProducts(),
        this.providerTwoService.getProducts(),
        this.providerThreeService.getProducts()
      ]);

      await Promise.all([
        this.fetchAndSaveProviderData('provider-one', provider1Products),
        this.fetchAndSaveProviderData('provider-two', provider2Products),
        this.fetchAndSaveProviderData('provider-three', provider3Products)
      ]);

      this.logger.log('Successfully fetched data from all providers');
      this.eventEmitter.emit('providers.fetched', { timestamp: new Date() });
    } catch (error) {
      this.handleError(error, 'fetchAllProviders');
    }
  }

  private async fetchAndSaveProviderData(providerName: string, products: ProviderProduct[]) {
    try {
      this.logger.debug(`Fetched ${products.length} products from ${providerName}`);

      for (const product of products) {
        await this.productRepository.createOrUpdateProduct(providerName, product);
      }

      this.logger.debug(`Saved ${products.length} products from ${providerName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing data from ${providerName}: ${errorMessage}`);
      throw error;
    }
  }

  async getChanges(timeframe?: number) {
    const timeLimit = timeframe ? new Date(Date.now() - timeframe * 60 * 1000) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [priceChanges, availabilityChanges] = await Promise.all([
      this.productRepository.findPriceChanges(timeLimit),
      this.productRepository.findAvailabilityChanges(timeLimit),
    ]);

    const priceChangeResult = priceChanges.map((price) => ({
      id: price.product.id,
      name: price.product.name,
      provider: price.product.providerName,
      providerId: price.product.providerId,
      changeType: 'price',
      newValue: price.value,
      currency: price.currency,
      timestamp: price.createdAt,
    }));

    const availabilityChangeResult = availabilityChanges.map(
      (availability) => ({
        id: availability.product.id,
        name: availability.product.name,
        provider: availability.product.providerName,
        providerId: availability.product.providerId,
        changeType: 'availability',
        newValue: availability.isAvailable,
        timestamp: availability.createdAt,
      }),
    );

    const allChanges = [...priceChangeResult, ...availabilityChangeResult].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return allChanges;
  }

  private handleError(error: unknown, context: string): never {
    if (error instanceof Error) {
      throw new Error(`Error in ${context}: ${error.message}`);
    }

    throw new Error(`Unknown error in ${context}`);
  }
}
