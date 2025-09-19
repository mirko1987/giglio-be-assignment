import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ description: 'Product ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  productId: string;

  @ApiProperty({ description: 'Product name', example: 'MacBook Pro' })
  name: string;

  @ApiProperty({ description: 'Product description', example: 'Apple MacBook Pro 16-inch' })
  description: string;

  @ApiProperty({ description: 'Product price', example: 2499.99 })
  price: number;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Product SKU', example: 'MBP-16-2023' })
  sku: string;

  @ApiProperty({ description: 'Stock quantity', example: 10 })
  stock: number;

  @ApiProperty({ description: 'Creation date', example: '2023-12-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2023-12-01T10:00:00.000Z' })
  updatedAt: Date;
}
