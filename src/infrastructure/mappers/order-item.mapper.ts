import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderItemOrmEntity } from '../database/entities/order-item.orm-entity';
import { ProductMapper } from './product.mapper';
import { Money } from '../../domain/value-objects/money';

export class OrderItemMapper {
  static toOrmEntity(orderItem: OrderItem, orderId: string): OrderItemOrmEntity {
    const orderItemOrm = new OrderItemOrmEntity();
    orderItemOrm.id = orderItem.id;
    orderItemOrm.orderId = orderId;
    orderItemOrm.productId = orderItem.product.id;
    orderItemOrm.quantity = orderItem.quantity;
    orderItemOrm.unitPrice = orderItem.unitPrice.amount;
    orderItemOrm.currency = orderItem.unitPrice.currency;
    return orderItemOrm;
  }

  static toDomainEntity(orderItemOrm: OrderItemOrmEntity): OrderItem {
    const product = ProductMapper.toDomainEntity(orderItemOrm.product);
    const unitPrice = new Money(orderItemOrm.unitPrice, orderItemOrm.currency);

    return new OrderItem(
      orderItemOrm.id,
      product,
      orderItemOrm.quantity,
      unitPrice
    );
  }
}

