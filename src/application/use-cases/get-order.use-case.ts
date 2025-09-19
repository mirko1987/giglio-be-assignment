import { Injectable, Inject } from '@nestjs/common';
import { Observable, of, throwError, switchMap } from 'rxjs';
import { Order } from '../../domain/entities/order.entity';
import { OrderRepositoryPort } from '../ports/order.repository.port';

export interface GetOrderRequest {
  orderId: string;
}

export interface GetOrderResponse {
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
  totalAmount: string;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject('OrderRepositoryPort') private readonly orderRepository: OrderRepositoryPort
  ) {}

  execute(request: GetOrderRequest): Observable<GetOrderResponse> {
    return this.findOrder(request.orderId).pipe(
      switchMap(order => of(this.mapToResponse(order)))
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

  private mapToResponse(order: Order): GetOrderResponse {
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
      totalAmount: order.getTotalAmount().toString(),
      currency: order.getTotalAmount().currency,
      status: order.status.toString(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }
}

