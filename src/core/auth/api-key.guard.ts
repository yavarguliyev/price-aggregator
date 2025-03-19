import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ParsedQs } from 'qs';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly apiKeys: string[] = [process.env.API_KEY!];

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (this.isSwaggerRequest(request)) {
      return true;
    }

    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    if (!this.isValidApiKey(apiKey)) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }

  private isSwaggerRequest(request: Request): boolean {
    const url = request.url;
    return (url.startsWith('/api') && (url.includes('swagger') || url.includes('api-docs') || url.includes('api-json')));
  }

  private extractApiKey(request: Request): string | undefined {
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader) {
      return Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
    }

    const apiKeyQuery = request.query['apiKey'] as | string | string[] | ParsedQs | undefined;
    if (!apiKeyQuery) return undefined;

    if (typeof apiKeyQuery === 'string') return apiKeyQuery;
    if (Array.isArray(apiKeyQuery)) return apiKeyQuery[0];
    return JSON.stringify(apiKeyQuery);
  }

  private isValidApiKey(apiKey: string): boolean {
    return this.apiKeys.includes(apiKey);
  }
}
