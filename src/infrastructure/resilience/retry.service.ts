import { Injectable } from '@nestjs/common';

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: string[];
}

@Injectable()
export class RetryService {
  private readonly defaultRetryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'];

  private readonly defaultOptions: RetryOptions = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableErrors: this.defaultRetryableErrors
  };

  private handleError (error: unknown, context: string): never {
    if (error instanceof Error) {
      throw new Error(`Error in ${context}: ${error.message}`);
    }

    throw new Error(`Unknown error in ${context}`);
  }

  private shouldRetry (error: unknown, options: RetryOptions): boolean {
    if (!(error instanceof Error)) return false;
    const retryableErrors = options.retryableErrors || this.defaultRetryableErrors;
    return retryableErrors.some((retryableError) => error.message.includes(retryableError));
  }

  private calculateDelay (attempt: number, options: RetryOptions): number {
    const delay = options.initialDelay * Math.pow(options.backoffFactor, attempt - 1);
    return Math.min(delay, options.maxDelay);
  }

  async execute<T> (operation: () => Promise<T>, options: RetryOptions = this.defaultOptions): Promise<T> {
    let lastError: Error | undefined;
    let attempts = 0;

    while (attempts < options.maxAttempts) {
      try {
        attempts++;
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!this.shouldRetry(error, options)) {
          this.handleError(error, 'retry.execute');
        }

        if (attempts === options.maxAttempts) {
          this.handleError(error, 'retry.execute');
        }

        await this.delay(this.calculateDelay(attempts, options));
      }
    }

    this.handleError(lastError, 'retry.execute');
  }

  private delay (ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
