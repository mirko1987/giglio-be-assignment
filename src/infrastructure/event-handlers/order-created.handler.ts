import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../../domain/events/order-created.event';

@Injectable()
export class OrderCreatedHandler {
  private readonly logger = new Logger(OrderCreatedHandler.name);

  @OnEvent('OrderCreated')
  handleOrderCreated(event: OrderCreatedEvent): void {
    try {
      this.logger.log(`Handling OrderCreated event for order: ${event.orderId}`);
      this.logger.log(`Order created successfully: ${event.orderId}`);
      this.logger.log(`Customer: ${event.customerId}`);
      this.logger.log(`Total Amount: ${event.totalAmount.toString()}`);

      // Here you could add additional business logic like:
      // - Update inventory
      // - Send analytics events
      // - Trigger other domain events
      // - Update reporting systems
    } catch (error) {
      this.logger.error(`Error handling OrderCreated event: ${error.message}`, error);
      throw error;
    }
  }
}
