import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { User } from '../user/entities/user.entity';
import { Order } from '../order/entities/order.entity';
import { Payment } from '../payment/entities/payment.entity';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [TypeOrmModule.forFeature([Invoice, User, Order, Payment]), JwtModule],
    controllers: [InvoiceController],
    providers: [InvoiceService],
    exports: [InvoiceService],
})
export class InvoiceModule {}
