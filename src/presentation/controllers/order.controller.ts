import { 
  Controller, 
  Post, 
  Get, 
  Put,
  Param, 
  Body, 
  Query,
  HttpStatus, 
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
  Inject
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CreateOrderUseCase, CreateOrderRequest } from '../../application/use-cases/create-order.use-case';
import { UpdateOrderStatusUseCase, UpdateOrderStatusRequest } from '../../application/use-cases/update-order-status.use-case';
import { GetOrderUseCase, GetOrderRequest } from '../../application/use-cases/get-order.use-case';
import { ListOrdersUseCase, ListOrdersRequest } from '../../application/use-cases/list-orders.use-case';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { OrderResponseDto, OrderListResponseDto } from '../dto/order-response.dto';

@ApiTags('Orders')
@Controller('orders')
@UseInterceptors(ClassSerializerInterceptor)
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly listOrdersUseCase: ListOrdersUseCase
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Order created successfully',
    type: OrderResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request data' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Customer or product not found' 
  })
  createOrder(@Body() createOrderDto: CreateOrderDto): Observable<OrderResponseDto> {
    const request: CreateOrderRequest = {
      userId: createOrderDto.userId,
      items: createOrderDto.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: item.currency
      }))
    };

    return this.createOrderUseCase.execute(request).pipe(
      map(response => ({
        orderId: response.orderId,
        userId: response.userId,
        customerName: response.customerName,
        customerEmail: response.customerEmail,
        items: response.items,
        totalAmount: response.totalAmount,
        status: response.status,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      } as OrderResponseDto)),
      catchError(error => {
        throw new Error(`Failed to create order: ${error.message}`);
      })
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Order found',
    type: OrderResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Order not found' 
  })
  getOrder(@Param('id') id: string): Observable<OrderResponseDto> {
    const request: GetOrderRequest = { orderId: id };

    return this.getOrderUseCase.execute(request).pipe(
      map(response => ({
        orderId: response.orderId,
        userId: response.userId,
        customerName: response.customerName,
        customerEmail: response.customerEmail,
        items: response.items,
        totalAmount: response.totalAmount,
        status: response.status,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      } as OrderResponseDto)),
      catchError(error => {
        throw new Error(`Failed to get order: ${error.message}`);
      })
    );
  }

  @Get()
  @ApiOperation({ summary: 'List orders with optional filters' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of orders per page', example: 10 })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of orders to skip', example: 0 })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Orders retrieved successfully',
    type: OrderListResponseDto
  })
  listOrders(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Observable<OrderListResponseDto> {
    const request: ListOrdersRequest = {
      userId,
      status,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    };

    return this.listOrdersUseCase.execute(request).pipe(
      map(response => ({
        orders: response.orders,
        total: response.total,
        limit: response.limit,
        offset: response.offset
      } as OrderListResponseDto)),
      catchError(error => {
        throw new Error(`Failed to list orders: ${error.message}`);
      })
    );
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Order status updated successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid status transition' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Order not found' 
  })
  updateOrderStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto
  ): Observable<{ message: string; orderId: string; newStatus: string }> {
    const request: UpdateOrderStatusRequest = {
      orderId: id,
      newStatus: updateOrderStatusDto.newStatus
    };

    return this.updateOrderStatusUseCase.execute(request).pipe(
      map(response => ({
        message: 'Order status updated successfully',
        orderId: response.orderId,
        newStatus: response.status
      })),
      catchError(error => {
        throw new Error(`Failed to update order status: ${error.message}`);
      })
    );
  }
}

