import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from '../controllers/product.controller';
import { ProductOrmEntity } from '../../infrastructure/database/entities/product.orm-entity';
import { ProductRepositoryAdapter } from '../../infrastructure/repositories/product.repository.adapter';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity])],
  controllers: [ProductController],
  providers: [
    {
      provide: 'ProductRepositoryPort',
      useClass: ProductRepositoryAdapter,
    },
    CreateProductUseCase,
  ],
})
export class ProductModule {}
