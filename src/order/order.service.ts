import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { User } from '../user/entities/user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';
import { OrderDetail } from '../order-detail/entities/order-detail.entity';
import { Product } from '../product/entities/product.entity';
import { OrderStatus } from './entities/order.entity';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Cart)
        private readonly cartRepo: Repository<Cart>,

        @InjectRepository(OrderDetail)
        private readonly detailRepo: Repository<OrderDetail>,

        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
    ) {}

    // ============================
    // FIND ALL
    // ============================
    async findAll(): Promise<Order[]> {
        return this.orderRepo.find({
        relations: ['user', 'details', 'details.product'],
        });
    }

    // ============================
    // FIND ONE
    // ============================
    async findOne(id: number): Promise<Order> {
        const order = await this.orderRepo.findOne({
        where: { id },
        relations: ['user', 'details', 'details.product'],
        });

        if (!order) {
        throw new NotFoundException(`Order ${id} not found`);
        }

        return order;
    }

    // ============================
    // CREATE ORDER
    // ============================
    async create(dto: CreateOrderDto): Promise<Order> {
        const user = await this.userRepo.findOne({
        where: { id: dto.userId },
        });

        if (!user) throw new NotFoundException('User not found');

        const cart = await this.cartRepo.findOne({
        where: { id: dto.cartId },
        relations: ['products'],
        });

        if (!cart) throw new NotFoundException('Cart not found');
        if (!cart.checkedOut)
        throw new BadRequestException('Cart must be checked out first');

        if (!cart.products || cart.products.length === 0) {
        throw new BadRequestException('Cannot create an order from an empty cart');
        }

        // --- CALCULATE TOTAL ---
        const total = cart.products.reduce(
        (acc, p) => acc + Number(p.price),
        0,
        );

        // --- CREATE ORDER ---
        const order = this.orderRepo.create({
        user,
        total,
        createdAt: new Date(),
        });

        const savedOrder = await this.orderRepo.save(order);

        // --- CREATE DETAILS ---
        for (const product of cart.products) {
        const detail = this.detailRepo.create({
            order: savedOrder,
            product,
            quantity: 1,
            unitPrice: product.price,
            subtotal: product.price,
        });

        await this.detailRepo.save(detail);
        }

        return this.findOne(savedOrder.id);
    }

    // ============================
    // UPDATE ORDER (admin)
    // ============================
    async update(id: number, dto: UpdateOrderDto): Promise<Order> {
        const order = await this.findOne(id);
        Object.assign(order, dto);
        return this.orderRepo.save(order);
    }

    // ============================
    // UPDATE STATUS ONLY
    // ============================
    async updateStatus(id: number, status: OrderStatus) {
        if (!Object.values(OrderStatus).includes(status)) {
            throw new BadRequestException('Invalid order status');
        }

        const order = await this.findOne(id);
        order.status = status;
        return this.orderRepo.save(order);
    }

    // ============================
    // DELETE ORDER
    // ============================
    async remove(id: number): Promise<{ message: string }> {
        const order = await this.findOne(id);
        await this.orderRepo.remove(order);

        return { message: `Order ${id} deleted successfully` };
    }
}
