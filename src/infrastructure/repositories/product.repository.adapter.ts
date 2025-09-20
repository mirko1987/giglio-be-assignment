import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProductRepositoryPort } from '../../application/ports/product.repository.port';
import { Product } from '../../domain/entities/product.entity';
import { ProductOrmEntity } from '../database/entities/product.orm-entity';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class ProductRepositoryAdapter implements ProductRepositoryPort {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly productRepository: Repository<ProductOrmEntity>,
  ) {}

  save(product: Product): Observable<Product> {
    const productOrm = ProductMapper.toOrmEntity(product);

    return from(this.productRepository.save(productOrm)).pipe(
      map((savedProductOrm) => ProductMapper.toDomainEntity(savedProductOrm)),
      catchError((error) =>
        throwError(() => new Error(`Failed to save product: ${error.message}`)),
      ),
    );
  }

  findById(id: string): Observable<Product | null> {
    return from(this.productRepository.findOne({ where: { id } })).pipe(
      map((productOrm) => (productOrm ? ProductMapper.toDomainEntity(productOrm) : null)),
      catchError((error) =>
        throwError(() => new Error(`Failed to find product by ID: ${error.message}`)),
      ),
    );
  }

  findBySku(sku: string): Observable<Product | null> {
    return from(this.productRepository.findOne({ where: { sku } })).pipe(
      map((productOrm) => (productOrm ? ProductMapper.toDomainEntity(productOrm) : null)),
      catchError((error) =>
        throwError(() => new Error(`Failed to find product by SKU: ${error.message}`)),
      ),
    );
  }

  findAll(): Observable<Product[]> {
    return from(this.productRepository.find({ order: { createdAt: 'DESC' } })).pipe(
      map((productsOrm) =>
        productsOrm.map((productOrm) => ProductMapper.toDomainEntity(productOrm)),
      ),
      catchError((error) =>
        throwError(() => new Error(`Failed to find all products: ${error.message}`)),
      ),
    );
  }

  findByAvailability(available: boolean): Observable<Product[]> {
    const query = this.productRepository.createQueryBuilder('product');

    if (available) {
      query.where('product.stock > 0');
    } else {
      query.where('product.stock = 0');
    }

    return from(query.getMany()).pipe(
      map((productsOrm) =>
        productsOrm.map((productOrm) => ProductMapper.toDomainEntity(productOrm)),
      ),
      catchError((error) =>
        throwError(() => new Error(`Failed to find products by availability: ${error.message}`)),
      ),
    );
  }

  delete(id: string): Observable<void> {
    return from(this.productRepository.delete(id)).pipe(
      map((result) => {
        if (result.affected === 0) {
          throw new Error(`Product with ID ${id} not found`);
        }
      }),
      catchError((error) =>
        throwError(() => new Error(`Failed to delete product: ${error.message}`)),
      ),
    );
  }

  exists(id: string): Observable<boolean> {
    return from(this.productRepository.exists({ where: { id } })).pipe(
      catchError((error) =>
        throwError(() => new Error(`Failed to check product existence: ${error.message}`)),
      ),
    );
  }
}
