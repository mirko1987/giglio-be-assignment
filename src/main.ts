import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { grpcConfig } from './presentation/grpc/grpc.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('NestJS Order System API')
    .setDescription('A comprehensive order management system built with NestJS, Hexagonal Architecture, SOLID principles, and RxJS')
    .setVersion('1.0')
    .addTag('orders', 'Order management operations')
    .addTag('users', 'User management operations')
    .addTag('products', 'Product management operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Configure hybrid application (HTTP + gRPC)
  app.connectMicroservice(grpcConfig);
  
  const port = process.env.PORT || 3000;
  const grpcPort = process.env.GRPC_PORT || 5001;
  
  // Start both HTTP and gRPC servers
  await app.startAllMicroservices();
  await app.listen(port);
  
  console.log(`🚀 HTTP Server is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔧 gRPC Server is running on: localhost:${grpcPort}`);
}

bootstrap();

