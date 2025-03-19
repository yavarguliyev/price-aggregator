import { Module } from '@nestjs/common';
import { HttpModule as NestHttpModule } from '@nestjs/axios';
import { HttpClientService } from './http-client.service';
import { CommonModule } from '../modules/common.module';

@Module({
  imports: [
    NestHttpModule.register({
      timeout: 5000,
      maxRedirects: 5
    }),
    CommonModule
  ],
  providers: [HttpClientService],
  exports: [HttpClientService, NestHttpModule]
})
export class HttpModule {}
