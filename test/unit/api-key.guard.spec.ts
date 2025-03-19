import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from '../../src/core/auth/api-key.guard';
import { IS_PUBLIC_KEY } from '../../src/core/auth/public.decorator';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let reflector: Reflector;

  // Set the API key for tests
  const TEST_API_KEY = 'test-api-key-1234';
  
  beforeEach(async () => {
    // Mock the environment variables
    process.env.API_KEY = TEST_API_KEY;
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn()
          }
        }
      ]
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: ExecutionContext;
    let mockRequest: {
      url: string;
      headers: Record<string, string>;
      query: Record<string, string>;
    };

    beforeEach(() => {
      mockRequest = {
        url: '/api/products',
        headers: {},
        query: {}
      };

      mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest)
        }),
        getHandler: jest.fn(),
        getClass: jest.fn()
      } as unknown as ExecutionContext;
    });

    it('should allow access for public routes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockContext.getHandler(),
        mockContext.getClass()
      ]);
    });

    it('should allow access for Swagger UI routes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockRequest.url = '/api/swagger-ui';

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when API key is missing', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException
      );
      expect(() => guard.canActivate(mockContext)).toThrow(
        'API key is missing'
      );
    });

    it('should throw UnauthorizedException when API key is invalid', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockRequest.headers['x-api-key'] = 'invalid-api-key';

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException
      );
      expect(() => guard.canActivate(mockContext)).toThrow('Invalid API key');
    });

    it('should allow access with valid API key in header', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockRequest.headers['x-api-key'] = TEST_API_KEY;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access with valid API key in query parameter', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockRequest.query.apiKey = TEST_API_KEY;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });
});
