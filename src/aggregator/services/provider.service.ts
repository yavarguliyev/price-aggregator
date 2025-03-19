import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProviderOneService } from '../../provider-simulator/providers/provider-one.service';
import { ProviderTwoService } from '../../provider-simulator/providers/provider-two.service';
import { ProviderThreeService } from '../../provider-simulator/providers/provider-three.service';
import { ProductRepository } from '../repositories/product.repository';
import { ProviderProduct } from '../../provider-simulator/models/product.model';

@Injectable()
export class ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  private readonly fetchInterval: number;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private readonly providerOneService: ProviderOneService,
    private readonly providerTwoService: ProviderTwoService,
    private readonly providerThreeService: ProviderThreeService,
    private readonly productRepository: ProductRepository,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.fetchInterval = this.configService.get<number>('FETCH_INTERVAL', 10000);
    this.logger.log(`Fetch interval set to ${this.fetchInterval}ms`);
  }

  startFetchingData() {
    if (this.intervalId) {
      this.stopFetchingData();
    }

    this.logger.log('Starting periodic data fetching');
    this.fetchAllProviders(); // Initial fetch

    this.intervalId = setInterval(async () => {
      await this.fetchAllProviders();
    }, this.fetchInterval);
  }

  stopFetchingData() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.log('Data fetching interval cleared');
    }
  }

  async fetchAllProviders() {
    try {
      const [provider1Products, provider2Products, provider3Products] = await Promise.all([
        this.providerOneService.getProducts(),
        this.providerTwoService.getProducts(),
        this.providerThreeService.getProducts(),
      ]);

      await Promise.all([
        this.fetchAndSaveProviderData('provider-one', provider1Products),
        this.fetchAndSaveProviderData('provider-two', provider2Products),
        this.fetchAndSaveProviderData('provider-three', provider3Products),
      ]);

      this.logger.log('Successfully fetched data from all providers');
      this.eventEmitter.emit('providers.fetched', { timestamp: new Date() });
    } catch (error) {
      this.logger.error(`Error fetching provider data: ${error.message}`);
      this.eventEmitter.emit('providers.error', { error: error.message, timestamp: new Date() });
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
      this.logger.error(`Error processing data from ${providerName}: ${error.message}`);
      throw error;
    }
  }

  async getChanges(timeframe?: number) {
    const timeLimit = timeframe 
      ? new Date(Date.now() - timeframe * 60 * 1000) 
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [priceChanges, availabilityChanges] = await Promise.all([
      this.productRepository.findPriceChanges(timeLimit),
      this.productRepository.findAvailabilityChanges(timeLimit)
    ]);

    // Process price changes
    const priceChangeResult = priceChanges.map(price => ({
      id: price.product.id,
      name: price.product.name,
      provider: price.product.providerName,
      providerId: price.product.providerId,
      changeType: 'price',
      newValue: price.value,
      currency: price.currency,
      timestamp: price.createdAt
    }));

    // Process availability changes
    const availabilityChangeResult = availabilityChanges.map(availability => ({
      id: availability.product.id,
      name: availability.product.name,
      provider: availability.product.providerName,
      providerId: availability.product.providerId,
      changeType: 'availability',
      newValue: availability.isAvailable,
      timestamp: availability.createdAt
    }));

    // Combine both types of changes and sort by timestamp (newest first)
    const allChanges = [...priceChangeResult, ...availabilityChangeResult]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return allChanges;
  }
} 