import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dtos/create-invoice.dto';
import { UpdateInvoiceDto } from './dtos/update-invoice.dto';
import { User } from '../user/entities/user.entity';
import { Order } from '../order/entities/order.entity';
import { Payment } from '../payment/entities/payment.entity';

@Injectable()
export class InvoiceService {
    constructor(
        @InjectRepository(Invoice)
        private readonly invoiceRepo: Repository<Invoice>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
    ) {}

    async findAll(): Promise<Invoice[]> {
        return this.invoiceRepo.find();
    }

    async findOne(id: number): Promise<Invoice> {
        const invoice = await this.invoiceRepo.findOne({ where: { id } });
        if (!invoice) throw new NotFoundException(`Invoice with ID ${id} not found`);
        return invoice;
    }

    async create(dto: CreateInvoiceDto): Promise<Invoice> {
        const user = await this.userRepo.findOne({ where: { id: dto.userId } });
        if (!user) throw new NotFoundException('User not found');

        const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
        if (!order) throw new NotFoundException('Order not found');

        const payment = await this.paymentRepo.findOne({ where: { id: dto.paymentId } });
        if (!payment) throw new NotFoundException('Payment not found');

        const invoice = this.invoiceRepo.create({
        user,
        order,
        payment,
        totalAmount: dto.totalAmount,
        invoiceNumber: dto.invoiceNumber,
        status: 'issued',
        });

        return this.invoiceRepo.save(invoice);
    }

    async update(id: number, dto: UpdateInvoiceDto): Promise<Invoice> {
        const invoice = await this.findOne(id);
        Object.assign(invoice, dto);
        return this.invoiceRepo.save(invoice);
    }

    async cancel(id: number): Promise<Invoice> {
        const invoice = await this.findOne(id);
        invoice.status = 'canceled';
        return this.invoiceRepo.save(invoice);
    }

    async remove(id: number): Promise<{ message: string }> {
        const invoice = await this.findOne(id);
        await this.invoiceRepo.remove(invoice);
        return { message: `Invoice ${id} deleted successfully` };
    }
}
