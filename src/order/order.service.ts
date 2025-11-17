
import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { User } from '../user/entities/user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';
import { OrderDetail } from '../order-detail/entities/order-detail.entity';
import { Product } from '../product/entities/product.entity';



@Injectable()
export class OrderService {
    constructor(
        private readonly dataSource: DataSource,

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
    // CREATE ORDER (CORREGIDO - orderId persistido correctamente)
    // ============================
    async create(userId: number, dto: CreateOrderDto): Promise<Order> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validar usuario
            const user = await queryRunner.manager.findOne(User, {
                where: { id: userId },
            });
            if (!user) {
                throw new NotFoundException('User not found');
            }

            //  Validar y cargar carrito
            const cart = await queryRunner.manager.findOne(Cart, {
                where: { id: dto.cartId },
                relations: ['items', 'items.product', 'user'],
            });

            if (!cart) {
                throw new NotFoundException('Cart not found');
            }

            //  Validaciones
            if (cart.user.id !== userId) {
                throw new ForbiddenException(
                    'You can only create orders from your own cart'
                );
            }

            if (!cart.checkedOut) {
                throw new BadRequestException('Cart must be checked out first');
            }

            if (!cart.items || cart.items.length === 0) {
                throw new BadRequestException(
                    'Cannot create an order from an empty cart'
                );
            }

            // Crear la ORDEN (sin details por ahora)
            const order = queryRunner.manager.create(Order, {
                user: { id: user.id },
                cart: { id: cart.id },
                status: OrderStatus.PENDING,
                total: 0,
            });

            // Guardar orden en BD
            const savedOrder = await queryRunner.manager.save(Order, order);

            let total = 0;

            //  Procesar items y crear detalles
            for (const cartItem of cart.items) {
                const requestedQuantity = cartItem.quantity;

                // Bloquear producto
                const product = await queryRunner.manager.findOne(Product, {
                    where: { id: cartItem.product.id },
                    lock: { mode: 'pessimistic_write' },
                });

                if (!product) {
                    throw new NotFoundException(
                        `Product ID ${cartItem.product.id} not found`
                    );
                }

                // Validar disponibilidad
                if (!product.available) {
                    throw new BadRequestException(
                        `Product "${product.name}" is not available`
                    );
                }

                // Validar stock
                if (product.cantidad < requestedQuantity) {
                    throw new BadRequestException(
                        `Product "${product.name}" has insufficient stock. ` +
                        `Available: ${product.cantidad}, Requested: ${requestedQuantity}`
                    );
                }

                // Calcular subtotal
                const subtotal = Number(product.price) * requestedQuantity;
                total += subtotal;

                // Descontar stock
                product.cantidad -= requestedQuantity;
                await queryRunner.manager.save(Product, product);

                // Crar detalle con ID de orden
                const detail = queryRunner.manager.create(OrderDetail, {
                    orderId: savedOrder.id, // ✅ CLAVE: Asignar el ID directamente
                    product: { id: product.id },
                    quantity: requestedQuantity,
                    unitPrice: product.price,
                    subtotal: subtotal,
                });

                await queryRunner.manager.save(OrderDetail, detail);
            }

            // 6. Actualizar el total de la orden
            savedOrder.total = total;
            await queryRunner.manager.save(Order, savedOrder);

            // 7. Commit
            await queryRunner.commitTransaction();

            // 8. Retornar orden completa
            return this.findOne(savedOrder.id);
        } catch (error) {
            // Rollback
            await queryRunner.rollbackTransaction();

            // Re-lanzar errores de negocio
            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException ||
                error instanceof ForbiddenException
            ) {
                throw error;
            }

            // Log y error genérico
            console.error('Error creating order:', error);
            throw new BadRequestException('Failed to create order');
        } finally {
            // Liberar conexión
            await queryRunner.release();
        }
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

        // Si es cliente, solo puede cancelar
        if (currentUserId) {
            if (statusKey !== 'CANCELLED') {
                throw new ForbiddenException(
                    'Clients can only cancel their orders'
                );
            }

            if (order.status !== OrderStatus.PENDING) {
                throw new BadRequestException(
                    'You can only cancel orders that are in PENDING status'
                );
            }
        }

        // Validar status válido
        const finalDbValue = OrderStatus[statusKey as keyof typeof OrderStatus];

        if (!finalDbValue) {
            const validKeys = Object.keys(OrderStatus).join(', ');
            throw new BadRequestException(
                `Invalid order status: ${statusKey}. Must be one of: ${validKeys}`
            );
        }

        order.status = finalDbValue;

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