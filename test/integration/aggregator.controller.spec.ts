import { Test, TestingModule } from "@nestjs/testing";
import { AggregatorController } from "../../src/api/aggregator.controller";
import { AggregatorService } from "../../src/application/services/aggregator.service";
import { CacheModule } from "@nestjs/cache-manager";

describe("AggregatorController", () => {
  let controller: AggregatorController;
  let service: AggregatorService;

  const mockProducts = [
    {
      id: "1",
      name: "Test Product 1",
      description: "Test description 1",
      price: 100,
      currency: "USD",
      isAvailable: true,
      provider: "provider-one",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Test Product 2",
      description: "Test description 2",
      price: 200,
      currency: "USD",
      isAvailable: false,
      provider: "provider-two",
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockProduct = {
    id: "1",
    name: "Test Product 1",
    description: "Test description 1",
    provider: "provider-one",
    providerId: "product-1",
    priceHistory: [
      {
        value: 100,
        currency: "USD",
        timestamp: new Date().toISOString(),
      },
      {
        value: 90,
        currency: "USD",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    isAvailable: true,
    updatedAt: new Date().toISOString(),
  };

  const mockChanges = [
    {
      id: "1",
      name: "Test Product 1",
      description: "Test description 1",
      provider: "provider-one",
      providerId: "product-1",
      priceChanges: [
        {
          value: 100,
          currency: "USD",
          timestamp: new Date().toISOString(),
        },
      ],
      availabilityChanges: [
        {
          isAvailable: true,
          timestamp: new Date().toISOString(),
        },
      ],
    },
  ];

  const mockAggregatorService = {
    getAllProducts: jest.fn().mockResolvedValue(mockProducts),
    getProductById: jest.fn().mockResolvedValue(mockProduct),
    getChanges: jest.fn().mockResolvedValue(mockChanges),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [AggregatorController],
      providers: [
        {
          provide: AggregatorService,
          useValue: mockAggregatorService,
        },
      ],
    }).compile();

    controller = module.get<AggregatorController>(AggregatorController);
    service = module.get<AggregatorService>(AggregatorService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getAllProducts", () => {
    it("should return all products", async () => {
      const result = await controller.getAllProducts();

      expect(result).toEqual(mockProducts);
      expect(mockAggregatorService.getAllProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        includeStale: false,
      });
    });

    it("should apply name filter", async () => {
      const name = "Test";
      const result = await controller.getAllProducts(name);

      expect(result).toEqual(mockProducts);
      expect(mockAggregatorService.getAllProducts).toHaveBeenCalledWith({
        name,
        page: 1,
        limit: 10,
        includeStale: false,
      });
    });

    it("should apply price range filter", async () => {
      const minPrice = 50;
      const maxPrice = 150;
      const result = await controller.getAllProducts(
        undefined,
        minPrice,
        maxPrice,
      );

      expect(result).toEqual(mockProducts);
      expect(mockAggregatorService.getAllProducts).toHaveBeenCalledWith({
        minPrice,
        maxPrice,
        page: 1,
        limit: 10,
        includeStale: false,
      });
    });

    it("should apply availability filter", async () => {
      const availability = true;
      const result = await controller.getAllProducts(
        undefined,
        undefined,
        undefined,
        availability,
      );

      expect(result).toEqual(mockProducts);
      expect(mockAggregatorService.getAllProducts).toHaveBeenCalledWith({
        availability,
        page: 1,
        limit: 10,
        includeStale: false,
      });
    });

    it("should apply provider filter", async () => {
      const provider = "provider-one";
      const result = await controller.getAllProducts(
        undefined,
        undefined,
        undefined,
        undefined,
        provider,
      );

      expect(result).toEqual(mockProducts);
      expect(mockAggregatorService.getAllProducts).toHaveBeenCalledWith({
        provider,
        page: 1,
        limit: 10,
        includeStale: false,
      });
    });

    it("should apply all filters", async () => {
      const name = "Test";
      const minPrice = 50;
      const maxPrice = 150;
      const availability = true;
      const provider = "provider-one";
      const result = await controller.getAllProducts(
        name,
        minPrice,
        maxPrice,
        availability,
        provider,
      );

      expect(result).toEqual(mockProducts);
      expect(mockAggregatorService.getAllProducts).toHaveBeenCalledWith({
        name,
        minPrice,
        maxPrice,
        availability,
        provider,
        page: 1,
        limit: 10,
        includeStale: false,
      });
    });
  });

  describe("getProductById", () => {
    it("should return a product by ID", async () => {
      const id = "1";
      const result = await controller.getProductById(id);

      expect(result).toEqual(mockProduct);
      expect(mockAggregatorService.getProductById).toHaveBeenCalledWith(id);
    });
  });

  describe("getChanges", () => {
    it("should return changes with default timeframe", async () => {
      const result = await controller.getChanges();

      expect(result).toEqual(mockChanges);
      expect(mockAggregatorService.getChanges).toHaveBeenCalledWith(undefined);
    });

    it("should return changes with specified timeframe", async () => {
      const timeframe = 24;
      const result = await controller.getChanges(timeframe);

      expect(result).toEqual(mockChanges);
      expect(mockAggregatorService.getChanges).toHaveBeenCalledWith(timeframe);
    });
  });
});
