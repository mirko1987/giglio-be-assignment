import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { testDatabaseConfig } from './test-database.config';

// Import all the modules from the main app
import { UserModule } from '../src/presentation/modules/user.module';
import { ProductModule } from '../src/presentation/modules/product.module';
import { OrderModule } from '../src/presentation/modules/order.module';
import { GrpcModule } from '../src/presentation/grpc/grpc.module';
import { HealthModule } from '../src/infrastructure/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
      load: [
        () => ({
          // Override gRPC port for E2E tests to avoid conflicts
          GRPC_PORT: 5002,
          PORT: 3001, // Also use different HTTP port for E2E
        }),
      ],
    }),
    TypeOrmModule.forRoot(testDatabaseConfig), // Use SQLite for tests
    EventEmitterModule.forRoot(),
    UserModule,
    ProductModule,
    OrderModule,
    GrpcModule,
    HealthModule,
  ],
})
export class TestGrpcAppModule {}
