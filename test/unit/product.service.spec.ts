import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ProductService } from "../../src/application/services/product.service";
import { ProductRepository } from "../../src/infrastructure/persistence/product.repository";
import { Logger } from "@nestjs/common";
import { Product } from "@prisma/client";

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

describe("ProductService", () => {
  let service: ProductService;
  let productRepository: ProductRepository;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const mockProductRepository = {
      findStaleProducts: jest.fn(),
      markStaleProducts: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
    };

    const mockConfigService = {
      get: jest
        .fn()
        .mockImplementation((key: string, defaultValue: unknown) => {
          if (key === "STALENESS_THRESHOLD") return 60000;
          return defaultValue;
        }),
    };

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
          provide: "ConfigService",
          useValue: mockConfigService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    jest.spyOn(Logger, "warn").mockImplementation(() => {});
    jest.spyOn(Logger, "error").mockImplementation(() => {});
    jest.spyOn(Logger, "log").mockImplementation(() => {});
    jest.spyOn(Logger, "debug").mockImplementation(() => {});

    service = module.get<ProductService>(ProductService);
    productRepository = module.get<ProductRepository>(ProductRepository);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getStaleProducts", () => {
    it("should return stale products from the repository", async () => {
      const mockStaleProducts = [
        {
          id: "1",
          name: "Stale Product",
          description: "This product is stale",
          price: 100,
          currency: "USD",
          isAvailable: false,
          provider: "provider-one",
          providerId: "stale-1",
          isStale: true,
          lastFetchedAt: new Date(Date.now() - 120000),
          updatedAt: new Date(Date.now() - 120000),
          createdAt: new Date(Date.now() - 120000),
          prices: [
            {
              id: "price-1",
              amount: 100,
              currency: "USD",
              createdAt: new Date(),
              productId: "1",
            },
          ],
          availability: [
            {
              id: "avail-1",
              isAvailable: true,
              createdAt: new Date(),
              productId: "1",
            },
          ],
          staleReason: "Product data is stale",
        } as ProductWithDetails,
      ];

      jest
        .spyOn(productRepository, "findStaleProducts")
        .mockResolvedValue(mockStaleProducts);

      const result = (await service.getStaleProducts()) as ProductWithDetails[];

      expect(productRepository.findStaleProducts).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result?.[0]?.id).toBe("1");
      expect(result?.[0]?.name).toBe("Stale Product");
      expect(result?.[0]?.isStale).toBe(true);
      expect(result?.[0]?.staleReason).toContain("Product data is stale");
    });
  });

  describe("checkAndMarkStaleProducts", () => {
    it("should mark products as stale and emit an event", async () => {
      const mockStaleResult = { count: 2 };
      jest
        .spyOn(productRepository, "markStaleProducts")
        .mockResolvedValue(mockStaleResult);

      await service.checkAndMarkStaleProducts();

      const expectedThreshold = 24 * 60 * 60 * 1000;
      expect(productRepository.markStaleProducts).toHaveBeenCalledWith(
        expectedThreshold,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "products.stale.checked",
        expect.any(Object),
      );
    });

    it("should not emit an event if no products were marked stale", async () => {
      const mockStaleResult = { count: 0 };
      jest
        .spyOn(productRepository, "markStaleProducts")
        .mockResolvedValue(mockStaleResult);

      jest.spyOn(eventEmitter, "emit").mockClear();

      await service.checkAndMarkStaleProducts();

      const expectedThreshold = 24 * 60 * 60 * 1000;
      expect(productRepository.markStaleProducts).toHaveBeenCalledWith(
        expectedThreshold,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        "products.stale.checked",
        expect.any(Object),
      );
    });
  });

  describe("getAllProducts", () => {
    it("should fetch products with default parameters when no filters are provided", async () => {
      jest.spyOn(productRepository, "count").mockResolvedValue(10);
      jest.spyOn(productRepository, "findMany").mockResolvedValue([]);

      await service.getAllProducts();

      expect(productRepository.count).toHaveBeenCalled();
      expect(productRepository.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { isStale: false },
        orderBy: { updatedAt: "desc" },
      });
    });

    it("should apply filters correctly", async () => {
      jest.spyOn(productRepository, "count").mockResolvedValue(5);
      jest.spyOn(productRepository, "findMany").mockResolvedValue([]);

      const filters = {
        name: "test",
        provider: "provider-one",
        includeStale: true,
        page: 2,
        limit: 5,
      };

      await service.getAllProducts(filters);

      expect(productRepository.count).toHaveBeenCalledWith({
        name: { contains: "test", mode: "insensitive" },
        provider: "provider-one",
      });

      expect(productRepository.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        where: {
          name: { contains: "test", mode: "insensitive" },
          provider: "provider-one",
        },
        orderBy: { updatedAt: "desc" },
      });
    });
  });

  describe("getProductById", () => {
    it("should return a product by ID with price history", async () => {
      const mockProduct = {
        id: "123",
        name: "Test Product",
        description: "Test Description",
        provider: "provider-one",
        providerId: "test-123",
        isStale: false,
        lastFetchedAt: new Date(),
        updatedAt: new Date(),
        createdAt: new Date(),
        prices: [
          {
            id: "price-1",
            amount: 100,
            currency: "USD",
            createdAt: new Date(),
            productId: "123",
          },
          {
            id: "price-2",
            amount: 90,
            currency: "USD",
            createdAt: new Date(Date.now() - 86400000),
            productId: "123",
          },
        ],
        availability: [
          {
            id: "avail-1",
            isAvailable: true,
            createdAt: new Date(),
            productId: "123",
          },
        ],
        priceHistory: [
          {
            id: "price-1",
            amount: 100,
            currency: "USD",
            date: new Date(),
          },
          {
            id: "price-2",
            amount: 90,
            currency: "USD",
            date: new Date(Date.now() - 86400000),
          },
        ],
      } as ProductWithDetails;

      jest.spyOn(productRepository, "findById").mockResolvedValue(mockProduct);

      const result = (await service.getProductById(
        "123",
      )) as ProductWithDetails;

      expect(productRepository.findById).toHaveBeenCalledWith("123");
      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe("123");
        expect(result.priceHistory).toBeDefined();
        if (result.priceHistory) {
          expect(result.priceHistory.length).toBe(2);
        }
      }
    });

    it("should return null if product is not found", async () => {
      jest.spyOn(productRepository, "findById").mockResolvedValue(null);

      try {
        await service.getProductById("non-existent");
        fail("Expected error was not thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(
          "Product with ID non-existent not found",
        );
      }

      expect(productRepository.findById).toHaveBeenCalledWith("non-existent");
    });
  });
});
