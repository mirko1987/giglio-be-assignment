import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderOrmEntity } from './entities/order.orm-entity';
import { OrderItemOrmEntity } from './entities/order-item.orm-entity';
import { UserOrmEntity } from './entities/user.orm-entity';
import { ProductOrmEntity } from './entities/product.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'nestjs'),
        password: configService.get<string>('DB_PASSWORD', 'nestjs123'),
        database: configService.get<string>('DB_DATABASE', 'order_system'),
        entities: [OrderOrmEntity, OrderItemOrmEntity, UserOrmEntity, ProductOrmEntity],
        synchronize: configService.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
        logging: configService.get<string>('DB_LOGGING', 'true') === 'true',
        charset: 'utf8mb4',
        timezone: 'Z',
        extra: {
          connectionLimit: 10,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      OrderOrmEntity,
      OrderItemOrmEntity,
      UserOrmEntity,
      ProductOrmEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

