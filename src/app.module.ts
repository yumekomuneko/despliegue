import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

  import { CategoryModule } from './category/category.module';
  import { InvoiceModule } from './invoice/invoice.module';
  import { OrderModule } from './order/order.module';
  import { OrderDetailModule } from './order-detail/order-detail.module';
  import { PaymentModule } from './payment/payment.module';
  import { PaymentMethodModule } from './pay-methods/pay-method.module';
  import { ProductModule } from './product/product.module';
  import { RoleModule } from './role/role.module';
  import { UserModule } from './user/user.module';
  import { CartModule } from './cart/cart.module';
  import { AuthModule } from './auth/auth.module';
  import { ChatModule } from './chat/chat.module';

  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          type: 'postgres',
          url: configService.get<string>('DATABASE_URL'),
          autoLoadEntities: true,
          synchronize: false,
          ssl: {
            rejectUnauthorized: false
          },
        }),
        inject: [ConfigService],
      }),
      ChatModule,
      AuthModule,
      CategoryModule,
      InvoiceModule,
      OrderModule,
      OrderDetailModule,
      PaymentModule,
      PaymentMethodModule,
      ProductModule,
      RoleModule,
      UserModule,
      CartModule,
    ],

    controllers: [AppController],
    providers: [AppService],
  })
  export class AppModule {}

