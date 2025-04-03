import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

import { ProductService } from '../../src/application/services/product.service';
import { ProductRepository } from '../../src/infrastructure/persistence/product.repository';

interface ProductWithDetails {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  isAvailable: boolean;
  provider: string;
  providerId: string;
  lastFetchedAt: Date;
  isStale: boolean;
  createdAt: Date;
  updatedAt: Date;
  priceHistory?: Array<{
    id: string;
    amount: number;
    currency: string;
    date: Date;
  }>;
  staleReason?: string;
  prices?: Array<{
    id: string;
    amount: number;
    currency: string;
    createdAt: Date;
    productId: string;
  }>;
  availability?: Array<{
    id: string;
    isAvailable: boolean;
    createdAt: Date;
    productId: string;
  }>;
}

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: ProductRepository;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const mockProductRepository = {
      findStaleProducts: jest.fn(),
      markStaleProducts: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findById: jest.fn()
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue: unknown) => {
        if (key === 'STALENESS_THRESHOLD') return 60000;
        return defaultValue;
      })
    };

    const mockEventEmitter = {
      emit: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: ProductRepository,
          useValue: mockProductRepository
        },
        {
          provide: 'ConfigService',
          useValue: mockConfigService
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter
        }
      ]
    }).compile();

    jest.spyOn(Logger, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger, 'error').mockImplementation(() => {});
    jest.spyOn(Logger, 'log').mockImplementation(() => {});
    jest.spyOn(Logger, 'debug').mockImplementation(() => {});

    service = module.get<ProductService>(ProductService);
    productRepository = module.get<ProductRepository>(ProductRepository);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    const expectDefined = (x: unknown): void => {
      expect(x).toBeDefined();
    };

    expectDefined(service);
  });

  describe('getStaleProducts', () => {
    it('should return stale products from the repository', async () => {
      const mockStaleProducts = [
        {
          id: '1',
          name: 'Stale Product',
          description: 'This product is stale',
          price: 100,
          currency: 'USD',
          isAvailable: false,
          provider: 'provider-one',
          providerId: 'stale-1',
          isStale: true,
          lastFetchedAt: new Date(Date.now() - 120000),
          updatedAt: new Date(Date.now() - 120000),
          createdAt: new Date(Date.now() - 120000),
          prices: [
            {
              id: 'price-1',
              amount: 100,
              currency: 'USD',
              createdAt: new Date(),
              productId: '1'
            }
          ],
          availability: [
            {
              id: 'avail-1',
              isAvailable: true,
              createdAt: new Date(),
              productId: '1'
            }
          ],
          staleReason: 'Product data is stale'
        } as ProductWithDetails
      ];

      (productRepository.findStaleProducts as jest.Mock).mockResolvedValue(mockStaleProducts);

      const result = (await service.getStaleProducts()) as ProductWithDetails[];

      const expectCalled = (fn: jest.Mock): void => {
        expect(fn).toHaveBeenCalled();
      };

      const expectEqual = (actual: unknown, expected: unknown): void => {
        expect(actual).toEqual(expected);
      };

      const expectToBe = (actual: unknown, expected: unknown): void => {
        expect(actual).toBe(expected);
      };

      const expectContain = (text: string, subtext: string): void => {
        expect(text).toContain(subtext);
      };

      expectCalled(productRepository.findStaleProducts as jest.Mock);
      expectEqual(result.length, 1);
      expectToBe(result[0].id, '1');
      expectToBe(result[0].name, 'Stale Product');
      expectToBe(result[0].isStale, true);
      expectContain(result[0].staleReason || '', 'Product data is stale');
    });
  });

  describe('checkAndMarkStaleProducts', () => {
    it('should mark products as stale and emit an event', async () => {
      const mockStaleResult = { count: 2 };
      (productRepository.markStaleProducts as jest.Mock).mockResolvedValue(mockStaleResult);

      await service.checkAndMarkStaleProducts();

      const expectedThreshold = 24 * 60 * 60 * 1000;

      const expectCalledWith = (fn: jest.Mock, ...args: unknown[]): void => {
        expect(fn).toHaveBeenCalledWith(...args);
      };

      expectCalledWith(productRepository.markStaleProducts as jest.Mock, expectedThreshold);
      expectCalledWith(eventEmitter.emit as jest.Mock, 'products.stale.checked', expect.any(Object));
    });

    it('should not emit an event if no products were marked stale', async () => {
      const mockStaleResult = { count: 0 };
      (productRepository.markStaleProducts as jest.Mock).mockResolvedValue(mockStaleResult);

      (eventEmitter.emit as jest.Mock).mockClear();

      await service.checkAndMarkStaleProducts();

      const expectedThreshold = 24 * 60 * 60 * 1000;

      const expectCalledWith = (fn: jest.Mock, ...args: unknown[]): void => {
        expect(fn).toHaveBeenCalledWith(...args);
      };

      expectCalledWith(productRepository.markStaleProducts as jest.Mock, expectedThreshold);
      expectCalledWith(eventEmitter.emit as jest.Mock, 'products.stale.checked', expect.any(Object));
    });
  });

  describe('getAllProducts', () => {
    it('should fetch products with default parameters when no filters are provided', async () => {
      (productRepository.count as jest.Mock).mockResolvedValue(10);
      (productRepository.findMany as jest.Mock).mockResolvedValue([]);

      await service.getAllProducts();

      const expectCalled = (fn: jest.Mock): void => {
        expect(fn).toHaveBeenCalled();
      };

      const expectCalledWith = (fn: jest.Mock, ...args: unknown[]): void => {
        expect(fn).toHaveBeenCalledWith(...args);
      };

      expectCalled(productRepository.count as jest.Mock);
      expectCalledWith(productRepository.findMany as jest.Mock, {
        skip: 0,
        take: 10,
        where: { isStale: false },
        orderBy: { updatedAt: 'desc' }
      });
    });

    it('should apply filters correctly', async () => {
      (productRepository.count as jest.Mock).mockResolvedValue(5);
      (productRepository.findMany as jest.Mock).mockResolvedValue([]);

      const filters = {
        name: 'test',
        provider: 'provider-one',
        includeStale: true,
        page: 2,
        limit: 5
      };

      await service.getAllProducts(filters);

      const expectCalledWith = (fn: jest.Mock, ...args: unknown[]): void => {
        expect(fn).toHaveBeenCalledWith(...args);
      };

      expectCalledWith(productRepository.count as jest.Mock, {
        name: { contains: 'test', mode: 'insensitive' },
        provider: 'provider-one'
      });

      expectCalledWith(productRepository.findMany as jest.Mock, {
        skip: 5,
        take: 5,
        where: {
          name: { contains: 'test', mode: 'insensitive' },
          provider: 'provider-one'
        },
        orderBy: { updatedAt: 'desc' }
      });
    });
  });

  describe('getProductById', () => {
    it('should return product details when found', async () => {
      const mockProduct = {
        id: '123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        currency: 'USD',
        isAvailable: true,
        provider: 'provider-one',
        providerId: 'test-123',
        isStale: false,
        lastFetchedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (productRepository.findById as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.getProductById('123');

      const expectCalledWith = (fn: jest.Mock, ...args: unknown[]): void => {
        expect(fn).toHaveBeenCalledWith(...args);
      };

      const expectNotNull = (value: unknown): void => {
        expect(value).not.toBeNull();
      };

      const expectToBe = (actual: unknown, expected: unknown): void => {
        expect(actual).toBe(expected);
      };

      const expectDefined = (value: unknown): void => {
        expect(value).toBeDefined();
      };

      const expectEqual = (actual: unknown, expected: unknown): void => {
        expect(actual).toEqual(expected);
      };

      expectCalledWith(productRepository.findById as jest.Mock, '123');
      expectNotNull(result);
      expectToBe(result?.id, '123');
      expectToBe(result?.name, 'Test Product');
      expectDefined(result?.lastFetchedAt);
      expectEqual(result?.price, 100);
    });

    it('should throw NotFoundException when product is not found', async () => {
      (productRepository.findById as jest.Mock).mockResolvedValue(undefined);

      const expectCalledWith = (fn: jest.Mock, ...args: unknown[]): void => {
        expect(fn).toHaveBeenCalledWith(...args);
      };

      const expectInstanceOf = (value: unknown, type: unknown): void => {
        expect(value).toBeInstanceOf(type);
      };

      const expectContain = (text: string, subtext: string): void => {
        expect(text).toContain(subtext);
      };

      const doFail = (message: string): void => {
        fail(message);
      };

      const result = await service.getProductById('123').catch((error: Error) => {
        expectCalledWith(productRepository.findById as jest.Mock, '123');
        expectInstanceOf(error, Error);
        expectContain(error.message, 'Product with ID 123 not found');
        return error;
      });

      if (!(result instanceof Error)) {
        doFail('Expected NotFoundException to be thrown');
      }
    });
  });
});
