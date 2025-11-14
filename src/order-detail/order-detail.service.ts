import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderDetail } from './entities/order-detail.entity';
import { CreateOrderDetailDto } from './dtos/create-order-detail.dto';
import { UpdateOrderDetailDto } from './dtos/update-order-detail.dto';
import { Order } from '../order/entities/order.entity';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class OrderDetailService {
    constructor(
        @InjectRepository(OrderDetail)
        private readonly detailRepo: Repository<OrderDetail>,

        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,

        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
    ) {}

    async findAll(): Promise<OrderDetail[]> {
        return this.detailRepo.find({ relations: ['order', 'product'] });
    }

    async findOne(id: number): Promise<OrderDetail> {
        const detail = await this.detailRepo.findOne({
        where: { id },
        relations: ['order', 'product'],
        });

        if (!detail)
        throw new NotFoundException(`Order detail ${id} not found`);

        return detail;
    }

    async create(dto: CreateOrderDetailDto): Promise<OrderDetail> {
        const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
        if (!order) throw new NotFoundException('Order not found');

        const product = await this.productRepo.findOne({
        where: { id: dto.productId },
        });
        if (!product) throw new NotFoundException('Product not found');

        const subtotal = Number(product.price) * dto.quantity;

        const detail = this.detailRepo.create({
        order,
        product,
        quantity: dto.quantity,
        unitPrice: product.price,
        subtotal,
        });

        return this.detailRepo.save(detail);
    }

    async update(id: number, dto: UpdateOrderDetailDto): Promise<OrderDetail> {
        const detail = await this.findOne(id);

        if (dto.quantity) {
        detail.quantity = dto.quantity;
        detail.subtotal = Number(detail.unitPrice) * dto.quantity;
        }

        return this.detailRepo.save(detail);
    }

    async remove(id: number): Promise<{ message: string }> {
        const detail = await this.findOne(id);
        await this.detailRepo.remove(detail);

        return { message: `Order detail ${id} deleted successfully` };
    }
}
