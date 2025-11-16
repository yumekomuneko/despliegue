import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../category/entities/category.entity';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';

@Injectable()
export class ProductService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
    ) {}

    /** Obtener todos los productos */
    async findAll(): Promise<Product[]> {
        const products = await this.productRepo.find({ relations: ['categories'] });
        return products.map((p) => ({
        ...p,
        price: Number(p.price), // convierte el decimal a número
        }));
    }

    /** Obtener un producto por ID */
    async findOne(id: number): Promise<Product> {
        const product = await this.productRepo.findOne({
        where: { id },
        relations: ['categories'],
        });
        if (!product)
        throw new NotFoundException(`Product with ID ${id} not found`);
        return { ...product, price: Number(product.price) };
    }

    /** Crear un nuevo producto */
    async create(dto: CreateProductDto): Promise<Product> {
        const { categories, ...data } = dto;
        const productEntity = this.productRepo.create(data);

        productEntity.available = productEntity.cantidad > 0;

        if (categories?.length) {
        const foundCategories = await this.categoryRepo.find({
            where: { id: In(categories) },
        });
        if (foundCategories.length !== categories.length) {
            throw new NotFoundException('Una o más categorías no existen');
        }
        productEntity.categories = foundCategories;
        }

        return this.productRepo.save(productEntity);
    }

    /** Actualizar un producto */
    async update(id: number, dto: UpdateProductDto): Promise<Product> {
        const product = await this.findOne(id);
        const { categories, ...data } = dto;

        if (categories) {
        const foundCategories = await this.categoryRepo.find({
            where: { id: In(categories) },
        });
        if (foundCategories.length !== categories.length) {
            throw new NotFoundException('Una o más categorías no existen');
        }
        product.categories = foundCategories;
        }

        Object.assign(product, data);
        return this.productRepo.save(product);
    }

    /** Eliminar un producto */
    async remove(id: number): Promise<{ message: string }> {
        const product = await this.findOne(id);
        await this.productRepo.remove(product);
        return { message: `Product ${id} deleted successfully` };
    }
}
