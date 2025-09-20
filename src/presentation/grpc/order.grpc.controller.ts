import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable, map, catchError } from 'rxjs';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { OrderRepositoryPort } from '../../application/ports/order.repository.port';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { OrderStatus } from '../../domain/value-objects/order-status';

// gRPC Request/Response interfaces (based on proto definitions)
interface CreateOrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  currency: string;
}

interface CreateOrderRequest {
  user_id: string;
  items: CreateOrderItem[];
}

interface GetOrderRequest {
  id: string;
}

interface ListOrdersRequest {
  page?: number;
  limit?: number;
  user_id?: string;
  status?: string;
}

interface UpdateOrderStatusRequest {
  id: string;
  status: string;
}

interface CancelOrderRequest {
  id: string;
  reason?: string;
}

interface GetOrdersByUserRequest {
  user_id: string;
  page?: number;
  limit?: number;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  currency: string;
}

interface OrderResponse {
  order: {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    items: OrderItem[];
    status: string;
    total_amount: number;
    currency: string;
    created_at: string;
    updated_at: string;
  };
}

interface ListOrdersResponse {
  orders: Array<{
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    items: OrderItem[];
    status: string;
    total_amount: number;
    currency: string;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

@Controller()
export class OrderGrpcController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    @Inject('OrderRepositoryPort') private readonly orderRepository: OrderRepositoryPort,
  ) {}

  @GrpcMethod('OrderService', 'CreateOrder')
  createOrder(request: CreateOrderRequest): Observable<OrderResponse> {
    // This is the main business operation as required by the task
    return this.createOrderUseCase
      .execute({
        userId: request.user_id,
        items: request.items.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          currency: item.currency,
        })),
      })
      .pipe(
        map((response) => ({
          order: {
            id: response.orderId,
            user_id: response.userId,
            user_name: response.customerName, // Note: will be renamed in future
            user_email: response.customerEmail, // Note: will be renamed in future
            items: response.items.map((item) => ({
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              subtotal: item.subtotal,
              currency: item.currency,
            })),
            status: response.status,
            total_amount: response.totalAmount,
            currency: response.currency,
            created_at: response.createdAt.toISOString(),
            updated_at: response.updatedAt.toISOString(),
          },
        })),
        catchError((error) => {
          throw new RpcException({
            code: status.INVALID_ARGUMENT,
            message: error.message,
          });
        }),
      );
  }

  @GrpcMethod('OrderService', 'GetOrder')
  getOrder(request: GetOrderRequest): Observable<OrderResponse> {
    return this.getOrderUseCase.execute({ orderId: request.id }).pipe(
      map((response) => {
        if (!response) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `Order with ID ${request.id} not found`,
          });
        }
        return {
          order: {
            id: response.orderId,
            user_id: response.userId,
            user_name: response.customerName,
            user_email: response.customerEmail,
            items: response.items.map((item) => ({
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              subtotal: item.subtotal,
              currency: item.currency,
            })),
            status: response.status,
            total_amount: response.totalAmount,
            currency: response.currency,
            created_at: response.createdAt.toISOString(),
            updated_at: response.updatedAt.toISOString(),
          },
        };
      }),
      catchError((error) => {
        throw new RpcException({
          code: status.INTERNAL,
          message: error.message,
        });
      }),
    );
  }

  @GrpcMethod('OrderService', 'ListOrders')
  listOrders(request: ListOrdersRequest): Observable<ListOrdersResponse> {
    const page = request.page || 1;
    const limit = request.limit || 10;

    return this.listOrdersUseCase
      .execute({
        userId: request.user_id,
        status: request.status,
        limit: limit,
        offset: (page - 1) * limit,
      })
      .pipe(
        map((response) => ({
          orders: response.orders.map((order) => ({
            id: order.orderId,
            user_id: order.userId,
            user_name: order.customerName,
            user_email: order.customerEmail,
            items: order.items.map((item) => ({
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              subtotal: item.subtotal,
              currency: item.currency,
            })),
            status: order.status,
            total_amount: order.totalAmount,
            currency: order.currency,
            created_at: order.createdAt.toISOString(),
            updated_at: order.updatedAt.toISOString(),
          })),
          total: response.total,
          page: page,
          limit: limit,
        })),
        catchError((error) => {
          throw new RpcException({
            code: status.INTERNAL,
            message: error.message,
          });
        }),
      );
  }

  @GrpcMethod('OrderService', 'UpdateOrderStatus')
  updateOrderStatus(request: UpdateOrderStatusRequest): Observable<OrderResponse> {
    return this.updateOrderStatusUseCase
      .execute({
        orderId: request.id,
        newStatus: request.status,
      })
      .pipe(
        map((response) => ({
          order: {
            id: response.orderId,
            user_id: response.userId,
            user_name: response.customerName,
            user_email: response.customerEmail,
            items: response.items.map((item) => ({
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              subtotal: item.subtotal,
              currency: item.currency,
            })),
            status: response.status,
            total_amount: response.totalAmount,
            currency: response.currency,
            created_at: response.createdAt.toISOString(),
            updated_at: response.updatedAt.toISOString(),
          },
        })),
        catchError((error) => {
          throw new RpcException({
            code: status.INVALID_ARGUMENT,
            message: error.message,
          });
        }),
      );
  }

  @GrpcMethod('OrderService', 'CancelOrder')
  cancelOrder(request: CancelOrderRequest): Observable<OrderResponse> {
    return this.updateOrderStatusUseCase
      .execute({
        orderId: request.id,
        newStatus: OrderStatus.CANCELLED,
      })
      .pipe(
        map((response) => ({
          order: {
            id: response.orderId,
            user_id: response.userId,
            user_name: response.customerName,
            user_email: response.customerEmail,
            items: response.items.map((item) => ({
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              subtotal: item.subtotal,
              currency: item.currency,
            })),
            status: response.status,
            total_amount: response.totalAmount,
            currency: response.currency,
            created_at: response.createdAt.toISOString(),
            updated_at: response.updatedAt.toISOString(),
          },
        })),
        catchError((error) => {
          throw new RpcException({
            code: status.INVALID_ARGUMENT,
            message: error.message,
          });
        }),
      );
  }

  @GrpcMethod('OrderService', 'GetOrdersByUser')
  getOrdersByUser(request: GetOrdersByUserRequest): Observable<ListOrdersResponse> {
    const page = request.page || 1;
    const limit = request.limit || 10;

    return this.listOrdersUseCase
      .execute({
        userId: request.user_id,
        limit: limit,
        offset: (page - 1) * limit,
      })
      .pipe(
        map((response) => ({
          orders: response.orders.map((order) => ({
            id: order.orderId,
            user_id: order.userId,
            user_name: order.customerName,
            user_email: order.customerEmail,
            items: order.items.map((item) => ({
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              subtotal: item.subtotal,
              currency: item.currency,
            })),
            status: order.status,
            total_amount: order.totalAmount,
            currency: order.currency,
            created_at: order.createdAt.toISOString(),
            updated_at: order.updatedAt.toISOString(),
          })),
          total: response.total,
          page: page,
          limit: limit,
        })),
        catchError((error) => {
          throw new RpcException({
            code: status.INTERNAL,
            message: error.message,
          });
        }),
      );
  }
}
