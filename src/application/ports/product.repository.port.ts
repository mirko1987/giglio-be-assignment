import { Observable } from 'rxjs';
import { Product } from '../../domain/entities/product.entity';

export interface ProductRepositoryPort {
  save(product: Product): Observable<Product>;
  findById(id: string): Observable<Product | null>;
  findBySku(sku: string): Observable<Product | null>;
  findAll(): Observable<Product[]>;
  findByAvailability(available: boolean): Observable<Product[]>;
  delete(id: string): Observable<void>;
  exists(id: string): Observable<boolean>;
}
