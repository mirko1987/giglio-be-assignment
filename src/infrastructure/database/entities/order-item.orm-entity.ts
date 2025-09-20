import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { OrderOrmEntity } from './order.orm-entity';
import { ProductOrmEntity } from './product.orm-entity';

@Entity('order_items')
export class OrderItemOrmEntity {
  @PrimaryColumn('varchar')
  id: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  productId: string;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('varchar', { length: 3 })
  currency: string;

  @ManyToOne(() => OrderOrmEntity, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: OrderOrmEntity;

  @ManyToOne(() => ProductOrmEntity, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: ProductOrmEntity;
}
