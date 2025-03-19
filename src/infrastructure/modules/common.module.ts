import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CircuitBreakerService } from '../resilience/circuit-breaker.service';
import { RetryService } from '../resilience/retry.service';
import { LoggerService } from '../services/logger.service';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false
    })
  ],
  providers: [CircuitBreakerService, RetryService, LoggerService],
  exports: [CircuitBreakerService, RetryService, LoggerService]
})
export class CommonModule {}
