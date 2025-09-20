import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createGrpcConfig } from './presentation/grpc/grpc.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    // Create application with enhanced logging
    const app = await NestFactory.create(AppModule, {
      logger: process.env.NODE_ENV === 'production' 
        ? ['error', 'warn', 'log'] 
        : ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Get ConfigService for environment-based configuration
    const configService = app.get(ConfigService);

    // Global exception filter for centralized error handling
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Global logging interceptor for request/response logging
    app.useGlobalInterceptors(new LoggingInterceptor());

    // Global validation pipe with enhanced error messages
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        disableErrorMessages: process.env.NODE_ENV === 'production',
        exceptionFactory: (errors) => {
          logger.debug('Validation errors:', errors);
          return errors;
        },
      }),
    );

    // CORS configuration with environment variables
    const corsOrigin = configService.get('CORS_ORIGIN') || '*';
    app.enableCors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
      credentials: true,
    });

    // Swagger documentation (disabled in production for security)
    if (process.env.NODE_ENV !== 'production') {
      const swaggerConfig = new DocumentBuilder()
        .setTitle('NestJS Order System API')
        .setDescription(
          'A comprehensive order management system built with NestJS, Hexagonal Architecture, SOLID principles, and RxJS',
        )
        .setVersion('1.0')
        .addTag('orders', 'Order management operations')
        .addTag('users', 'User management operations')
        .addTag('products', 'Product management operations')
        .addTag('health', 'Health monitoring endpoints')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, swaggerConfig);
      SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
          tagsSorter: 'alpha',
          operationsSorter: 'alpha',
        },
      });

      logger.log('📚 Swagger documentation enabled at /api/docs');
    }

    // Configure hybrid application (HTTP + gRPC) with environment variables
    const grpcConfig = createGrpcConfig();
    app.connectMicroservice(grpcConfig);

    // Environment-based configuration
    const port = configService.get('PORT') || 3000;
    const grpcPort = configService.get('GRPC_PORT') || 5001;
    const nodeEnv = configService.get('NODE_ENV') || 'development';

    // Graceful shutdown handlers
    setupGracefulShutdown(app, logger);

    // Start both HTTP and gRPC servers
    logger.log('🚀 Starting microservices...');
    await app.startAllMicroservices();
    
    logger.log('🌐 Starting HTTP server...');
    await app.listen(port);

    // Enhanced startup logging
    logger.log('🎉 Application started successfully!');
    logger.log(`🚀 HTTP Server: http://localhost:${port}`);
    logger.log(`🔧 gRPC Server: localhost:${grpcPort}`);
    logger.log(`🏥 Health Check: http://localhost:${port}/health`);
    logger.log(`📊 Environment: ${nodeEnv}`);
    
    if (process.env.NODE_ENV !== 'production') {
      logger.log(`📚 API Docs: http://localhost:${port}/api/docs`);
    }

    // Log system information
    logger.log(`💻 Node.js: ${process.version}`);
    logger.log(`🔧 Platform: ${process.platform} ${process.arch}`);
    logger.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);

  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers for production
 */
function setupGracefulShutdown(app: any, logger: Logger) {
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
  
  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.log(`🛑 Received ${signal}, starting graceful shutdown...`);
      
      try {
        // Set a timeout for forceful shutdown
        const shutdownTimeout = setTimeout(() => {
          logger.error('⏰ Shutdown timeout reached, forcing exit');
          process.exit(1);
        }, 10000); // 10 seconds timeout

        // Close HTTP server
        logger.log('🌐 Closing HTTP server...');
        await app.close();

        // Clear timeout
        clearTimeout(shutdownTimeout);
        
        logger.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('💥 Uncaught Exception:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('🚫 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

bootstrap();
