import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RoleModule } from '../role/role.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: 
  [TypeOrmModule.forFeature([User]),
      RoleModule,
      JwtModule
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
