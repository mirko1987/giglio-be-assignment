import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserOrmEntity } from '../src/infrastructure/database/entities/user.orm-entity';
import { ProductOrmEntity } from '../src/infrastructure/database/entities/product.orm-entity';
import { OrderOrmEntity } from '../src/infrastructure/database/entities/order.orm-entity';
import { OrderItemOrmEntity } from '../src/infrastructure/database/entities/order-item.orm-entity';

export const testDatabaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: [UserOrmEntity, ProductOrmEntity, OrderOrmEntity, OrderItemOrmEntity],
  synchronize: true,
  logging: false,
  dropSchema: true,
};
