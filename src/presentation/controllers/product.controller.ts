import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  Body, 
  HttpStatus, 
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
  Inject
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CreateProductUseCase, CreateProductRequest } from '../../application/use-cases/create-product.use-case';
import { ProductRepositoryPort } from '../../application/ports/product.repository.port';
import { ProductResponseDto } from '../dto/product-response.dto';

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  currency: string;
  sku: string;
  stock: number;
}


@ApiTags('Products')
@Controller('products')
@UseInterceptors(ClassSerializerInterceptor)
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    @Inject('ProductRepositoryPort') private readonly productRepository: ProductRepositoryPort
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Product created successfully',
    type: ProductResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request data' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Product with SKU already exists' 
  })
  createProduct(@Body() createProductDto: CreateProductDto): Observable<ProductResponseDto> {
    const request: CreateProductRequest = {
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.price,
      currency: createProductDto.currency,
      sku: createProductDto.sku,
      stock: createProductDto.stock
    };

    return this.createProductUseCase.execute(request).pipe(
      map(response => ({
        productId: response.productId,
        name: response.name,
        description: response.description,
        price: parseFloat(response.price),
        currency: response.currency,
        sku: response.sku,
        stock: response.stock,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      } as ProductResponseDto)),
      catchError(error => {
        throw new Error(`Failed to create product: ${error.message}`);
      })
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Product found',
    type: ProductResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Product not found' 
  })
  getProduct(@Param('id') id: string): Observable<ProductResponseDto> {
    return this.productRepository.findById(id).pipe(
      map(product => {
        if (!product) {
          throw new Error(`Product with ID ${id} not found`);
        }
        return {
          productId: product.id,
          name: product.name,
          description: product.description,
          price: product.price.amount,
          currency: product.price.currency,
          sku: product.sku,
          stock: product.stock,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        } as ProductResponseDto;
      }),
      catchError(error => {
        throw new Error(`Failed to get product: ${error.message}`);
      })
    );
  }
}
