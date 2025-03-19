import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { Observable } from "rxjs";
import { IS_PUBLIC_KEY } from "./public.decorator";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  // In a real application, this would be stored in a secure location or database
  private readonly apiKeys: string[] = [
    process.env.API_KEY || "test-api-key-1234",
  ];

  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Skip API key check for Swagger UI
    if (this.isSwaggerRequest(request)) {
      return true;
    }

    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException("API key is missing");
    }

    if (!this.isValidApiKey(apiKey)) {
      throw new UnauthorizedException("Invalid API key");
    }

    return true;
  }

  private isSwaggerRequest(request: Request): boolean {
    const url = request.url;
    return (
      url.startsWith("/api") &&
      (url.includes("swagger") ||
        url.includes("api-docs") ||
        url.includes("api-json"))
    );
  }

  private extractApiKey(request: Request): string | undefined {
    // Check for API key in header
    const apiKeyHeader = request.headers["x-api-key"];
    if (apiKeyHeader) {
      return Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
    }

    // Check for API key in query parameters
    const apiKeyQuery = request.query["apiKey"];
    if (apiKeyQuery) {
      return String(apiKeyQuery);
    }

    return undefined;
  }

  private isValidApiKey(apiKey: string): boolean {
    return this.apiKeys.includes(apiKey);
  }
}
