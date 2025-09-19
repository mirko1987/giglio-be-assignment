import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Product name' })
  productName: string;

  @ApiProperty({ description: 'Quantity' })
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  unitPrice: string;

  @ApiProperty({ description: 'Subtotal' })
  subtotal: string;
}

export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ description: 'Customer ID' })
  userId: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Customer email' })
  customerEmail: string;

  @ApiProperty({ description: 'Order items', type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ description: 'Total amount' })
  totalAmount: string;

  @ApiProperty({ description: 'Order status' })
  status: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class OrderSummaryResponseDto {
  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ description: 'Customer ID' })
  userId: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: string;

  @ApiProperty({ description: 'Order status' })
  status: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class OrderListResponseDto {
  @ApiProperty({ description: 'List of orders', type: [OrderSummaryResponseDto] })
  orders: OrderSummaryResponseDto[];

  @ApiProperty({ description: 'Total number of orders' })
  total: number;

  @ApiProperty({ description: 'Limit per page' })
  limit: number;

  @ApiProperty({ description: 'Offset' })
  offset: number;
}

