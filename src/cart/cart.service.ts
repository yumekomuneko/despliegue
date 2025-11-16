import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { CreateCartDto } from './dtos/create-cart.dto';
import { UpdateCartDto } from './dtos/update-cart.dto';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private readonly cartRepo: Repository<Cart>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
    ) {}

    // ============================
    // GET ALL CARTS
    // ============================
    async findAll(): Promise<Cart[]> {
        return this.cartRepo.find({
            relations: ['user', 'products', 'orders'],
        });
    }

// ============================
// GET ONE CART
// ============================
/**
 * Obtener un carrito por id; si se proporciona currentUserId valida que el carrito pertenezca a ese usuario.
 */
async findOne(id: number, currentUserId?: number): Promise<Cart> {
    const cart = await this.cartRepo.findOne({
        where: { id },
        relations: ['user', 'products', 'orders'],
    });

    if (!cart) {
        throw new NotFoundException(`Cart with ID ${id} not found`);
    }

    if (currentUserId && cart.user?.id !== currentUserId) {
        // Ocultar existencia del carrito si no pertenece al usuario
        throw new NotFoundException(`Cart with ID ${id} not found`);
    }

    return cart;
}

    // ============================
    // CREATE CART
    // ============================
    async create(dto: CreateCartDto): Promise<Cart> {
        // Verificar que el usuario existe
        const user = await this.userRepo.findOne({ where: { id: dto.userId } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Verificar que el usuario no tenga un carrito activo
        const existingCart = await this.cartRepo.findOne({
            where: { user: { id: dto.userId }, checkedOut: false },
        });

        if (existingCart) {
            throw new BadRequestException('User already has an active cart');
        }

        const cart = this.cartRepo.create({ user });

        // Si incluye productos
        if (dto.productIds?.length) {
            // Cargar los productos con los campos necesarios
            const products = await this.productRepo.find({
                where: { id: In(dto.productIds) },
                select: ['id', 'name', 'available', 'cantidad'], 
            });

            if (products.length !== dto.productIds.length) {
                throw new BadRequestException(
                    'One or more product IDs do not exist',
                );
            }

            // VALIDACIÓN DE DISPONIBILIDAD
            const unavailableProducts = products.filter(
                (p) => p.available === false || p.cantidad <= 0,
            );

            if (unavailableProducts.length > 0) {
                const names = unavailableProducts.map((p) => p.name).join(', ');
                throw new BadRequestException(
                    `No se puede crear el carrito. Productos agotados o no disponibles: ${names}.`,
                );
            }
            
            cart.products = products;
        }

        return this.cartRepo.save(cart);
    }

    // ============================
    // UPDATE CART (Add/Replace Products)
    // ============================
    async update(id: number, dto: UpdateCartDto, currentUserId?: number): Promise<Cart> {
        // ✅ Valida que el carrito existe Y pertenece al usuario (si no es admin)
        const cart = await this.findOne(id, currentUserId);

        if (dto.productIds) {
            const products = await this.productRepo.find({
                where: { id: In(dto.productIds) },
                select: ['id', 'name', 'available', 'cantidad'],
            });

            if (products.length !== dto.productIds.length) {
                throw new BadRequestException(
                    'One or more product IDs do not exist',
                );
            }

            // 🔥 VALIDACIÓN DE DISPONIBILIDAD AL ACTUALIZAR
            const unavailableProducts = products.filter(
                (p) => p.available === false || p.cantidad <= 0,
            );

            if (unavailableProducts.length > 0) {
                const names = unavailableProducts.map((p) => p.name).join(', ');
                throw new BadRequestException(
                    `No se puede actualizar el carrito. Productos agotados o no disponibles: ${names}.`,
                );
            }

            cart.products = products;
        }

        return this.cartRepo.save(cart);
    }

    // ============================
    // DELETE CART
    // ============================
    async remove(id: number): Promise<{ message: string }> {
        const cart = await this.findOne(id);
        await this.cartRepo.remove(cart);

        return { message: `Cart ${id} deleted successfully` };
    }

    // ============================
    // CHECKOUT (Finalizes Cart)
    // ============================
    async checkout(id: number, currentUserId?: number): Promise<{ message: string }> {
        // ✅ Valida que el carrito existe Y pertenece al usuario (si no es admin)
        const cart = await this.findOne(id, currentUserId);

        if (cart.checkedOut) {
            throw new BadRequestException('Cart is already checked out');
        }

        if (!cart.products || cart.products.length === 0) {
            throw new BadRequestException('Cannot checkout an empty cart');
        }

        // 🔥 VALIDACIÓN ADICIONAL: Verificar stock disponible antes del checkout
        const productsToCheck = await this.productRepo.find({
            where: { id: In(cart.products.map(p => p.id)) },
            select: ['id', 'name', 'available', 'cantidad'],
        });

        const unavailableProducts = productsToCheck.filter(
            (p) => p.available === false || p.cantidad <= 0,
        );

        if (unavailableProducts.length > 0) {
            const names = unavailableProducts.map((p) => p.name).join(', ');
            throw new BadRequestException(
                `No se puede completar la compra. Productos agotados: ${names}.`,
            );
        }

        cart.checkedOut = true;
        await this.cartRepo.save(cart);

        return { message: `Cart ${id} checked out successfully` };
    }

    // ============================
    // MÉTODOS AUXILIARES
    // ============================

    /**
     * Obtener el carrito activo de un usuario
     */
    async getActiveCartByUserId(userId: number): Promise<Cart | null> {
        return this.cartRepo.findOne({
            where: { user: { id: userId }, checkedOut: false },
            relations: ['user', 'products'],
        });
    }

    /**
     * Agregar un producto al carrito activo del usuario
     * (útil para futuras integraciones)
     */
    async addProductToUserCart(userId: number, productId: number): Promise<Cart> {
        let cart = await this.getActiveCartByUserId(userId);

        // Si no tiene carrito activo, crear uno
        if (!cart) {
            cart = await this.create({ userId, productIds: [productId] });
            return cart;
        }

        // Verificar que el producto existe y está disponible
        const product = await this.productRepo.findOne({
            where: { id: productId },
            select: ['id', 'name', 'available', 'cantidad'],
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${productId} not found`);
        }

        if (product.available === false || product.cantidad <= 0) {
            throw new BadRequestException(
                `El producto ${product.name} no está disponible.`,
            );
        }

        // Verificar si el producto ya está en el carrito
        const productExists = cart.products.some(p => p.id === productId);
        
        if (productExists) {
            throw new BadRequestException(
                `El producto ${product.name} ya está en el carrito.`,
            );
        }

        // Agregar el producto al carrito
        cart.products.push(product);
        return this.cartRepo.save(cart);
    }

    /**
     * Remover un producto del carrito
     */
    async removeProductFromCart(
        cartId: number, 
        productId: number, 
        currentUserId?: number
    ): Promise<Cart> {
        // Validar que el carrito existe y pertenece al usuario
        const cart = await this.findOne(cartId, currentUserId);

        // Filtrar el producto a eliminar
        cart.products = cart.products.filter(p => p.id !== productId);

        return this.cartRepo.save(cart);
    }

    /**
     * Limpiar todos los productos del carrito
     */
    async clearCart(cartId: number, currentUserId?: number): Promise<Cart> {
        const cart = await this.findOne(cartId, currentUserId);
        
        cart.products = [];
        return this.cartRepo.save(cart);
    }

    /**
     * Calcular el total del carrito
     * (requiere que Product tenga campo 'price')
     */
    async calculateCartTotal(cartId: number, currentUserId?: number): Promise<number> {
        const cart = await this.findOne(cartId, currentUserId);

        if (!cart.products || cart.products.length === 0) {
            return 0;
        }

        // Asumiendo que Product tiene un campo 'price'
        return cart.products.reduce((total, product: any) => {
            return total + (product.price || 0);
        }, 0);
    }
}