import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { CircuitBreakerService, CircuitBreakerOptions } from '../services/circuit-breaker.service';
import { RetryService, RetryOptions } from '../services/retry.service';

/**
 * Enhanced HTTP client with resilience patterns
 */
@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  
  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly retryService: RetryService,
  ) {}
  
  /**
   * Make a resilient HTTP GET request with retries and circuit breaker
   */
  async get<T = any>(
    url: string, 
    config?: AxiosRequestConfig,
    circuitOptions?: CircuitBreakerOptions,
    retryOptions?: RetryOptions,
  ): Promise<AxiosResponse<T>> {
    const defaultCircuitOptions: CircuitBreakerOptions = {
      failureThreshold: 3,
      resetTimeout: 30000, // 30 seconds
      halfOpenTimeout: 15000, // 15 seconds
      ...(circuitOptions || {}),
    };
    
    return this.circuitBreakerService.execute(
      `GET:${url}`,
      async () => {
        return this.retryService.execute(
          async () => {
            this.logger.debug(`Making GET request to ${url}`);
            try {
              const response = await firstValueFrom(
                this.httpService.get<T>(url, config)
              );
              return response;
            } catch (error) {
              this.logger.error(`Error in HTTP GET request to ${url}: ${error.message}`);
              throw error;
            }
          },
          retryOptions
        );
      },
      defaultCircuitOptions
    );
  }
  
  /**
   * Make a resilient HTTP POST request with retries and circuit breaker
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    circuitOptions?: CircuitBreakerOptions,
    retryOptions?: RetryOptions,
  ): Promise<AxiosResponse<T>> {
    const defaultCircuitOptions: CircuitBreakerOptions = {
      failureThreshold: 3,
      resetTimeout: 30000, // 30 seconds
      halfOpenTimeout: 15000, // 15 seconds
      ...(circuitOptions || {}),
    };
    
    return this.circuitBreakerService.execute(
      `POST:${url}`,
      async () => {
        return this.retryService.execute(
          async () => {
            this.logger.debug(`Making POST request to ${url}`);
            try {
              const response = await firstValueFrom(
                this.httpService.post<T>(url, data, config)
              );
              return response;
            } catch (error) {
              this.logger.error(`Error in HTTP POST request to ${url}: ${error.message}`);
              throw error;
            }
          },
          retryOptions
        );
      },
      defaultCircuitOptions
    );
  }
} 