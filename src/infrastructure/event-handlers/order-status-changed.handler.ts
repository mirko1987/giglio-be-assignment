import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderStatusChangedEvent } from '../../domain/events/order-status-changed.event';

@Injectable()
export class OrderStatusChangedHandler {
  private readonly logger = new Logger(OrderStatusChangedHandler.name);

  @OnEvent('OrderStatusChanged')
  handleOrderStatusChanged(event: OrderStatusChangedEvent): void {
    try {
      this.logger.log(`Handling OrderStatusChanged event for order: ${event.orderId}`);
      this.logger.log(`Order status changed: ${event.orderId}`);
      this.logger.log(`From: ${event.oldStatus} to: ${event.newStatus}`);
      
      // Here you could add additional business logic like:
      // - Update inventory when order is cancelled
      // - Trigger shipping notifications when order is shipped
      // - Update analytics and reporting
      // - Send webhook notifications to external systems
      
      this.handleSpecificStatusChanges(event);
    } catch (error) {
      this.logger.error(`Error handling OrderStatusChanged event: ${error.message}`, error);
      throw error;
    }
  }

  private handleSpecificStatusChanges(event: OrderStatusChangedEvent): void {
    switch (event.newStatus) {
      case 'SHIPPED':
        this.logger.log(`Order ${event.orderId} has been shipped - triggering shipping notifications`);
        break;
      case 'DELIVERED':
        this.logger.log(`Order ${event.orderId} has been delivered - triggering delivery confirmations`);
        break;
      case 'CANCELLED':
        this.logger.log(`Order ${event.orderId} has been cancelled - updating inventory`);
        break;
      case 'DELIVERED':
        this.logger.log(`Order ${event.orderId} has been completed - triggering completion workflows`);
        break;
      default:
        this.logger.log(`Order ${event.orderId} status changed to ${event.newStatus}`);
    }
  }
}

