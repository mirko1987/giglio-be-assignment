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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    TypeOrmModule.forRoot(testDatabaseConfig),
    EventEmitterModule.forRoot(),
    UserModule,
    ProductModule,
    OrderModule,
    GrpcModule,
  ],
})
export class TestAppModule {}
