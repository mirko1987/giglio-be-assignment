import { DomainEvent } from './domain-event';
import { OrderStatus } from '../value-objects/order-status';

export class OrderStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly oldStatus: OrderStatus,
    public readonly newStatus: OrderStatus,
    public readonly userId?: string
  ) {
    super('OrderStatusChanged');
  }

  getAggregateId(): string {
    return this.orderId;
  }
}
