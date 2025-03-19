import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductService } from '../../aggregator/services/product.service';
import { ProductRepository } from '../../aggregator/repositories/product.repository';
import { Logger } from '@nestjs/common';
import { Availability, Price, Product } from '@prisma/client';

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: ProductRepository;
  let configService: ConfigService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    // Mock repository methods
    const mockProductRepository = {
      findStaleProducts: jest.fn(),
      markStaleProducts: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    };

    // Mock config service
    const mockConfigService = {
      get: jest.fn().mockImplementation((key, defaultValue) => {
        if (key === 'STALENESS_THRESHOLD') return 60000; // 1 minute
        return defaultValue;
      }),
    };

    // Mock event emitter
    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: ProductRepository,
          useValue: mockProductRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    // Override Logger to avoid console output during tests
    jest.spyOn(Logger, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger, 'error').mockImplementation(() => {});
    jest.spyOn(Logger, 'log').mockImplementation(() => {});
    jest.spyOn(Logger, 'debug').mockImplementation(() => {});

    service = module.get<ProductService>(ProductService);
    productRepository = module.get<ProductRepository>(ProductRepository);
    configService = module.get<ConfigService>(ConfigService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStaleProducts', () => {
    it('should return stale products from the repository', async () => {
      // Type the mock products correctly
      const mockStaleProducts = [
        {
          id: '1',
          name: 'Stale Product',
          description: 'This product is stale',
          providerName: 'provider-one',
          providerId: 'stale-1',
          isStale: true,
          lastFetchedAt: new Date(Date.now() - 120000), // 2 minutes ago
          updatedAt: new Date(Date.now() - 120000),
          createdAt: new Date(Date.now() - 120000),
          prices: [
            {
              id: 'price-1',
              value: 100,
              currency: 'USD',
              createdAt: new Date(),
              productId: '1',
            }
          ],
          availability: [
            {
              id: 'avail-1',
              isAvailable: true,
              createdAt: new Date(),
              productId: '1',
            }
          ],
        } as Product & { 
          prices: Price[]; 
          availability: Availability[]; 
        },
      ];

      jest.spyOn(productRepository, 'findStaleProducts').mockResolvedValue(mockStaleProducts);

      const result = await service.getStaleProducts();

      expect(productRepository.findStaleProducts).toHaveBeenCalledWith(60000);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].name).toBe('Stale Product');
      expect(result[0].isStale).toBe(true);
      expect(result[0].staleReason).toContain('Product data is stale');
    });
  });

  describe('checkAndMarkStaleProducts', () => {
    it('should mark products as stale and emit an event', async () => {
      const mockStaleResult = { count: 2 };
      jest.spyOn(productRepository, 'markStaleProducts').mockResolvedValue(mockStaleResult);

      await service.checkAndMarkStaleProducts();

      expect(productRepository.markStaleProducts).toHaveBeenCalledWith(60000);
      expect(eventEmitter.emit).toHaveBeenCalledWith('products.stale', expect.any(Object));
    });

    it('should not emit an event if no products were marked stale', async () => {
      const mockStaleResult = { count: 0 };
      jest.spyOn(productRepository, 'markStaleProducts').mockResolvedValue(mockStaleResult);

      await service.checkAndMarkStaleProducts();

      expect(productRepository.markStaleProducts).toHaveBeenCalledWith(60000);
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('getAllProducts', () => {
    it('should fetch products with default parameters when no filters are provided', async () => {
      jest.spyOn(productRepository, 'count').mockResolvedValue(10);
      jest.spyOn(productRepository, 'findMany').mockResolvedValue([]);

      await service.getAllProducts();

      expect(productRepository.count).toHaveBeenCalled();
      expect(productRepository.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { isStale: false },
        orderBy: { updatedAt: 'desc' }
      });
    });

    it('should apply filters correctly', async () => {
      jest.spyOn(productRepository, 'count').mockResolvedValue(5);
      jest.spyOn(productRepository, 'findMany').mockResolvedValue([]);

      const filters = {
        name: 'test',
        provider: 'provider-one',
        includeStale: true,
        page: 2,
        limit: 5
      };

      await service.getAllProducts(filters);

      expect(productRepository.count).toHaveBeenCalledWith({
        name: { contains: 'test', mode: 'insensitive' },
        providerName: 'provider-one'
      });

      expect(productRepository.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        where: {
          name: { contains: 'test', mode: 'insensitive' },
          providerName: 'provider-one'
        },
        orderBy: { updatedAt: 'desc' }
      });
    });
  });

  describe('getProductById', () => {
    it('should return a product by ID with price history', async () => {
      const mockProduct = {
        id: '123',
        name: 'Test Product',
        description: 'Test Description',
        providerName: 'provider-one',
        providerId: 'test-123',
        isStale: false,
        lastFetchedAt: new Date(),
        updatedAt: new Date(),
        createdAt: new Date(),
        prices: [
          { 
            id: 'price-1', 
            value: 100, 
            currency: 'USD', 
            createdAt: new Date(),
            productId: '123' 
          },
          { 
            id: 'price-2', 
            value: 90, 
            currency: 'USD', 
            createdAt: new Date(Date.now() - 86400000),
            productId: '123' 
          },
        ],
        availability: [
          { 
            id: 'avail-1', 
            isAvailable: true, 
            createdAt: new Date(),
            productId: '123' 
          }
        ],
      } as Product & { 
        prices: Price[]; 
        availability: Availability[]; 
      };

      jest.spyOn(productRepository, 'findUnique').mockResolvedValue(mockProduct);

      const result = await service.getProductById('123');

      expect(productRepository.findUnique).toHaveBeenCalledWith('123');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe('123');
        expect(result.priceHistory).toBeDefined();
        expect(result.priceHistory.length).toBe(2);
      }
    });

    it('should return null if product is not found', async () => {
      jest.spyOn(productRepository, 'findUnique').mockResolvedValue(null);

      const result = await service.getProductById('non-existent');

      expect(productRepository.findUnique).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });
  });
}); 