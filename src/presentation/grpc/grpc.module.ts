import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import ORM entities
import { UserOrmEntity } from '../../infrastructure/database/entities/user.orm-entity';
import { ProductOrmEntity } from '../../infrastructure/database/entities/product.orm-entity';
import { OrderOrmEntity } from '../../infrastructure/database/entities/order.orm-entity';
import { OrderItemOrmEntity } from '../../infrastructure/database/entities/order-item.orm-entity';

// Import gRPC controllers
import { UserGrpcController } from './user.grpc.controller';
import { ProductGrpcController } from './product.grpc.controller';
import { OrderGrpcController } from './order.grpc.controller';

// Import repository adapters
import { UserRepositoryAdapter } from '../../infrastructure/repositories/user.repository.adapter';
import { ProductRepositoryAdapter } from '../../infrastructure/repositories/product.repository.adapter';
import { OrderRepositoryAdapter } from '../../infrastructure/repositories/order.repository.adapter';

// Import use cases
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';

// Import infrastructure services
import { EventPublisherAdapter } from '../../infrastructure/services/event-publisher.adapter';
import { NotificationAdapter } from '../../infrastructure/services/notification.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity, ProductOrmEntity, OrderOrmEntity, OrderItemOrmEntity]),
  ],
  controllers: [UserGrpcController, ProductGrpcController, OrderGrpcController],
  providers: [
    // Repository providers
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepositoryAdapter,
    },
    {
      provide: 'ProductRepositoryPort',
      useClass: ProductRepositoryAdapter,
    },
    {
      provide: 'OrderRepositoryPort',
      useClass: OrderRepositoryAdapter,
    },

    // Service providers
    {
      provide: 'EventPublisherPort',
      useClass: EventPublisherAdapter,
    },
    {
      provide: 'NotificationPort',
      useClass: NotificationAdapter,
    },

    // Use case providers
    CreateUserUseCase,
    CreateProductUseCase,
    CreateOrderUseCase,
    GetOrderUseCase,
    ListOrdersUseCase,
    UpdateOrderStatusUseCase,
  ],
})
export class GrpcModule {}
