import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
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
            order: { createdAt: 'DESC' },
        });
    }

    // ============================
    // FIND ONE
    // ============================
    async findOne(id: number, currentUserId?: number): Promise<Order> {
        const whereCondition: any = { id };

        if (currentUserId) {
            whereCondition.user = { id: currentUserId };
        }

        const order = await this.orderRepo.findOne({
            where: whereCondition,
            relations: ['user', 'details', 'details.product'],
        });

        if (!order) {
            if (currentUserId) {
                throw new NotFoundException(
                    `Order with ID ${id} not found or does not belong to the current user`
                );
            }
            throw new NotFoundException(`Order ${id} not found`);
        }

        return order;
    }

    // ============================
    // FIND ORDERS BY USER
    // ============================
    async findOrdersByUser(userId: number): Promise<Order[]> {
        return this.orderRepo.find({
            where: { user: { id: userId } },
            relations: ['user', 'details', 'details.product'],
            order: { createdAt: 'DESC' },
        });
    }

    // ============================
    // CREATE ORDER
    // ============================
    async create(dto: CreateOrderDto, currentUserId?: number): Promise<Order> {

        const user = await this.userRepo.findOne({
            where: { id: dto.userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const cart = await this.cartRepo.findOne({
            where: { id: dto.cartId },
            relations: ['products', 'user'],
        });

        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        if (currentUserId && cart.user.id !== currentUserId) {
            throw new ForbiddenException(
                'You can only create orders from your own cart'
            );
        }

        if (!cart.checkedOut) {
            throw new BadRequestException('Cart must be checked out first');
        }

        if (!cart.products || cart.products.length === 0) {
            throw new BadRequestException(
                'Cannot create an order from an empty cart'
            );
        }

        for (const product of cart.products) {
            const currentProduct = await this.productRepo.findOne({
                where: { id: product.id },
                select: ['id', 'name', 'available', 'cantidad'],
            });

            if (
                !currentProduct ||
                !currentProduct.available ||
                currentProduct.cantidad <= 0
            ) {
                throw new BadRequestException(
                    `Product ${product.name} is no longer available`
                );
            }
        }

        // --- Calcular total ---
        const total = cart.products.reduce(
            (acc, p) => acc + Number(p.price),
            0,
        );

        // --- Crear orden ---
        const order = this.orderRepo.create({
            user,
            total,
            createdAt: new Date(),
            status: OrderStatus.PENDING,
        });

        const savedOrder = await this.orderRepo.save(order);

        // --- Crear detalles ---
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
    // UPDATE STATUS
    // ============================
    async updateStatus(
        id: number,
        status: OrderStatus,
        currentUserId?: number,
    ): Promise<Order> {
        const order = await this.findOne(id, currentUserId);

        const statusKey = status as unknown as string;

        if (currentUserId) {
            if (statusKey !== 'CANCELLED') {
                throw new ForbiddenException(
                    'Clients can only cancel their orders'
                );
            }

            // Solo se puede cancelar si está PENDING
            if (order.status !== OrderStatus.PENDING) {
                throw new BadRequestException(
                    'You can only cancel orders that are in PENDING status'
                );
            }
        }

        // Validar que el status es válido
        const finalDbValue = OrderStatus[statusKey as keyof typeof OrderStatus];

        if (!finalDbValue) {
            const validKeys = Object.keys(OrderStatus).join(', ');
            throw new BadRequestException(
                `Invalid order status: ${statusKey}. Must be one of: ${validKeys}`
            );
        }

        // Asignar el nuevo status
        (order.status as any) = finalDbValue;

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