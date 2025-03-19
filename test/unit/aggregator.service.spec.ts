import { Test, TestingModule } from "@nestjs/testing";
import { AggregatorService } from "../../src/application/services/aggregator.service";
import { ProductService } from "../../src/application/services/product.service";
import { ProviderService } from "../../src/application/services/provider.service";
import { Logger } from "@nestjs/common";

describe("AggregatorService", () => {
  let service: AggregatorService;
  let productServiceMock: Partial<ProductService>;
  let providerServiceMock: Partial<ProviderService>;

  beforeEach(async () => {
    productServiceMock = {
      getAllProducts: jest.fn(),
      getProductById: jest.fn(),
      getStaleProducts: jest.fn(),
      checkAndMarkStaleProducts: jest.fn(),
    };

    providerServiceMock = {
      startFetchingData: jest.fn(),
      stopFetchingData: jest.fn(),
      fetchAllProviders: jest.fn(),
      getChanges: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregatorService,
        {
          provide: ProductService,
          useValue: productServiceMock,
        },
        {
          provide: ProviderService,
          useValue: providerServiceMock,
        },
        Logger,
      ],
    }).compile();

    service = module.get<AggregatorService>(AggregatorService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getAllProducts", () => {
    it("should delegate to ProductService", async () => {
      const expectedResult = {
        data: [
          {
            id: "1",
            name: "Product 1",
            description: "Description 1",
            provider: "provider-one",
            providerId: "prod-1",
            price: 19.99,
            currency: "USD",
            isAvailable: true,
            isStale: false,
            lastFetchedAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
      };

      (productServiceMock.getAllProducts as jest.Mock).mockResolvedValue(
        expectedResult,
      );

      const filters = { name: "test", page: 1, limit: 10 };
      const result = await service.getAllProducts(filters);

      expect(productServiceMock.getAllProducts).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("getProductById", () => {
    it("should delegate to ProductService", async () => {
      const productId = "123";
      const expectedProduct = {
        id: productId,
        name: "Test Product",
        description: "A test product",
        provider: "provider-one",
        providerId: "test-1",
        price: 29.99,
        currency: "USD",
        isAvailable: true,
        isStale: false,
        lastFetchedAt: new Date(),
        updatedAt: new Date(),
        priceHistory: [
          { value: 29.99, currency: "USD", timestamp: new Date() },
        ],
      };

      (productServiceMock.getProductById as jest.Mock).mockResolvedValue(
        expectedProduct,
      );

      const result = await service.getProductById(productId);

      expect(productServiceMock.getProductById).toHaveBeenCalledWith(productId);
      expect(result).toEqual({ data: expectedProduct });
    });

    it("should handle errors from ProductService", async () => {
      const productId = "not-found";
      const error = new Error("Product not found");

      (productServiceMock.getProductById as jest.Mock).mockRejectedValue(error);

      const result = await service.getProductById(productId);
      expect(result).toEqual({ data: null });
      expect(productServiceMock.getProductById).toHaveBeenCalledWith(productId);
    });
  });

  describe("getChanges", () => {
    it("should delegate to ProviderService", async () => {
      const timeframe = 24;
      const expectedChanges = [
        {
          id: "1",
          name: "Product 1",
          priceChanges: [],
          availabilityChanges: [],
        },
      ];

      (providerServiceMock.getChanges as jest.Mock).mockResolvedValue(
        expectedChanges,
      );

      const result = await service.getChanges(timeframe);

      expect(providerServiceMock.getChanges).toHaveBeenCalledWith(timeframe);
      expect(result).toEqual({ data: expectedChanges });
    });
  });

  describe("getStaleProducts", () => {
    it("should delegate to ProductService", async () => {
      const expectedStaleProducts = [
        {
          id: "stale-1",
          name: "Stale Product",
          staleReason: "Not updated in 60 minutes",
          isStale: true,
        },
      ];

      (productServiceMock.getStaleProducts as jest.Mock).mockResolvedValue(
        expectedStaleProducts,
      );

      const result = await service.getStaleProducts();

      expect(productServiceMock.getStaleProducts).toHaveBeenCalled();
      expect(result).toEqual({ data: expectedStaleProducts });
    });
  });

  describe("lifecycle hooks", () => {
    it("should start fetching data on module init", async () => {
      jest.spyOn(global, "setInterval").mockImplementation(() => {
        return { unref: jest.fn() } as unknown as NodeJS.Timeout;
      });

      service.onModuleInit();

      expect(providerServiceMock.startFetchingData).toHaveBeenCalled();
      expect(global.setInterval).toHaveBeenCalled();
    });

    it("should clean up on module destroy", () => {
      const mockClearInterval = jest
        .spyOn(global, "clearInterval")
        .mockImplementation();

      Object.defineProperty(service, "stalenessCheckIntervalId", {
        value: setInterval(() => {}, 1000),
        writable: true,
      });

      service.onModuleDestroy();

      expect(providerServiceMock.stopFetchingData).toHaveBeenCalled();
      expect(mockClearInterval).toHaveBeenCalled();
    });
  });
});
