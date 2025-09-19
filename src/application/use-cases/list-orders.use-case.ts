import { Injectable, Inject } from '@nestjs/common';
import { Observable, switchMap, of } from 'rxjs';
import { Order } from '../../domain/entities/order.entity';
import { OrderRepositoryPort } from '../ports/order.repository.port';

export interface ListOrdersRequest {
  userId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface ListOrdersResponse {
  orders: {
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
  }[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject('OrderRepositoryPort') private readonly orderRepository: OrderRepositoryPort
  ) {}

  execute(request: ListOrdersRequest = {}): Observable<ListOrdersResponse> {
    const { userId, status, limit = 10, offset = 0 } = request;

    if (userId) {
      return this.getOrdersByUser(userId, limit, offset);
    }

    if (status) {
      return this.getOrdersByStatus(status, limit, offset);
    }

    return this.getAllOrders(limit, offset);
  }

  private getOrdersByUser(userId: string, limit: number, offset: number): Observable<ListOrdersResponse> {
    return this.orderRepository.findByUserId(userId).pipe(
      switchMap(orders => {
        const paginatedOrders = orders.slice(offset, offset + limit);
        return of({
          orders: paginatedOrders.map(order => this.mapToSummary(order)),
          total: orders.length,
          limit,
          offset
        });
      })
    );
  }

  private getOrdersByStatus(status: string, limit: number, offset: number): Observable<ListOrdersResponse> {
    return this.orderRepository.findByStatus(status).pipe(
      switchMap(orders => {
        const paginatedOrders = orders.slice(offset, offset + limit);
        return of({
          orders: paginatedOrders.map(order => this.mapToSummary(order)),
          total: orders.length,
          limit,
          offset
        });
      })
    );
  }

  private getAllOrders(limit: number, offset: number): Observable<ListOrdersResponse> {
    return this.orderRepository.findAll().pipe(
      switchMap(orders => {
        const paginatedOrders = orders.slice(offset, offset + limit);
        return of({
          orders: paginatedOrders.map(order => this.mapToSummary(order)),
          total: orders.length,
          limit,
          offset
        });
      })
    );
  }

  private mapToSummary(order: Order) {
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

