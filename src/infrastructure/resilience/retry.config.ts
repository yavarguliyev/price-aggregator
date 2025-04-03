import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AxiosError {
  response?: {
    status: number;
  };
  code?: string;
}

export function exponentialBackoff (retryCount: number): number {
  return Math.pow(2, retryCount) * 100;
}

@Injectable()
export class RetryConfig {
  readonly maxRetries: number;
  readonly timeout: number;

  constructor (private configService: ConfigService) {
    this.maxRetries = this.configService.get<number>('HTTP_MAX_RETRIES', 3);
    this.timeout = this.configService.get<number>('HTTP_TIMEOUT', 5000);
  }

  getRetryDelay (retryCount: number): number {
    return exponentialBackoff(retryCount);
  }

  shouldRetry (error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const axiosError = error as AxiosError;

    if (!axiosError.response) {
      if (axiosError.code) {
        const networkErrorCodes = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'];
        return networkErrorCodes.includes(axiosError.code);
      }

      return true;
    }

    if (axiosError.response.status >= 500 && axiosError.response.status < 600) {
      return true;
    }

    return false;
  }
}
