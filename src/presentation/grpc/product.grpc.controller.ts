import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable, map, catchError } from 'rxjs';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { ProductRepositoryPort } from '../../application/ports/product.repository.port';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

// gRPC Request/Response interfaces (based on proto definitions)
interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  currency: string;
  sku: string;
  stock: number;
}

interface GetProductRequest {
  id: string;
}

interface ListProductsRequest {
  page?: number;
  limit?: number;
  search?: string;
}

// interface UpdateProductRequest {
//   id: string;
//   name?: string;
//   description?: string;
//   price?: number;
//   currency?: string;
//   sku?: string;
//   stock?: number;
// }

interface DeleteProductRequest {
  id: string;
}

interface CheckStockRequest {
  id: string;
  quantity: number;
}

interface ProductResponse {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    sku: string;
    stock: number;
    created_at: string;
    updated_at: string;
  };
}

interface ListProductsResponse {
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    sku: string;
    stock: number;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

interface DeleteProductResponse {
  success: boolean;
  message: string;
}

interface CheckStockResponse {
  available: boolean;
  current_stock: number;
  message: string;
}

@Controller()
export class ProductGrpcController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    @Inject('ProductRepositoryPort') private readonly productRepository: ProductRepositoryPort,
  ) {}

  @GrpcMethod('ProductService', 'CreateProduct')
  createProduct(request: CreateProductRequest): Observable<ProductResponse> {
    return this.createProductUseCase
      .execute({
        name: request.name,
        description: request.description,
        price: request.price,
        currency: request.currency,
        sku: request.sku,
        stock: request.stock,
      })
      .pipe(
        map((response) => ({
          product: {
            id: response.productId,
            name: response.name,
            description: response.description,
            price: parseFloat(response.price),
            currency: response.currency,
            sku: response.sku,
            stock: response.stock,
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

  @GrpcMethod('ProductService', 'GetProduct')
  getProduct(request: GetProductRequest): Observable<ProductResponse> {
    return this.productRepository.findById(request.id).pipe(
      map((product) => {
        if (!product) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `Product with ID ${request.id} not found`,
          });
        }
        return {
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price.amount,
            currency: product.price.currency,
            sku: product.sku,
            stock: product.stock,
            created_at: product.createdAt.toISOString(),
            updated_at: product.updatedAt.toISOString(),
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

  @GrpcMethod('ProductService', 'ListProducts')
  listProducts(request: ListProductsRequest): Observable<ListProductsResponse> {
    const page = request.page || 1;
    const limit = request.limit || 10;

    return this.productRepository.findAll().pipe(
      map((products) => ({
        products: products.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price.amount,
          currency: product.price.currency,
          sku: product.sku,
          stock: product.stock,
          created_at: product.createdAt.toISOString(),
          updated_at: product.updatedAt.toISOString(),
        })),
        total: products.length,
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

  @GrpcMethod('ProductService', 'CheckStock')
  checkStock(request: CheckStockRequest): Observable<CheckStockResponse> {
    return this.productRepository.findById(request.id).pipe(
      map((product) => {
        if (!product) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `Product with ID ${request.id} not found`,
          });
        }

        const available = product.stock >= request.quantity;
        return {
          available: available,
          current_stock: product.stock,
          message: available
            ? `Stock available: ${product.stock} units`
            : `Insufficient stock. Available: ${product.stock}, Requested: ${request.quantity}`,
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

  @GrpcMethod('ProductService', 'DeleteProduct')
  deleteProduct(request: DeleteProductRequest): Observable<DeleteProductResponse> {
    return this.productRepository.delete(request.id).pipe(
      map(() => ({
        success: true,
        message: `Product with ID ${request.id} deleted successfully`,
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
