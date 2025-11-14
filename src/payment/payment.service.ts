import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,

        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        private readonly dataSource: DataSource, // para QueryRunner
    ) {}

    /**
     * Procesa un pago: valida order, monto, y crea Payment + actualiza Order.status = PAID
     * Todo dentro de una transacción.
     */
    async createPayment(dto: CreatePaymentDto): Promise<Payment> {
        const user = await this.userRepo.findOne({ where: { id: dto.userId } });
        if (!user) throw new NotFoundException('User not found');

        const order = await this.orderRepo.findOne({ where: { id: dto.orderId }, relations: ['details'] });
        if (!order) throw new NotFoundException('Order not found');

        if (order.status === OrderStatus.PAID) {
        throw new BadRequestException('Order is already paid');
        }

        // verificar monto (tolerancia pequeña si necesitas)
        const expected = Number(order.total);
        const received = Number(dto.amount);
        if (received < expected) {
        throw new BadRequestException(`Insufficient amount. Expected ${expected}, received ${received}`);
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
        // crear payment usando el queryRunner manager
        const payment = this.paymentRepo.create({
        order,
        user,
        amount: dto.amount,
        method: dto.method,
        status: 'paid',
        transactionId: dto.transactionId ?? undefined, // <--- CORREGIDO
        });

        // GUARDAR el pago en la transacción
        const savedPayment = await queryRunner.manager.save(Payment, payment);


        // actualizar orden a PAID
        order.status = OrderStatus.PAID;
        await queryRunner.manager.save(order);

        // (opcional) lógica adicional: generar factura, notificar por mail, vaciar carrito
        await queryRunner.commitTransaction();
        return savedPayment;
        } catch (err) {
        await queryRunner.rollbackTransaction();
        throw new InternalServerErrorException('Payment processing failed');
        } finally {
        await queryRunner.release();
        }
    }

    async findAll(): Promise<Payment[]> {
        return this.paymentRepo.find({ relations: ['order', 'user'] });
    }

    async findOne(id: number): Promise<Payment> {
        const p = await this.paymentRepo.findOne({ where: { id }, relations: ['order', 'user'] });
        if (!p) throw new NotFoundException(`Payment ${id} not found`);
        return p;
    }
}
