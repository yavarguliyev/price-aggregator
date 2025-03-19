import { Module } from "@nestjs/common";
import { CircuitBreakerService } from "./circuit-breaker.service";
import { RetryConfig } from "./retry.config";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [CircuitBreakerService, RetryConfig],
  exports: [CircuitBreakerService, RetryConfig, HttpModule],
})
export class ResilienceModule {}
