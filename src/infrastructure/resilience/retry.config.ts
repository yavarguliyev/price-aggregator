import { Injectable } from "@nestjs/common";

interface AxiosError {
  response?: {
    status: number;
  };
  code?: string;
}

export function exponentialBackoff(retryCount: number): number {
  return Math.pow(2, retryCount) * 100;
}

@Injectable()
export class RetryConfig {
  readonly maxRetries = 3;
  readonly timeout = 5000;

  getRetryDelay(retryCount: number): number {
    return exponentialBackoff(retryCount);
  }

  shouldRetry(error: unknown): boolean {
    if (!error || typeof error !== "object") {
      return false;
    }

    const axiosError = error as AxiosError;

    if (!axiosError.response) {
      if (axiosError.code) {
        const networkErrorCodes = ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"];
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
