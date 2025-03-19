import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Apply global pipes for validation
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  
  // Apply security middleware
  app.use(helmet());

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Price Aggregator API')
    .setDescription('API for aggregating product prices from multiple providers')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'X-API-KEY', in: 'header' }, 'api-key')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  
  // Enable CORS
  app.enableCors();
  
  // Set API prefix
  app.setGlobalPrefix('api');
  
  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
