import { Injectable, Inject } from '@nestjs/common';
import { Observable, of, throwError, switchMap, tap, forkJoin } from 'rxjs';
import { Order } from '../../domain/entities/order.entity';
import { User } from '../../domain/entities/user.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderRepositoryPort } from '../ports/order.repository.port';
import { UserRepositoryPort } from '../ports/user.repository.port';
import { ProductRepositoryPort } from '../ports/product.repository.port';
import { EventPublisherPort } from '../ports/event-publisher.port';
import { NotificationPort } from '../ports/notification.port';
import { Money } from '../../domain/value-objects/money';

export interface CreateOrderRequest {
  userId: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    currency: string;
  }[];
}

export interface CreateOrderResponse {
  orderId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    currency: string;
  }[];
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject('OrderRepositoryPort') private readonly orderRepository: OrderRepositoryPort,
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
    @Inject('ProductRepositoryPort') private readonly productRepository: ProductRepositoryPort,
    @Inject('EventPublisherPort') private readonly eventPublisher: EventPublisherPort,
    @Inject('NotificationPort') private readonly notificationService: NotificationPort,
  ) {}

  execute(request: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.validateUser(request.userId).pipe(
      switchMap((_user) => this.validateAndCreateOrderItems(request.items)),
      switchMap((orderItems) => this.createOrder(request.userId, orderItems)),
      switchMap((order) => this.saveOrder(order)),
      switchMap((order) => this.publishEvents(order)),
      switchMap((order) => this.sendNotification(order)),
      switchMap((order) => of(this.mapToResponse(order))),
    );
  }

  private validateUser(userId: string): Observable<User> {
    return this.userRepository.findById(userId).pipe(
      switchMap((user) => {
        if (!user) {
          return throwError(() => new Error(`User with ID ${userId} not found`));
        }
        return of(user);
      }),
    );
  }

  private validateAndCreateOrderItems(items: CreateOrderRequest['items']): Observable<OrderItem[]> {
    if (!items || items.length === 0) {
      return throwError(() => new Error('Order must have at least one item'));
    }

    const orderItems$ = items.map((item) =>
      this.productRepository.findById(item.productId).pipe(
        switchMap((product) => {
          if (!product) {
            return throwError(() => new Error(`Product with ID ${item.productId} not found`));
          }

          if (!product.hasStock(item.quantity)) {
            return throwError(
              () =>
                new Error(
                  `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
                ),
            );
          }

          const unitPrice = new Money(item.unitPrice, item.currency);
          const orderItem = OrderItem.create(product, item.quantity, unitPrice);
          return of(orderItem);
        }),
      ),
    );

    return forkJoin(orderItems$);
  }

  private createOrder(userId: string, orderItems: OrderItem[]): Observable<Order> {
    return this.userRepository.findById(userId).pipe(
      switchMap((user) => {
        if (!user) {
          return throwError(() => new Error(`User with ID ${userId} not found`));
        }
        const order = Order.create(user, orderItems);
        return of(order);
      }),
    );
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
      switchMap(() => of(order)),
    );
  }

  private sendNotification(order: Order): Observable<Order> {
    return this.notificationService
      .sendOrderConfirmation(order.user.email.value, order.id)
      .pipe(switchMap(() => of(order)));
  }

  private mapToResponse(order: Order): CreateOrderResponse {
    return {
      orderId: order.id,
      userId: order.user.id,
      customerName: order.user.name,
      customerEmail: order.user.email.value,
      items: order.items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount,
        subtotal: item.getSubtotal().amount,
        currency: item.unitPrice.currency,
      })),
      totalAmount: order.getTotalAmount().amount,
      currency: order.getTotalAmount().currency,
      status: order.status.toString(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
