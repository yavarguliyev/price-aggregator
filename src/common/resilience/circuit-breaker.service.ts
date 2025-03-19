import { Injectable, Logger } from '@nestjs/common';

/**
 * Circuit breaker state
 */
enum CircuitState {
  CLOSED = 'CLOSED',    // Normal operation, calls go through
  OPEN = 'OPEN',        // Circuit is tripped, all calls immediately fail
  HALF_OPEN = 'HALF_OPEN', // Testing if service is back, allows one test call
}

/**
 * Configuration for a circuit breaker
 */
export interface CircuitBreakerOptions {
  // How many failures before the circuit opens
  failureThreshold: number;
  // How long to wait before attempting to half-open the circuit (ms)
  resetTimeout: number;
  // Name of this circuit (for logging)
  name: string;
}

/**
 * Circuit breaker implementation
 * Prevents repeated calls to failing services
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuits: Map<string, CircuitBreaker> = new Map();
  
  /**
   * Get or create a circuit breaker for a specific service
   */
  getCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
    if (!this.circuits.has(options.name)) {
      this.circuits.set(options.name, new CircuitBreaker(options, this.logger));
    }
    return this.circuits.get(options.name)!;
  }
  
  /**
   * Execute a function through the circuit breaker
   */
  async executeWithCircuitBreaker<T>(
    options: CircuitBreakerOptions,
    fn: () => Promise<T>
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(options);
    return circuitBreaker.execute(fn);
  }
}

/**
 * Individual circuit breaker instance for a service
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private nextAttemptTime: number = 0;
  private readonly options: CircuitBreakerOptions;
  private readonly logger: Logger;
  
  constructor(options: CircuitBreakerOptions, logger: Logger) {
    this.options = options;
    this.logger = logger;
  }
  
  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() > this.nextAttemptTime) {
        // Time to try again, move to half-open
        this.toHalfOpen();
      } else {
        // Circuit is still open, fail fast
        this.logger.warn(`Circuit ${this.options.name} is OPEN, failing fast`);
        throw new Error(`Circuit for ${this.options.name} is open`);
      }
    }
    
    try {
      // Execute the function
      const result = await fn();
      
      // Success - reset circuit if needed
      this.onSuccess();
      return result;
    } catch (error) {
      // Handle failure
      this.onFailure(error);
      throw error;
    }
  }
  
  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      // Service seems healthy again, close the circuit
      this.logger.log(`Circuit ${this.options.name} is now CLOSED (service recovered)`);
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
    }
  }
  
  /**
   * Handle failed execution
   */
  private onFailure(error: any): void {
    if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      this.logger.warn(`Circuit ${this.options.name} failure count: ${this.failureCount}/${this.options.failureThreshold}`);
      
      if (this.failureCount >= this.options.failureThreshold) {
        this.toOpen();
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      // Failed during test, back to open
      this.toOpen();
    }
  }
  
  /**
   * Transition to OPEN state
   */
  private toOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.options.resetTimeout;
    this.logger.warn(`Circuit ${this.options.name} is now OPEN until ${new Date(this.nextAttemptTime).toISOString()}`);
  }
  
  /**
   * Transition to HALF_OPEN state
   */
  private toHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.logger.log(`Circuit ${this.options.name} is now HALF_OPEN, testing service`);
  }
} 