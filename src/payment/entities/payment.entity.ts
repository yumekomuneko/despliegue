import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { User } from '../../user/entities/user.entity';

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, { onDelete: 'CASCADE', eager: true })
    order: Order;

    @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
    user: User;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'varchar', length: 50 })
    method: string; // e.g. "credit_card", "paypal", "transfer", "cash"

    @Column({ type: 'varchar', length: 50, default: 'pending' })
    status: string; // pending | paid | failed | refunded

    @Column({ type: 'varchar', nullable: true })
    transactionId?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
