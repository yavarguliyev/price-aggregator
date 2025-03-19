import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import {
  CircuitBreakerService,
  CircuitBreakerOptions,
} from "../resilience/circuit-breaker.service";
import { RetryService, RetryOptions } from "../resilience/retry.service";

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly retryService: RetryService,
  ) {}

  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
    circuitOptions?: CircuitBreakerOptions,
    retryOptions?: RetryOptions,
  ): Promise<AxiosResponse<T>> {
    const defaultCircuitOptions: CircuitBreakerOptions = {
      failureThreshold: 3,
      resetTimeout: 30000,
      halfOpenTimeout: 15000,
      ...(circuitOptions || {}),
    };

    return this.circuitBreakerService.execute(
      `GET:${url}`,
      async () => {
        return this.retryService.execute(async () => {
          this.logger.debug(`Making GET request to ${url}`);
          try {
            return await firstValueFrom(this.httpService.get<T>(url, config));
          } catch (error) {
            const axiosError = error as AxiosError;
            this.logger.error(
              `Error in HTTP GET request to ${url}: ${axiosError.message}`,
            );
            throw error;
          }
        }, retryOptions || undefined);
      },
      defaultCircuitOptions,
    );
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    circuitOptions?: CircuitBreakerOptions,
    retryOptions?: RetryOptions,
  ): Promise<AxiosResponse<T>> {
    const defaultCircuitOptions: CircuitBreakerOptions = {
      failureThreshold: 3,
      resetTimeout: 30000,
      halfOpenTimeout: 15000,
      ...(circuitOptions || {}),
    };

    return this.circuitBreakerService.execute(
      `POST:${url}`,
      async () => {
        return this.retryService.execute(async () => {
          this.logger.debug(`Making POST request to ${url}`);
          try {
            return await firstValueFrom(
              this.httpService.post<T>(url, data, config),
            );
          } catch (error) {
            const axiosError = error as AxiosError;
            this.logger.error(
              `Error in HTTP POST request to ${url}: ${axiosError.message}`,
            );
            throw error;
          }
        }, retryOptions || undefined);
      },
      defaultCircuitOptions,
    );
  }
}
