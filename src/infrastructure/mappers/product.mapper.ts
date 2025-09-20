import { Product } from '../../domain/entities/product.entity';
import { ProductOrmEntity } from '../database/entities/product.orm-entity';
import { Money } from '../../domain/value-objects/money';

export class ProductMapper {
  static toOrmEntity(product: Product): ProductOrmEntity {
    const productOrm = new ProductOrmEntity();
    productOrm.id = product.id;
    productOrm.name = product.name;
    productOrm.description = product.description;
    productOrm.price = product.price.amount;
    productOrm.currency = product.price.currency;
    productOrm.sku = product.sku;
    productOrm.stock = product.stock;
    productOrm.createdAt = product.createdAt;
    productOrm.updatedAt = product.updatedAt;
    return productOrm;
  }

  static toDomainEntity(productOrm: ProductOrmEntity): Product {
    const price = new Money(productOrm.price, productOrm.currency);

    return new Product(
      productOrm.id,
      productOrm.name,
      productOrm.description,
      price,
      productOrm.sku,
      productOrm.stock,
      productOrm.createdAt,
      productOrm.updatedAt,
    );
  }
}
