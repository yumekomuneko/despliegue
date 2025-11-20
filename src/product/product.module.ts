import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { Product } from './entities/product.entity';
import { Category } from '../category/entities/category.entity';

import { ProductService } from './product.service';
import { ProductController } from './product.controller';

@Module({
    imports: [
    TypeOrmModule.forFeature([Product, Category]),
    HttpModule,        // Necesario para consumir DummyJSON
    JwtModule,         // Requerido ya que el Controller usa JwtAuthGuard
    ],
    controllers: [ProductController],
    providers: [ProductService],
    exports: [ProductService],
})
export class ProductModule {}

