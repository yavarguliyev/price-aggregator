import { Injectable, Logger } from '@nestjs/common';

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: string[];
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);
  private readonly defaultRetryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'];

  async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryableErrors: this.defaultRetryableErrors,
    },
  ): Promise<T> {
    let lastError: Error = new Error('No error occurred');
    let delay = options.initialDelay;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (!this.shouldRetry(error, options.retryableErrors || this.defaultRetryableErrors)) {
          this.logger.error(`Non-retryable error occurred: ${error.message}`);
          throw error;
        }

        if (attempt === options.maxAttempts) {
          this.logger.error(`Max retry attempts (${options.maxAttempts}) reached. Last error: ${error.message}`);
          throw error;
        }

        this.logger.warn(
          `Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`,
        );
        
        await this.delay(delay);
        delay = Math.min(delay * options.backoffFactor, options.maxDelay);
      }
    }

    throw lastError;
  }

  private shouldRetry(error: Error, retryableErrors: string[]): boolean {
    const errorMessage = error.message.toUpperCase();
    return retryableErrors.some(retryableError =>
      errorMessage.includes(retryableError.toUpperCase()),
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 