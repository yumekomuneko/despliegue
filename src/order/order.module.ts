import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderDetail } from '../order-detail/entities/order-detail.entity';
import { Cart } from '../cart/entities/cart.entity';
import { User } from '../user/entities/user.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Product } from '../product/entities/product.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderDetail, Cart, User, Product]),
    JwtModule
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
