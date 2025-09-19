import { Order } from '../../domain/entities/order.entity';
import { OrderOrmEntity } from '../database/entities/order.orm-entity';
import { UserMapper } from './user.mapper';
import { OrderItemMapper } from './order-item.mapper';
import { OrderStatus, OrderStatusVO } from '../../domain/value-objects/order-status';

export class OrderMapper {
  static toOrmEntity(order: Order): OrderOrmEntity {
    const orderOrm = new OrderOrmEntity();
    orderOrm.id = order.id;
    orderOrm.userId = order.user.id;
    orderOrm.status = order.status.toString();
    orderOrm.totalAmount = order.getTotalAmount().amount;
    orderOrm.currency = order.getTotalAmount().currency;
    orderOrm.createdAt = order.createdAt;
    orderOrm.updatedAt = order.updatedAt;
    orderOrm.user = UserMapper.toOrmEntity(order.user);
    orderOrm.items = order.items.map(item => OrderItemMapper.toOrmEntity(item, order.id));
    return orderOrm;
  }

  static toDomainEntity(orderOrm: OrderOrmEntity): Order {
    const user = UserMapper.toDomainEntity(orderOrm.user);
    const items = orderOrm.items.map(itemOrm => OrderItemMapper.toDomainEntity(itemOrm));
    const statusEnum = OrderStatus[orderOrm.status as keyof typeof OrderStatus];
    const status = new OrderStatusVO(statusEnum);

    return new Order(
      orderOrm.id,
      user,
      items,
      status,
      orderOrm.createdAt,
      orderOrm.updatedAt
    );
  }
}

