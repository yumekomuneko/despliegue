import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Order } from '../../order/entities/order.entity';
import { Payment } from '../../payment/entities/payment.entity';

@Entity('invoices')
export class Invoice {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Order, { eager: true, onDelete: 'CASCADE' })
    order: Order;

    @ManyToOne(() => Payment, { eager: true, onDelete: 'SET NULL' })
    payment: Payment;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalAmount: number;

    @Column({ type: 'varchar', length: 50 })
    status: string; // issued | canceled

    @Column({ type: 'varchar', unique: true })
    invoiceNumber: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
