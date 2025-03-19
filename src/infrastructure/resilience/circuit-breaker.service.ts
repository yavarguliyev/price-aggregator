import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenTimeout: number;
}

interface CircuitBreakerState {
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failures: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits: Map<string, CircuitBreakerState> = new Map();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async execute<T>(
    providerId: string,
    operation: () => Promise<T>,
    options: CircuitBreakerOptions = {
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenTimeout: 30000,
    },
  ): Promise<T> {
    const circuit = this.getOrCreateCircuit(providerId);

    if (this.isCircuitOpen(circuit, options, providerId)) {
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

  private getOrCreateCircuit(providerId: string): CircuitBreakerState {
    if (!this.circuits.has(providerId)) {
      this.circuits.set(providerId, { state: "CLOSED", failures: 0 });
    }

    return this.circuits.get(providerId)!;
  }

  private isCircuitOpen(
    circuit: CircuitBreakerState,
    options: CircuitBreakerOptions,
    providerId: string,
  ): boolean {
    if (circuit.state === "CLOSED") {
      return false;
    }

    const now = new Date();
    const timeSinceLastFailure =
      now.getTime() - (circuit.lastFailureTime?.getTime() || 0);

    if (
      circuit.state === "OPEN" &&
      timeSinceLastFailure >= options.resetTimeout
    ) {
      circuit.state = "HALF_OPEN";
      this.emitStateChange(circuit, "HALF_OPEN", providerId);
      return false;
    }

    if (
      circuit.state === "HALF_OPEN" &&
      timeSinceLastFailure >= options.halfOpenTimeout
    ) {
      circuit.state = "OPEN";
      this.emitStateChange(circuit, "OPEN", providerId);
      return true;
    }

    return circuit.state === "OPEN";
  }

  private handleSuccess(providerId: string, circuit: CircuitBreakerState) {
    circuit.failures = 0;
    circuit.lastSuccessTime = new Date();
    circuit.state = "CLOSED";
    this.emitStateChange(circuit, "CLOSED", providerId);
  }

  private handleFailure(
    providerId: string,
    circuit: CircuitBreakerState,
    options: CircuitBreakerOptions,
  ) {
    circuit.failures++;
    circuit.lastFailureTime = new Date();

    if (circuit.failures >= options.failureThreshold) {
      circuit.state = "OPEN";
      this.emitStateChange(circuit, "OPEN", providerId);
      this.logger.error(
        `Circuit breaker OPENED for provider ${providerId} after ${circuit.failures} failures`,
      );
    }
  }

  private emitStateChange(
    circuit: CircuitBreakerState,
    newState: "CLOSED" | "OPEN" | "HALF_OPEN",
    providerId: string,
  ) {
    if (circuit.state !== newState) {
      this.eventEmitter.emit("circuit.state.change", {
        providerId,
        state: newState,
        timestamp: new Date(),
      });
    }
  }

  getCircuitState(providerId: string): "CLOSED" | "OPEN" | "HALF_OPEN" {
    return this.circuits.get(providerId)?.state || "CLOSED";
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

  private getOrCreateState(providerId: string): CircuitBreakerState {
    if (!this.circuits.has(providerId)) {
      this.circuits.set(providerId, {
        state: "CLOSED",
        failures: 0,
      });
    }

    return this.circuits.get(providerId)!;
  }

  getState(providerId: string): CircuitBreakerState {
    return this.getOrCreateState(providerId);
  }
}
