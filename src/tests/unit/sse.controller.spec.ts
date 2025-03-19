import { Test, TestingModule } from '@nestjs/testing';
import { SseController } from '../../aggregator/sse.controller';
import { AggregatorService } from '../../aggregator/aggregator.service';
import { Response } from 'express';
import { Observable } from 'rxjs';

describe('SseController', () => {
  let controller: SseController;
  let aggregatorService: AggregatorService;

  // Mock Express Response
  const mockResponse = {
    type: jest.fn().mockReturnThis(),
    send: jest.fn(),
  } as unknown as Response;

  // Mock aggregator service
  const mockAggregatorService = {
    getAllProducts: jest.fn().mockResolvedValue([
      {
        id: '1',
        name: 'Test Product 1',
        price: 100,
        currency: 'USD',
        isAvailable: true,
        provider: 'provider-one',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Test Product 2',
        price: 200,
        currency: 'USD',
        isAvailable: false,
        provider: 'provider-two',
        updatedAt: new Date().toISOString(),
      },
    ]),
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('serveHtml', () => {
    it('should return HTML page with table', () => {
      controller.serveHtml(mockResponse);
      
      expect(mockResponse.type).toHaveBeenCalledWith('text/html');
      expect(mockResponse.send).toHaveBeenCalledWith(expect.stringContaining('<!DOCTYPE html>'));
      expect(mockResponse.send).toHaveBeenCalledWith(expect.stringContaining('<table id="productsTable">'));
      expect(mockResponse.send).toHaveBeenCalledWith(expect.stringContaining('EventSource'));
    });
  });

  describe('sse', () => {
    it('should return an Observable', () => {
      const result = controller.sse();
      
      expect(result).toBeInstanceOf(Observable);
    });
  });
}); 