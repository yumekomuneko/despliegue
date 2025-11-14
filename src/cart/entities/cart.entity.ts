import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    ManyToMany,
    JoinTable,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../product/entities/product.entity';
import { Order } from '../../order/entities/order.entity';

@Entity('carts')
export class Cart {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.carts, { onDelete: 'CASCADE' })
    user: User;

    @ManyToMany(() => Product)
    @JoinTable({
        name: 'cart_products',
        joinColumn: { name: 'cart_id' },
        inverseJoinColumn: { name: 'product_id' },
    })
    products: Product[];

    @Column({ default: false })
    checkedOut: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Order, (order) => order.cart)
    orders: Order[];
}
