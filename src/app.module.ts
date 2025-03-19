import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProviderSimulatorModule } from './provider-simulator/provider-simulator.module';
import { AggregatorModule } from './aggregator/aggregator.module';

@Module({
  imports: [PrismaModule, ProviderSimulatorModule, AggregatorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
