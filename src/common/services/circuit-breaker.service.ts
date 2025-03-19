import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenTimeout: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerEvent {
  providerId: string;
  state: CircuitState;
  timestamp: Date;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits: Map<string, {
    state: CircuitState;
    failures: number;
    lastFailureTime: Date;
    lastSuccessTime: Date;
  }> = new Map();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async execute<T>(
    providerId: string,
    operation: () => Promise<T>,
    options: CircuitBreakerOptions = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      halfOpenTimeout: 30000, // 30 seconds
    },
  ): Promise<T> {
    const circuit = this.getOrCreateCircuit(providerId);

    if (this.isCircuitOpen(circuit, options)) {
      this.logger.warn(`Circuit breaker is OPEN for provider ${providerId}`);
      throw new Error(`Circuit breaker is OPEN for provider ${providerId}`);
    }

    try {
      const result = await operation();
      this.handleSuccess(providerId, circuit);
      return result;
    } catch (error) {
      this.handleFailure(providerId, circuit, options);
      throw error;
    }
  }

  private getOrCreateCircuit(providerId: string) {
    if (!this.circuits.has(providerId)) {
      this.circuits.set(providerId, {
        state: CircuitState.CLOSED,
        failures: 0,
        lastFailureTime: new Date(),
        lastSuccessTime: new Date(),
      });
    }
    return this.circuits.get(providerId);
  }

  private isCircuitOpen(circuit: any, options: CircuitBreakerOptions): boolean {
    if (circuit.state === CircuitState.CLOSED) {
      return false;
    }

    const now = new Date();
    const timeSinceLastFailure = now.getTime() - circuit.lastFailureTime.getTime();

    if (circuit.state === CircuitState.OPEN && timeSinceLastFailure >= options.resetTimeout) {
      circuit.state = CircuitState.HALF_OPEN;
      this.emitStateChange(circuit, CircuitState.HALF_OPEN);
      return false;
    }

    if (circuit.state === CircuitState.HALF_OPEN && timeSinceLastFailure >= options.halfOpenTimeout) {
      circuit.state = CircuitState.OPEN;
      this.emitStateChange(circuit, CircuitState.OPEN);
      return true;
    }

    return circuit.state === CircuitState.OPEN;
  }

  private handleSuccess(providerId: string, circuit: any) {
    circuit.failures = 0;
    circuit.lastSuccessTime = new Date();
    circuit.state = CircuitState.CLOSED;
    this.emitStateChange(circuit, CircuitState.CLOSED);
  }

  private handleFailure(providerId: string, circuit: any, options: CircuitBreakerOptions) {
    circuit.failures++;
    circuit.lastFailureTime = new Date();

    if (circuit.failures >= options.failureThreshold) {
      circuit.state = CircuitState.OPEN;
      this.emitStateChange(circuit, CircuitState.OPEN);
      this.logger.error(`Circuit breaker OPENED for provider ${providerId} after ${circuit.failures} failures`);
    }
  }

  private emitStateChange(circuit: any, newState: CircuitState) {
    if (circuit.state !== newState) {
      this.eventEmitter.emit('circuit.state.change', {
        providerId: circuit.providerId,
        state: newState,
        timestamp: new Date(),
      });
    }
  }

  getCircuitState(providerId: string): CircuitState {
    return this.circuits.get(providerId)?.state || CircuitState.CLOSED;
  }

  getCircuitStats(providerId: string) {
    const circuit = this.circuits.get(providerId);
    if (!circuit) return null;

    return {
      state: circuit.state,
      failures: circuit.failures,
      lastFailureTime: circuit.lastFailureTime,
      lastSuccessTime: circuit.lastSuccessTime,
    };
  }
} 