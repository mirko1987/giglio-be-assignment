import { Injectable, Inject } from '@nestjs/common';
import { Observable, of, throwError, switchMap, tap } from 'rxjs';
import { Order } from '../../domain/entities/order.entity';
import { OrderStatus, OrderStatusVO } from '../../domain/value-objects/order-status';
import { OrderRepositoryPort } from '../ports/order.repository.port';
import { EventPublisherPort } from '../ports/event-publisher.port';
import { NotificationPort } from '../ports/notification.port';

export interface UpdateOrderStatusRequest {
  orderId: string;
  newStatus: OrderStatus | string;
}

export interface UpdateOrderStatusResponse {
  orderId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
    currency: string;
  }[];
  status: string;
  totalAmount: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject('OrderRepositoryPort') private readonly orderRepository: OrderRepositoryPort,
    @Inject('EventPublisherPort') private readonly eventPublisher: EventPublisherPort,
    @Inject('NotificationPort') private readonly notificationService: NotificationPort
  ) {}

  execute(request: UpdateOrderStatusRequest): Observable<UpdateOrderStatusResponse> {
    return this.findOrder(request.orderId).pipe(
      switchMap(order => of(order)), // Status validation is handled in domain entity
      switchMap(order => this.updateOrderStatus(order, typeof request.newStatus === 'string' ? OrderStatus[request.newStatus as keyof typeof OrderStatus] : request.newStatus)),
      switchMap(order => this.saveOrder(order)),
      switchMap(order => this.publishEvents(order)),
      switchMap(order => this.sendNotification(order)),
      switchMap(order => of(this.mapToResponse(order, request.newStatus)))
    );
  }

  private findOrder(orderId: string): Observable<Order> {
    return this.orderRepository.findById(orderId).pipe(
      switchMap(order => {
        if (!order) {
          return throwError(() => new Error(`Order with ID ${orderId} not found`));
        }
        return of(order);
      })
    );
  }

  private validateStatusTransition(order: Order, newStatus: OrderStatus): Observable<Order> {
    const currentStatus = order.status;
    
    if (!currentStatus.canTransitionTo(newStatus)) {
      return throwError(() => 
        new Error(`Cannot transition order ${order.id} from ${order.status} to ${newStatus}`)
      );
    }

    return of(order);
  }

  private updateOrderStatus(order: Order, newStatus: OrderStatus): Observable<Order> {
    try {
      order.changeStatus(newStatus);
      return of(order);
    } catch (error) {
      return throwError(() => error);
    }
  }

  private saveOrder(order: Order): Observable<Order> {
    return this.orderRepository.save(order);
  }

  private publishEvents(order: Order): Observable<Order> {
    const events = order.domainEvents;
    if (events.length === 0) {
      return of(order);
    }

    return this.eventPublisher.publishMany(events).pipe(
      tap(() => order.clearDomainEvents()),
      switchMap(() => of(order))
    );
  }

  private sendNotification(order: Order): Observable<Order> {
    return this.notificationService.sendOrderStatusUpdate(
      order.user.email.value,
      order.id,
      order.status.toString()
    ).pipe(
      switchMap(() => of(order))
    );
  }

  private mapToResponse(order: Order, newStatus: OrderStatus | string): UpdateOrderStatusResponse {
    return {
      orderId: order.id,
      userId: order.user.id,
      customerName: order.user.name,
      customerEmail: order.user.email.value,
      items: order.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        subtotal: item.getSubtotal().toString(),
        currency: item.unitPrice.currency
      })),
      status: order.status.toString(),
      totalAmount: order.getTotalAmount().toString(),
      currency: order.getTotalAmount().currency,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }
}
