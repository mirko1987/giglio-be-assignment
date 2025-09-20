import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrderModule } from './presentation/modules/order.module';
import { UserModule } from './presentation/modules/user.module';
import { ProductModule } from './presentation/modules/product.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { GrpcModule } from './presentation/grpc/grpc.module';
import { HealthModule } from './infrastructure/health/health.module';
import { OrderCreatedHandler } from './infrastructure/event-handlers/order-created.handler';
import { OrderStatusChangedHandler } from './infrastructure/event-handlers/order-status-changed.handler';
import { OrderProcessingService } from './application/services/order-processing.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    DatabaseModule,
    OrderModule,
    UserModule,
    ProductModule,
    GrpcModule,
    HealthModule,
  ],
  providers: [OrderCreatedHandler, OrderStatusChangedHandler, OrderProcessingService],
})
export class AppModule {}
