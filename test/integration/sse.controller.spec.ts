import { Test, TestingModule } from "@nestjs/testing";
import { SseController } from "../../src/api/sse.controller";
import { AggregatorService } from "../../src/application/services/aggregator.service";
import { Response } from "express";
import { Observable } from "rxjs";
import * as fs from "fs";
import * as path from "path";

jest.mock("fs");
jest.mock("path");

describe("SseController", () => {
  let controller: SseController;
  let aggregatorService: AggregatorService;

  // Mock Express Response
  const mockResponse = {
    type: jest.fn().mockReturnThis(),
    send: jest.fn(),
  } as unknown as Response;

  // Mock aggregator service
  const mockAggregatorService = {
    getAllProducts: jest.fn().mockResolvedValue({
      data: [
        {
          id: "1",
          name: "Test Product 1",
          price: 100,
          currency: "USD",
          isAvailable: true,
          provider: "provider-one",
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Test Product 2",
          price: 200,
          currency: "USD",
          isAvailable: false,
          provider: "provider-two",
          updatedAt: new Date().toISOString(),
        },
      ],
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SseController],
      providers: [
        {
          provide: AggregatorService,
          useValue: mockAggregatorService,
        },
      ],
    }).compile();

    controller = module.get<SseController>(SseController);
    aggregatorService = module.get<AggregatorService>(AggregatorService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getVisualizationPage", () => {
    it("should return HTML content when file exists", async () => {
      const mockHtml = "<html>Test HTML</html>";
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(mockHtml);

      const result = await controller.getVisualizationPage();

      expect(result).toBe(mockHtml);
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it("should return default HTML when file does not exist", async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await controller.getVisualizationPage();

      expect(result).toContain("<!DOCTYPE html>");
      expect(result).toContain('<table id="productsTable">');
      expect(result).toContain("EventSource");
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });
  });

  describe("sse", () => {
    it("should return an Observable", () => {
      const result = controller.sse();

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
