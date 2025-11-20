/**
 * Controlador encargado de gestionar las operaciones del módulo de Carritos.
 *
 * Define los endpoints para crear, actualizar, eliminar productos del carrito
 * y realizar checkout.
 * 
 * Las rutas están protegidas mediante autenticación JWT. Solo ADMIN puede
 * acceder a los endpoints de administración.
 */
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
    Req,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dtos/add-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';


@ApiTags('Carts')
@ApiBearerAuth()

@Controller('carts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CartController {
    constructor(private readonly cartService: CartService) {}

    // ============================================================
    // Obtener carrito del usuario (Cliente)
    // ============================================================
    /**
     * Devuelve el carrito del usuario autenticado. 
     * Si no existe, lo crea automáticamente.
     */
    @Get('my')
    getCart(@Req() req: any) {
        const userId = Number(req.user.sub);
        return this.cartService.findOrCreateCart(userId); 
    }
    @ApiOperation({ summary: 'Obtener mi carrito (Cliente)' })
    @ApiResponse({
        status: 200,
        description: 'Carrito obtenido o creado correctamente.',
        content: {
            'application/json': {
                example: {
                    cart_id: 1,
                    userId: 5,
                    items: [
                        { productId: 2, quantity: 3 },
                        { productId: 4, quantity: 1 },
                    ],
                },
            },
        },
    })

    // ============================================================
    // Agregar o actualizar producto en el carrito (Cliente)
    // ============================================================
    /**
     * Agrega un producto al carrito o actualiza la cantidad si ya existe.
     */
    @Post('item')
    @ApiOperation({ summary: 'Agregar o actualizar producto en el carrito (Cliente)' })
    @ApiBody({ type: AddCartItemDto })
    @ApiResponse({
        status: 200,
        description: 'Producto agregado o actualizado correctamente.',
        content: {
            'application/json': {
                example: {
                    message: 'Producto agregado/actualizado.',
                    cart_id: 1,
                    items: [
                        { productId: 2, quantity: 3 },
                        { productId: 4, quantity: 1 },
                    ],
                },
            },
        },
    })
    addItem(@Req() req: any, @Body() dto: AddCartItemDto) {
        const userId = Number(req.user.sub);
        return this.cartService.addOrUpdateProduct(userId, dto.productId, dto.quantity);
    }

    // ============================================================
    // Eliminar producto del carrito (Cliente)
    // ============================================================
    /**
     * Elimina un producto específico del carrito del usuario autenticado.
     */
    @Delete('item/:productId')
    @ApiOperation({ summary: 'Eliminar producto del carrito (Cliente)' })
    @ApiParam({ name: 'productId', type: Number })
    @ApiResponse({
        status: 200,
        description: 'Producto eliminado correctamente.',
    })
    removeItem(
        @Req() req: any,
        @Param('productId', ParseIntPipe) productId: number,
    ) {
        const userId = Number(req.user.sub);
        return this.cartService.removeProduct(userId, productId);
    }

    // ============================================================
    // Checkout del carrito (Cliente)
    // ============================================================
    /**
     * Realiza el checkout del carrito del usuario autenticado.
     */
    @Patch('checkout')
    @ApiOperation({ summary: 'Realizar checkout del carrito (Cliente)' })
    @ApiResponse({
        status: 200,
        description: 'Checkout completado correctamente.',
        content: {
            'application/json': {
                example: {
                    message: 'Checkout completado.',
                    order_id: 12,
                },
            },
        },
    })
    async checkout(@Req() req: any) {
        const userId = Number(req.user.sub);
        const cart = await this.cartService.findOrCreateCart(userId);
        return this.cartService.checkout(cart.id); 
    }

    // ============================================================
    // Obtener todos los carritos (ADMIN)
    // ============================================================
    /**
     * Devuelve la lista completa de carritos del sistema.
     *
     * Solo accesible por usuarios con rol `ADMIN`.
     */
    @Roles(UserRole.ADMIN)
    @Get()
    @ApiOperation({ summary: 'Obtener todos los carritos (ADMIN)' })
    @ApiResponse({
        status: 200,
        description: 'Listado de carritos obtenido correctamente.',
        content: {
            'application/json': {
                example: [
                    { cart_id: 1, userId: 5, items: [{ productId: 2, quantity: 3 }] },
                    { cart_id: 2, userId: 6, items: [] },
                ],
            },
        },
    })
    findAll() {
        return this.cartService.findAll();
    }

    // ============================================================
    // Obtener carrito por ID (ADMIN)
    // ============================================================
    /**
     * Devuelve un carrito específico por ID.
     *
     * Solo accesible por usuarios con rol `ADMIN`.
     */
    @Roles(UserRole.ADMIN)
    @Get(':id')
    @ApiOperation({ summary: 'Obtener carrito por ID (ADMIN)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({
        status: 200,
        description: 'Carrito encontrado correctamente.',
        content: {
            'application/json': {
                example: { cart_id: 1, userId: 5, items: [{ productId: 2, quantity: 3 }] },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Carrito no encontrado.',
        content: {
            'application/json': {
                example: { statusCode: 404, message: 'Carrito no encontrado', error: 'Not Found' },
            },
        },
    })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.cartService.findOne(id);
    }
}