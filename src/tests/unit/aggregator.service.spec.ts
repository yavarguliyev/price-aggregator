import { Test, TestingModule } from '@nestjs/testing';
import { AggregatorService } from '../../aggregator/aggregator.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProviderOneService } from '../../provider-simulator/providers/provider-one.service';
import { ProviderTwoService } from '../../provider-simulator/providers/provider-two.service';
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

describe('AggregatorService', () => {
  let service: AggregatorService;
  let prismaService: PrismaService;
  let providerOneService: ProviderOneService;
  let providerTwoService: ProviderTwoService;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregatorService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ProviderOneService, useValue: mockProviderOneService },
        { provide: ProviderTwoService, useValue: mockProviderTwoService },
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<AggregatorService>(AggregatorService);
    prismaService = module.get<PrismaService>(PrismaService);
    providerOneService = module.get<ProviderOneService>(ProviderOneService);
    providerTwoService = module.get<ProviderTwoService>(ProviderTwoService);

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
      
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy).toHaveBeenCalledWith('provider-one', mockProducts);
      expect(fetchSpy).toHaveBeenCalledWith('provider-two', expect.any(Array));
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
      
      expect(result).toHaveLength(mockExistingProducts.length);
      expect(result[0]).toHaveProperty('id', mockExistingProducts[0].id);
      expect(result[0]).toHaveProperty('price', mockExistingProducts[0].prices[0].value);
      expect(result[0]).toHaveProperty('isAvailable', mockExistingProducts[0].availability[0].isAvailable);
    });

    it('should filter products by name', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockExistingProducts[0]]);
      
      const result = await service.getAllProducts({ name: 'Test Product 1' });
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Product 1');
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.anything(),
          }),
        }),
      );
    });

    it('should filter products by price range', async () => {
      const result = await service.getAllProducts({ minPrice: 100, maxPrice: 150 });
      
      expect(result.every(p => p.price >= 100 && p.price <= 150)).toBe(true);
    });

    it('should filter products by availability', async () => {
      const result = await service.getAllProducts({ availability: true });
      
      expect(result.every(p => p.isAvailable === true)).toBe(true);
    });

    it('should filter products by provider', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockExistingProducts[0]]);
      
      const result = await service.getAllProducts({ provider: 'provider-one' });
      
      expect(result).toHaveLength(1);
      expect(result[0].provider).toBe('provider-one');
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            providerName: 'provider-one',
          }),
        }),
      );
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
}); 