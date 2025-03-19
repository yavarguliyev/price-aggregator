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

    it('should provide data from aggregator service', (done) => {
      const result = controller.sse();
      
      // Subscribe to the observable
      const subscription = result.subscribe({
        next: (value) => {
          // Check if the value contains the mocked product data
          expect(value).toHaveProperty('data');
          expect(JSON.parse(value.data)).toHaveLength(2);
          expect(JSON.parse(value.data)[0].name).toBe('Test Product 1');
          
          subscription.unsubscribe();
          done();
        },
        error: (error) => {
          subscription.unsubscribe();
          done(error);
        },
      });
      
      // Force the internal setInterval to run once
      jest.advanceTimersByTime(2000);
    });

    it('should handle errors gracefully', (done) => {
      // Mock an error in the service
      mockAggregatorService.getAllProducts.mockRejectedValueOnce(new Error('Test error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = controller.sse();
      
      // Subscribe to the observable
      const subscription = result.subscribe({
        next: () => {
          // We expect no next value due to the error
          subscription.unsubscribe();
          done();
        },
        error: () => {
          // The error should be caught and not propagated
          fail('Error should not be propagated');
          subscription.unsubscribe();
          done();
        },
      });
      
      // Force the internal setInterval to run once
      jest.advanceTimersByTime(2000);
      
      // Check if console.error was called
      expect(consoleSpy).toHaveBeenCalled();
      subscription.unsubscribe();
      done();
    });
  });
}); 