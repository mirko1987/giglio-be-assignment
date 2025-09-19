import { Injectable, Inject } from '@nestjs/common';
import { Observable, of, throwError, switchMap } from 'rxjs';
import { Product } from '../../domain/entities/product.entity';
import { ProductRepositoryPort } from '../ports/product.repository.port';
import { Money } from '../../domain/value-objects/money';

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  currency: string;
  sku: string;
  stock: number;
}

export interface CreateProductResponse {
  productId: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  sku: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject('ProductRepositoryPort') private readonly productRepository: ProductRepositoryPort
  ) {}

  execute(request: CreateProductRequest): Observable<CreateProductResponse> {
    return this.validateSkuUniqueness(request.sku).pipe(
      switchMap(() => this.createProduct(request)),
      switchMap(product => this.saveProduct(product)),
      switchMap(product => of(this.mapToResponse(product)))
    );
  }

  private validateSkuUniqueness(sku: string): Observable<void> {
    return this.productRepository.findBySku(sku).pipe(
      switchMap(existingProduct => {
        if (existingProduct) {
          return throwError(() => new Error(`Product with SKU ${sku} already exists`));
        }
        return of(void 0);
      })
    );
  }

  private createProduct(request: CreateProductRequest): Observable<Product> {
    try {
      const price = new Money(request.price, request.currency);
      const product = Product.create(
        request.name,
        request.description,
        price,
        request.sku,
        request.stock
      );
      return of(product);
    } catch (error) {
      return throwError(() => error);
    }
  }

  private saveProduct(product: Product): Observable<Product> {
    return this.productRepository.save(product);
  }

  private mapToResponse(product: Product): CreateProductResponse {
    return {
      productId: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      currency: product.price.currency,
      sku: product.sku,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  }
}

