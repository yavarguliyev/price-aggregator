import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ProviderOneService } from '../../infrastructure/services/provider-one.service';
import { ProviderTwoService } from '../../infrastructure/services/provider-two.service';
import { ProviderThreeService } from '../../infrastructure/services/provider-three.service';
import { ProviderFourService } from '../../infrastructure/services/provider-four.service';
import { ProductRepository } from '../../infrastructure/persistence/product.repository';
import { ProviderProduct } from '../../domain/entities/product.model';
import { handleError } from '../../core/utils/error-handler.util';

interface ProviderServiceInterface {
  getProducts(): ProviderProduct[];
  constructor: { name: string };
}

@Injectable()
export class ProviderService {
  private readonly fetchInterval: number;
  private intervalId?: NodeJS.Timeout;

  constructor (
    private readonly providerOneService: ProviderOneService,
    private readonly providerTwoService: ProviderTwoService,
    private readonly providerThreeService: ProviderThreeService,
    private readonly providerFourService: ProviderFourService,
    private readonly productRepository: ProductRepository,
    private readonly configService: ConfigService
  ) {
    this.fetchInterval = this.configService.get<number>('FETCH_INTERVAL', 10000);
  }

  startFetchingData () {
    if (this.intervalId) {
      this.stopFetchingData();
    }

    void this.fetchAllProviders();

    this.intervalId = setInterval(() => {
      void this.fetchAllProviders();
    }, this.fetchInterval);
  }

  stopFetchingData () {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      delete this.intervalId;
    }
  }

  async fetchAllProviders (): Promise<void> {
    try {
      await Promise.all([
        this.fetchProviderData(this.providerOneService),
        this.fetchProviderData(this.providerTwoService),
        this.fetchProviderData(this.providerThreeService),
        this.fetchProviderData(this.providerFourService)
      ]);
    } catch (error) {
      handleError(error, 'fetchAllProviders');
    }
  }

  private async fetchProviderData (providerService: ProviderServiceInterface) {
    try {
      const products = providerService.getProducts();
      await this.fetchAndSaveProviderData(providerService.constructor.name, products);
    } catch (error) {
      handleError(error, `fetchProviderData for ${providerService.constructor.name}`);
    }
  }

  private async fetchAndSaveProviderData (provider: string, products: ProviderProduct[]) {
    for (const product of products) {
      await this.productRepository.createOrUpdateProduct(provider, product);
    }
  }

  async getChanges (timeframe?: number) {
    const defaultTimeframe = this.configService.get<number>('DEFAULT_TIMEFRAME', 1440);
    const timeframeMs = (timeframe || defaultTimeframe) * 60 * 1000;
    const timeLimit = new Date(Date.now() - timeframeMs);

    const [priceChanges, availabilityChanges] = await Promise.all([
      this.productRepository.findPriceChanges(timeLimit),
      this.productRepository.findAvailabilityChanges(timeLimit)
    ]);

    const priceChangeResult = priceChanges.map((price) => ({
      id: price.product.id,
      name: price.product.name,
      provider: price.product.provider,
      providerId: price.product.providerId,
      changeType: 'price',
      newValue: price.amount,
      currency: price.currency,
      timestamp: price.createdAt
    }));

    const availabilityChangeResult = availabilityChanges.map((availability) => ({
      id: availability.product.id,
      name: availability.product.name,
      provider: availability.product.provider,
      providerId: availability.product.providerId,
      changeType: 'availability',
      newValue: availability.isAvailable,
      timestamp: availability.createdAt
    }));

    const allChanges = [...priceChangeResult, ...availabilityChangeResult].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    return allChanges;
  }

  getProviderProducts (providerId: string): ProviderProduct[] {
    const providerMap = {
      one: this.providerOneService,
      two: this.providerTwoService,
      three: this.providerThreeService,
      four: this.providerFourService
    };

    const provider = providerMap[providerId as keyof typeof providerMap];

    if (!provider) {
      return [];
    }

    return provider.getProducts();
  }
}
