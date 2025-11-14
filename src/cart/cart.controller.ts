import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dtos/create-cart.dto';
import { UpdateCartDto } from './dtos/update-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('carts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CartController {
    constructor(private readonly cartService: CartService) {}

    // SOLO ADMIN VE TODOS
    @Roles(UserRole.ADMIN)
    @Get()
    findAll() {
        return this.cartService.findAll();
    }

    // USUARIO NORMAL Y ADMIN
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.cartService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateCartDto) {
        return this.cartService.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCartDto,
    ) {
        return this.cartService.update(id, dto);
    }

    @Patch(':id/checkout')
    checkout(@Param('id', ParseIntPipe) id: number) {
        return this.cartService.checkout(id);
    }

    @Roles(UserRole.ADMIN)
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.cartService.remove(id);
    }
}
