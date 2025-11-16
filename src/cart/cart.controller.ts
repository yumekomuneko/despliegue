import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Req,
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

    // ============================
    // OBTENER TODOS LOS CARRITOS (SOLO ADMIN)
    // ============================
    @Roles(UserRole.ADMIN)
    @Get()
    findAll() {
        return this.cartService.findAll();
    }

    // ============================
    // OBTENER UN CARRITO POR ID
    // ============================
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
  
        const currentUserId = Number(req.user.userId);
        const currentUserRole = req.user.role;

        if (currentUserRole === 'ADMIN') {
            return this.cartService.findOne(id);
        }

        return this.cartService.findOne(id, currentUserId);
    }

    // ============================
    // CREAR CARRITO
    // ============================
    @Post()
    create(@Body() dto: CreateCartDto, @Req() req) {

        const currentUserId = Number(req.user.userId);
        const currentUserRole = req.user.role;

        if (currentUserRole !== 'ADMIN') {
            dto.userId = currentUserId;
        }

        return this.cartService.create(dto);
    }

    // ============================
    // ACTUALIZAR CARRITO
    // ============================
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCartDto,
        @Req() req,
    ) {
        const currentUserId = Number(req.user.userId);
        const currentUserRole = req.user.role;

        if (currentUserRole === 'ADMIN') {
            return this.cartService.update(id, dto);
        }

        return this.cartService.update(id, dto, currentUserId);
    }

    // ============================
    // CHECKOUT (CONFIRMAR COMPRA)
    // ============================
    @Patch(':id/checkout')
    checkout(@Param('id', ParseIntPipe) id: number, @Req() req) {
    
        const currentUserId = Number(req.user.userId);
        const currentUserRole = req.user.role;

        if (currentUserRole === 'ADMIN') {
            return this.cartService.checkout(id);
        }

        // Cliente solo puede hacer checkout de su carrito
        return this.cartService.checkout(id, currentUserId);
    }

    // ============================
    // ELIMINAR CARRITO (SOLO ADMIN)
    // ============================
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.cartService.remove(id);
    }
}