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
    async findOne(id: number): Promise<Cart> {
        const cart = await this.cartRepo.findOne({
        where: { id },
        relations: ['user', 'products', 'orders'],
        });

        if (!cart) {
        throw new NotFoundException(`Cart with ID ${id} not found`);
        }

        return cart;
    }

    // ============================
    // CREATE CART
    // ============================
    async create(dto: CreateCartDto): Promise<Cart> {
        const user = await this.userRepo.findOne({ where: { id: dto.userId } });

        if (!user) {
        throw new NotFoundException('User not found');
        }

        // Check if user already has an active cart
        const existingCart = await this.cartRepo.findOne({
        where: { user: { id: dto.userId }, checkedOut: false },
        });

        if (existingCart) {
        throw new BadRequestException('User already has an active cart');
        }

        const cart = this.cartRepo.create({ user });

        // If includes products
        if (dto.productIds?.length) {
        const products = await this.productRepo.find({
            where: { id: In(dto.productIds) },
        });

        if (products.length !== dto.productIds.length) {
            throw new BadRequestException(
            'One or more product IDs do not exist',
            );
        }

        cart.products = products;
        }

        return this.cartRepo.save(cart);
    }

    // ============================
    // UPDATE CART (Add/Replace Products)
    // ============================
    async update(id: number, dto: UpdateCartDto): Promise<Cart> {
        const cart = await this.findOne(id);

        if (dto.productIds) {
        const products = await this.productRepo.find({
            where: { id: In(dto.productIds) },
        });

        if (products.length !== dto.productIds.length) {
            throw new BadRequestException(
            'One or more product IDs do not exist',
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
    async checkout(id: number): Promise<{ message: string }> {
        const cart = await this.findOne(id);

        if (cart.checkedOut) {
        throw new BadRequestException('Cart is already checked out');
        }

        if (!cart.products || cart.products.length === 0) {
        throw new BadRequestException(
            'Cannot checkout an empty cart',
        );
        }

        cart.checkedOut = true;
        await this.cartRepo.save(cart);

        return { message: `Cart ${id} checked out successfully` };
    }
}
