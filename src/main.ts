import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Product Price Aggregator API')
    .setDescription('API for aggregating product prices from multiple providers')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  // Enable graceful shutdown
  app.enableShutdownHooks();
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  
  // Handle process termination signals
  const signals = ['SIGTERM', 'SIGINT'] as const;
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`Received ${signal}, starting graceful shutdown...`);
      await app.close();
      console.log('Application shutdown complete.');
      process.exit(0);
    });
  }
}
bootstrap();
