import { Injectable } from '@nestjs/common';

/**
 * Exponential backoff strategy for retries
 * @param retryCount Current retry number
 * @returns Delay in milliseconds before the next retry
 */
export function exponentialBackoff(retryCount: number): number {
  // Base delay is 100ms, with exponential increase per retry
  // 1st retry: 100ms, 2nd: 200ms, 3rd: 400ms, 4th: 800ms, 5th: 1600ms
  return Math.pow(2, retryCount) * 100;
}

/**
 * Configuration for retry strategies
 */
@Injectable()
export class RetryConfig {
  // Max number of retries for external API calls
  readonly maxRetries = 3;
  
  // Timeout for network requests in milliseconds (5 seconds)
  readonly timeout = 5000;
  
  // Get the retry delay based on retry count
  getRetryDelay(retryCount: number): number {
    return exponentialBackoff(retryCount);
  }
  
  // Should the operation be retried based on the error
  shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx server errors
    if (!error.response) {
      // Network error occurred
      return true;
    }
    
    // Check response status code - retry on server errors (5xx)
    if (error.response.status >= 500 && error.response.status < 600) {
      return true;
    }
    
    // Don't retry on other errors (client errors like 4xx)
    return false;
  }
} 