import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AggregatorService } from '../../src/application/services/aggregator.service';
import { ProductService } from '../../src/application/services/product.service';
import { ProviderService } from '../../src/application/services/provider.service';
import { PrismaService } from '../../src/infrastructure/persistence/prisma/prisma.service';

describe('AggregatorService', () => {
  let service: AggregatorService;
  let productServiceMock: Partial<ProductService>;
  let providerServiceMock: Partial<ProviderService>;
  let prismaServiceMock: Partial<PrismaService>;
  let configServiceMock: Partial<ConfigService>;

  beforeEach(async () => {
    productServiceMock = {
      getAllProducts: jest.fn(),
      getProductById: jest.fn(),
      getStaleProducts: jest.fn(),
      checkAndMarkStaleProducts: jest.fn()
    };

    providerServiceMock = {
      startFetchingData: jest.fn(),
      stopFetchingData: jest.fn(),
      fetchAllProviders: jest.fn(),
      getChanges: jest.fn()
    };

    prismaServiceMock = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        createManyAndReturn: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
        updateManyAndReturn: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
        fields: {
          id: {} as any,
          name: {} as any,
          description: {} as any,
          price: {} as any,
          currency: {} as any,
          provider: {} as any,
          providerId: {} as any,
          isAvailable: {} as any,
          isStale: {} as any,
          lastFetchedAt: {} as any,
          updatedAt: {} as any,
          createdAt: {} as any
        }
      }
    };

    configServiceMock = {
      get: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregatorService,
        {
          provide: ProductService,
          useValue: productServiceMock
        },
        {
          provide: ProviderService,
          useValue: providerServiceMock
        },
        {
          provide: PrismaService,
          useValue: prismaServiceMock
        },
        {
          provide: ConfigService,
          useValue: configServiceMock
        },
        Logger
      ]
    }).compile();

    service = module.get<AggregatorService>(AggregatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllProducts', () => {
    it('should delegate to ProductService', async () => {
      const expectedResult = {
        data: [
          {
            id: '1',
            name: 'Product 1',
            description: 'Description 1',
            provider: 'provider-one',
            providerId: 'prod-1',
            price: 19.99,
            currency: 'USD',
            isAvailable: true,
            isStale: false,
            lastFetchedAt: new Date(),
            updatedAt: new Date()
          }
        ],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1
        }
      };

      (productServiceMock.getAllProducts as jest.Mock).mockResolvedValue(expectedResult);

      const filters = { name: 'test', page: 1, limit: 10 };
      const result = await service.getAllProducts(filters);

      expect(productServiceMock.getAllProducts).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getProductById', () => {
    it('should delegate to ProductService', async () => {
      const productId = '123';
      const expectedProduct = {
        id: productId,
        name: 'Test Product',
        description: 'A test product',
        provider: 'provider-one',
        providerId: 'test-1',
        price: 29.99,
        currency: 'USD',
        isAvailable: true,
        isStale: false,
        lastFetchedAt: new Date(),
        updatedAt: new Date()
      };

      (productServiceMock.getProductById as jest.Mock).mockResolvedValue(expectedProduct);

      const result = await service.getProductById(productId);

      expect(productServiceMock.getProductById).toHaveBeenCalledWith(productId);
      expect(result).toEqual({
        data: expectedProduct,
        priceHistory: [],
        availabilityHistory: []
      });
    });

    it('should handle errors from ProductService', async () => {
      const productId = '123';

      const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

      (productServiceMock.getProductById as jest.Mock).mockRejectedValue(new Error('Product not found'));

      const result = await service.getProductById(productId);

      expect(productServiceMock.getProductById).toHaveBeenCalledWith(productId);
      expect(result).toEqual({
        data: null,
        priceHistory: [],
        availabilityHistory: []
      });

      loggerSpy.mockRestore();
    });
  });

  describe('getChanges', () => {
    it('should delegate to ProviderService', async () => {
      const timeframe = 60;
      const expectedChanges = [
        {
          id: '1',
          name: 'Product 1',
          price: 19.99,
          currency: 'USD',
          isAvailable: true,
          provider: 'provider-one',
          changedAt: new Date()
        }
      ];

      (providerServiceMock.getChanges as jest.Mock).mockResolvedValue(expectedChanges);

      const result = await service.getChanges(timeframe);

      expect(providerServiceMock.getChanges).toHaveBeenCalledWith(timeframe);
      expect(result).toEqual({ data: expectedChanges });
    });
  });

  describe('getStaleProducts', () => {
    it('should delegate to ProductService', async () => {
      const expectedStaleProducts = [
        {
          id: '1',
          name: 'Stale Product',
          description: 'A stale product',
          provider: 'provider-one',
          providerId: 'stale-1',
          price: 39.99,
          currency: 'USD',
          isAvailable: true,
          isStale: true,
          lastFetchedAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000)
        }
      ];

      (productServiceMock.getStaleProducts as jest.Mock).mockResolvedValue(expectedStaleProducts);

      const result = await service.getStaleProducts();

      expect(productServiceMock.getStaleProducts).toHaveBeenCalled();
      expect(result).toEqual({ data: expectedStaleProducts });
    });
  });

  describe('lifecycle hooks', () => {
    it('should start fetching data on module init', () => {
      service.onModuleInit();
      expect(providerServiceMock.startFetchingData).toHaveBeenCalled();
    });

    it('should clean up on module destroy', () => {
      service.onModuleDestroy();
      expect(providerServiceMock.stopFetchingData).toHaveBeenCalled();
    });
  });
});
