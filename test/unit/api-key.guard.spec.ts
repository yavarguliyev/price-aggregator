import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { ApiKeyGuard } from '../../src/core/auth/api-key.guard';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let reflector: Reflector;
  let configService: ConfigService;

  const TEST_API_KEY = 'test-api-key-1234';

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'API_KEY') return TEST_API_KEY;
        return undefined;
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ]
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    reflector = module.get<Reflector>(Reflector);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    const expectDefined = (x: unknown): void => {
      expect(x).toBeDefined();
    };

    expectDefined(guard);
  });

  describe('canActivate', () => {
    let mockContext: ExecutionContext;

    beforeEach(() => {
      mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            url: '/api/products',
            headers: {},
            query: {}
          })
        }),
        getHandler: jest.fn(),
        getClass: jest.fn()
      } as unknown as ExecutionContext;
    });

    it('should allow access for public routes', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = await Promise.resolve(guard.canActivate(mockContext));

      expect(result).toBe(true);
    });

    it('should allow access with valid API key', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const request = mockContext.switchToHttp().getRequest();
      request.headers['x-api-key'] = TEST_API_KEY;

      const result = await Promise.resolve(guard.canActivate(mockContext));

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when API key is missing', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      let error: Error | undefined;
      try {
        await Promise.resolve(guard.canActivate(mockContext));
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error?.message).toBe('API key is missing');
    });

    it('should throw UnauthorizedException when API key is invalid', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const request = mockContext.switchToHttp().getRequest();
      request.headers['x-api-key'] = 'invalid-key';

      let error: Error | undefined;
      try {
        await Promise.resolve(guard.canActivate(mockContext));
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error?.message).toBe('Invalid API key');
    });

    it('should allow access for Swagger UI routes', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const request = mockContext.switchToHttp().getRequest();
      request.url = '/api/swagger';

      const result = await Promise.resolve(guard.canActivate(mockContext));

      expect(result).toBe(true);
    });
  });
});
