import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from '../controllers/order.controller';
import { OrderOrmEntity } from '../../infrastructure/database/entities/order.orm-entity';
import { OrderItemOrmEntity } from '../../infrastructure/database/entities/order-item.orm-entity';
import { UserOrmEntity } from '../../infrastructure/database/entities/user.orm-entity';
import { ProductOrmEntity } from '../../infrastructure/database/entities/product.orm-entity';
import { OrderRepositoryAdapter } from '../../infrastructure/repositories/order.repository.adapter';
import { UserRepositoryAdapter } from '../../infrastructure/repositories/user.repository.adapter';
import { ProductRepositoryAdapter } from '../../infrastructure/repositories/product.repository.adapter';
import { EventPublisherAdapter } from '../../infrastructure/services/event-publisher.adapter';
import { NotificationAdapter } from '../../infrastructure/services/notification.adapter';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderOrmEntity, OrderItemOrmEntity, UserOrmEntity, ProductOrmEntity]),
  ],
  controllers: [OrderController],
  providers: [
    // Repositories
    {
      provide: 'OrderRepositoryPort',
      useClass: OrderRepositoryAdapter,
    },
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepositoryAdapter,
    },
    {
      provide: 'ProductRepositoryPort',
      useClass: ProductRepositoryAdapter,
    },
    // Services
    {
      provide: 'EventPublisherPort',
      useClass: EventPublisherAdapter,
    },
    {
      provide: 'NotificationPort',
      useClass: NotificationAdapter,
    },
    // Use Cases
    CreateOrderUseCase,
    UpdateOrderStatusUseCase,
    GetOrderUseCase,
    ListOrdersUseCase,
  ],
  exports: ['OrderRepositoryPort'],
})
export class OrderModule {}
