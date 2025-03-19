import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ApiKeyGuard } from "../../src/core/auth/api-key.guard";
import { IS_PUBLIC_KEY } from "../../src/core/auth/public.decorator";

describe("ApiKeyGuard", () => {
  let guard: ApiKeyGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    let mockContext: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        url: "/api/products",
        headers: {},
        query: {},
      };

      mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
    });

    it("should allow access for public routes", () => {
      // Arrange
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it("should allow access for Swagger UI routes", () => {
      // Arrange
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      mockRequest.url = "/api/swagger-ui";

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });

    it("should throw UnauthorizedException when API key is missing", () => {
      // Arrange
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(mockContext)).toThrow(
        "API key is missing",
      );
    });

    it("should throw UnauthorizedException when API key is invalid", () => {
      // Arrange
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      mockRequest.headers["x-api-key"] = "invalid-api-key";

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(mockContext)).toThrow("Invalid API key");
    });

    it("should allow access with valid API key in header", () => {
      // Arrange
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      mockRequest.headers["x-api-key"] = "test-api-key-1234";

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });

    it("should allow access with valid API key in query parameter", () => {
      // Arrange
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      mockRequest.query.apiKey = "test-api-key-1234";

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });
  });
});
