import { Test, TestingModule } from '@nestjs/testing';
import { AggregatorService } from '../../aggregator/aggregator.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProviderOneService } from '../../provider-simulator/providers/provider-one.service';
import { ProviderTwoService } from '../../provider-simulator/providers/provider-two.service';
import { ProviderThreeService } from '../../provider-simulator/providers/provider-three.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProviderProduct } from '../../provider-simulator/models/product.model';
import { Logger } from '@nestjs/common';

// Mock data
const mockProducts: ProviderProduct[] = [
  {
    id: 'product-1',
    name: 'Test Product 1',
    description: 'Test Description 1',
    price: 100,
    currency: 'USD',
    availability: true,
    lastUpdated: new Date(),
  },
  {
    id: 'product-2',
    name: 'Test Product 2',
    description: 'Test Description 2',
    price: 200,
    currency: 'USD',
    availability: false,
    lastUpdated: new Date(),
  },
];

const mockExistingProducts = [
  {
    id: '1',
    name: 'Test Product 1',
    description: 'Test Description 1',
    providerId: 'product-1',
    providerName: 'provider-one',
    createdAt: new Date(),
    updatedAt: new Date(),
    prices: [
      {
        id: '1',
        value: 100,
        currency: 'USD',
        productId: '1',
        createdAt: new Date(),
      },
    ],
    availability: [
      {
        id: '1',
        isAvailable: true,
        productId: '1',
        createdAt: new Date(),
      },
    ],
  },
  {
    id: '2',
    name: 'Test Product 2',
    description: 'Test Description 2',
    providerId: 'product-2',
    providerName: 'provider-two',
    createdAt: new Date(),
    updatedAt: new Date(),
    prices: [
      {
        id: '2',
        value: 200,
        currency: 'USD',
        productId: '2',
        createdAt: new Date(),
      },
    ],
    availability: [
      {
        id: '2',
        isAvailable: false,
        productId: '2',
        createdAt: new Date(),
      },
    ],
  },
];

// Mock the PrismaService
const mockPrismaService = {
  product: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  price: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  availability: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

// Mock the provider services
const mockProviderOneService = {
  getProducts: jest.fn(),
};

const mockProviderTwoService = {
  getProducts: jest.fn(),
};

const mockProviderThreeService = {
  getProducts: jest.fn(),
};

// Mock config service
const mockConfigService = {
  get: jest.fn().mockImplementation((key) => {
    if (key === 'FETCH_INTERVAL') return 10000;
    if (key === 'STALENESS_THRESHOLD') return 60000;
    return null;
  }),
};

// Mock event emitter
const mockEventEmitter = {
  emit: jest.fn(),
};

describe('AggregatorService', () => {
  let service: AggregatorService;
  let prismaService: PrismaService;
  let providerOneService: ProviderOneService;
  let providerTwoService: ProviderTwoService;
  let providerThreeService: ProviderThreeService;
  let configService: ConfigService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock implementation for PrismaService
    mockPrismaService.product.findFirst.mockImplementation(({ where }) => {
      const product = mockExistingProducts.find(
        p => p.providerId === where.providerId && p.providerName === where.providerName,
      );
      return Promise.resolve(product || null);
    });

    mockPrismaService.product.create.mockImplementation(({ data }) => {
      const newProduct = {
        id: `new-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return Promise.resolve(newProduct);
    });

    mockPrismaService.product.update.mockImplementation(({ where, data }) => {
      const product = mockExistingProducts.find(p => p.id === where.id);
      if (!product) return Promise.resolve(null);
      return Promise.resolve({
        ...product,
        ...data,
        updatedAt: new Date(),
      });
    });

    mockPrismaService.product.findMany.mockImplementation(() => {
      return Promise.resolve(mockExistingProducts);
    });

    mockPrismaService.product.findUnique.mockImplementation(({ where }) => {
      const product = mockExistingProducts.find(p => p.id === where.id);
      return Promise.resolve(product);
    });

    mockPrismaService.price.findFirst.mockImplementation(() => {
      return Promise.resolve(null);
    });

    mockPrismaService.availability.findFirst.mockImplementation(() => {
      return Promise.resolve(null);
    });

    mockPrismaService.price.create.mockImplementation(({ data }) => {
      return Promise.resolve({
        id: `price-${Date.now()}`,
        ...data,
        createdAt: new Date(),
      });
    });

    mockPrismaService.availability.create.mockImplementation(({ data }) => {
      return Promise.resolve({
        id: `availability-${Date.now()}`,
        ...data,
        createdAt: new Date(),
      });
    });

    mockPrismaService.price.findMany.mockImplementation(() => {
      return Promise.resolve([]);
    });

    mockPrismaService.availability.findMany.mockImplementation(() => {
      return Promise.resolve([]);
    });

    // Mock implementation for provider services
    mockProviderOneService.getProducts.mockImplementation(() => {
      return mockProducts;
    });

    mockProviderTwoService.getProducts.mockImplementation(() => {
      return mockProducts.map(p => ({ ...p, id: `two-${p.id}` }));
    });

    mockProviderThreeService.getProducts.mockImplementation(() => {
      return mockProducts.map(p => ({ ...p, id: `three-${p.id}` }));
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregatorService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ProviderOneService, useValue: mockProviderOneService },
        { provide: ProviderTwoService, useValue: mockProviderTwoService },
        { provide: ProviderThreeService, useValue: mockProviderThreeService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<AggregatorService>(AggregatorService);
    prismaService = module.get<PrismaService>(PrismaService);
    providerOneService = module.get<ProviderOneService>(ProviderOneService);
    providerTwoService = module.get<ProviderTwoService>(ProviderTwoService);
    providerThreeService = module.get<ProviderThreeService>(ProviderThreeService);
    configService = module.get<ConfigService>(ConfigService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Disable the interval in onModuleInit
    jest.spyOn(global, 'setInterval').mockImplementation(() => {
      return { unref: jest.fn() } as unknown as NodeJS.Timeout;
    });
    
    // Mock clearInterval to ensure it doesn't throw errors
    jest.spyOn(global, 'clearInterval').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should fetch all providers on init', async () => {
      const fetchAllProvidersSpy = jest.spyOn(service, 'fetchAllProviders');
      
      await service.onModuleInit();
      
      expect(fetchAllProvidersSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchAllProviders', () => {
    it('should fetch data from all providers concurrently', async () => {
      const fetchSpy = jest.spyOn(service as any, 'fetchAndSaveProviderData').mockResolvedValue(undefined);
      
      await service.fetchAllProviders();
      
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(fetchSpy).toHaveBeenCalledWith('provider-one', mockProducts);
      expect(fetchSpy).toHaveBeenCalledWith('provider-two', expect.any(Array));
      expect(fetchSpy).toHaveBeenCalledWith('provider-three', expect.any(Array));
    });

    it('should log error when fetching fails', async () => {
      const error = new Error('Test error');
      jest.spyOn(service as any, 'fetchAndSaveProviderData').mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      
      await service.fetchAllProviders();
      
      expect(loggerSpy).toHaveBeenCalledWith(`Error fetching provider data: ${error.message}`);
    });
  });

  describe('getAllProducts', () => {
    it('should return all products with their latest price and availability', async () => {
      const result = await service.getAllProducts();
      
      expect(result.data).toHaveLength(mockExistingProducts.length);
      expect(result.data[0]).toHaveProperty('id', mockExistingProducts[0].id);
      expect(result.data[0]).toHaveProperty('price', mockExistingProducts[0].prices[0].value);
      expect(result.data[0]).toHaveProperty('isAvailable', mockExistingProducts[0].availability[0].isAvailable);
    });

    it('should filter products by name', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockExistingProducts[0]]);
      
      const result = await service.getAllProducts({ name: 'Test Product 1' });
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Test Product 1');
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.anything(),
          }),
        }),
      );
    });

    it('should filter products by price range', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        {
          ...mockExistingProducts[0],
          prices: [{ value: 100, currency: 'USD' }]
        }
      ]);
      
      const result = await service.getAllProducts({ minPrice: 100, maxPrice: 150 });
      
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].price).toBeGreaterThanOrEqual(100);
      expect(result.data[0].price).toBeLessThanOrEqual(150);
    });

    it('should filter products by availability', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        {
          ...mockExistingProducts[0],
          availability: [{ isAvailable: true }]
        }
      ]);
      
      const result = await service.getAllProducts({ availability: true });
      
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].isAvailable).toBe(true);
    });

    it('should filter products by provider', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockExistingProducts[0]]);
      
      const result = await service.getAllProducts({ provider: 'provider-one' });
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].provider).toBe('provider-one');
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            providerName: 'provider-one',
          }),
        }),
      );
    });

    it('should return products with pagination', async () => {
      // Arrange
      const mockDbProducts = [
        {
          id: 'prod-1',
          name: 'Product 1',
          description: 'Description 1',
          providerId: 'p1-001',
          providerName: 'provider-one',
          isStale: false,
          lastFetchedAt: new Date(),
          updatedAt: new Date(),
          prices: [{ value: 10.99, currency: 'USD' }],
          availability: [{ isAvailable: true }],
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockDbProducts);
      mockPrismaService.product.count.mockResolvedValue(15);

      // Act
      const result = await service.getAllProducts({
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('totalItems', 15);
      expect(result.meta).toHaveProperty('totalPages', 2);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('name', 'Product 1');
    });
  });

  describe('getProductById', () => {
    it('should return a product by ID with price history', async () => {
      const productId = '1';
      
      const result = await service.getProductById(productId);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(productId);
      expect(result?.priceHistory).toBeDefined();
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: productId },
        }),
      );
    });

    it('should return null if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      
      const result = await service.getProductById('non-existent');
      
      expect(result).toBeNull();
    });
  });

  describe('getChanges', () => {
    beforeEach(() => {
      const mockPriceChanges = [
        {
          id: 'price-1',
          value: 120,
          currency: 'USD',
          productId: '1',
          createdAt: new Date(),
          product: mockExistingProducts[0],
        },
      ];

      const mockAvailabilityChanges = [
        {
          id: 'availability-1',
          isAvailable: false,
          productId: '1',
          createdAt: new Date(),
          product: mockExistingProducts[0],
        },
      ];

      mockPrismaService.price.findMany.mockResolvedValue(mockPriceChanges);
      mockPrismaService.availability.findMany.mockResolvedValue(mockAvailabilityChanges);
    });

    it('should return changes within the default timeframe (24h)', async () => {
      const result = await service.getChanges();
      
      expect(result).toHaveLength(1); // One product with changes
      expect(result[0]).toHaveProperty('priceChanges');
      expect(result[0]).toHaveProperty('availabilityChanges');
      expect(mockPrismaService.price.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.anything(),
          }),
        }),
      );
    });

    it('should use the specified timeframe', async () => {
      const timeframe = 30; // 30 minutes
      
      await service.getChanges(timeframe);
      
      expect(mockPrismaService.price.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.anything(),
          }),
        }),
      );
      expect(mockPrismaService.availability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.anything(),
          }),
        }),
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should clear the interval when module is destroyed', () => {
      // Mock the intervalId property
      const mockIntervalId = {} as NodeJS.Timeout;
      Object.defineProperty(service, 'intervalId', {
        get: jest.fn(() => mockIntervalId),
        set: jest.fn()
      });
      
      // Spy on clearInterval
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      // Call the method under test
      service.onModuleDestroy();
      
      // Verify clearInterval was called with the mock interval ID
      expect(clearIntervalSpy).toHaveBeenCalledWith(mockIntervalId);
    });
  });

  describe('checkAndMarkStaleProducts', () => {
    it('should mark products as stale if they have not been updated within the threshold', async () => {
      // Arrange
      const currentTime = new Date();
      const oldTime = new Date(currentTime.getTime() - 120000); // 2 minutes ago (beyond the 1 minute threshold)
      
      mockPrismaService.product.updateMany.mockResolvedValue({ count: 2 });

      // Act
      await service.checkAndMarkStaleProducts();

      // Assert
      expect(mockPrismaService.product.updateMany).toHaveBeenCalledWith({
        where: {
          lastFetchedAt: { lt: expect.any(Date) },
          isStale: false
        },
        data: {
          isStale: true
        }
      });
    });
  });

  describe('getStaleProducts', () => {
    it('should return a list of stale products with correct format', async () => {
      // Arrange
      const mockStaleProducts = [
        {
          id: 'stale-1',
          name: 'Stale Product',
          description: 'This product is stale',
          providerId: 'p1-old',
          providerName: 'provider-one',
          isStale: true,
          lastFetchedAt: new Date(Date.now() - 120000),
          updatedAt: new Date(Date.now() - 120000),
          prices: [{ value: 15.99, currency: 'USD' }],
          availability: [{ isAvailable: false }],
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockStaleProducts);

      // Act
      const result = await service.getStaleProducts();

      // Assert
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: { isStale: true },
        include: expect.any(Object),
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('staleReason');
      expect(result[0]).toHaveProperty('isStale', true);
      expect(result[0]).toHaveProperty('name', 'Stale Product');
      expect(result[0]).toHaveProperty('price', 15.99);
    });
  });
}); 