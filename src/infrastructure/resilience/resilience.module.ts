import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CircuitBreakerService } from './circuit-breaker.service';
import { RetryConfig } from './retry.config';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 5000),
        maxRedirects: configService.get<number>('HTTP_MAX_REDIRECTS', 5)
      })
    })
  ],
  providers: [CircuitBreakerService, RetryConfig],
  exports: [CircuitBreakerService, RetryConfig, HttpModule]
})
export class ResilienceModule {}
