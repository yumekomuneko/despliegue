/**
 * Controlador encargado de gestionar los Detalles de Orden.
 *
 * Permite al administrador crear, actualizar y eliminar detalles de órdenes.
 * Los clientes solo pueden consultar los detalles que les pertenecen.
 *
 * Todas las rutas están protegidas mediante autenticación JWT.
 * Algunos endpoints requieren rol ADMIN.
 */

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

import { OrderDetailService } from './order-detail.service';
import { CreateOrderDetailDto } from './dtos/create-order-detail.dto';
import { UpdateOrderDetailDto } from './dtos/update-order-detail.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
} from '@nestjs/swagger';

@ApiTags('Order Details')
@ApiBearerAuth()
@Controller('order-details')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderDetailController {
    constructor(private readonly service: OrderDetailService) {}

    // ============================================================
    // Obtener todos los detalles (ADMIN)
    // ============================================================

    /**
     * Obtiene la lista completa de todos los detalles de órdenes registrados.
     *
     * Solo accesible por usuarios con rol ADMIN.
     */
    @Roles(UserRole.ADMIN)
    @Get()
    @ApiOperation({
        summary: 'Obtener todos los detalles de órdenes (solo ADMIN)',
        description:
            'Devuelve una lista completa con todos los detalles de las órdenes.',
    })
    @ApiResponse({
        status: 200,
        description: 'Detalles obtenidos correctamente.',
        content: {
            'application/json': {
                example: {
                    data: [
                        {
                            id: 1,
                            orderId: 5,
                            productId: 2,
                            quantity: 3,
                            price: 199.99,
                        },
                        {
                            id: 2,
                            orderId: 5,
                            productId: 7,
                            quantity: 1,
                            price: 499.99,
                        },
                    ],
                },
            },
        },
    })
    @ApiResponse({
        status: 403,
        description: 'Acceso denegado: requiere rol ADMIN.',
        content: {
            'application/json': {
                example: {
                    statusCode: 403,
                    message: 'Acceso denegado',
                    error: 'Forbidden',
                },
            },
        },
    })
    findAll() {
        return this.service.findAll();
    }

    // ============================================================
    // Obtener detalle por ID (ADMIN o dueño)
    // ============================================================

    /**
     * Obtiene un detalle de orden específico según su ID.
     *
     * ADMIN → puede ver cualquier detalle  
     * CLIENTE → solo puede ver detalles asociados a su usuario
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Obtener un detalle de orden por ID',
        description:
            'ADMIN puede consultar cualquier registro. CLIENTE solo los suyos.',
    })
    @ApiParam({ name: 'id', example: 12 })
    @ApiResponse({
        status: 200,
        description: 'Detalle encontrado correctamente.',
        content: {
            'application/json': {
                example: {
                    id: 12,
                    orderId: 5,
                    productId: 7,
                    quantity: 2,
                    price: 199.99,
                },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Detalle de orden no encontrado.',
        content: {
            'application/json': {
                example: {
                    statusCode: 404,
                    message: 'Order detail not found',
                    error: 'Not Found',
                },
            },
        },
    })
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
    ) {
        const role = req.user.role;
        const userId = Number(req.user.userId);

        if (role !== UserRole.ADMIN) {
            return this.service.findOne(id, userId);
        }

        return this.service.findOne(id);
    }

    // ============================================================
    // Crear un detalle de orden (ADMIN)
    // ============================================================

    /**
     * Crea un nuevo detalle de orden.
     *
     * Solo accesible por ADMIN.
     */
    @Roles(UserRole.ADMIN)
    @Post()
    @ApiOperation({
        summary: 'Crear un detalle de orden (solo ADMIN)',
        description:
            'Permite crear un detalle de orden con productId, quantity y price.',
    })
    @ApiBody({
        type: CreateOrderDetailDto,
        examples: {
            exitoso: {
                summary: 'Ejemplo exitoso',
                value: {
                    orderId: 5,
                    productId: 2,
                    quantity: 3,
                    price: 199.99,
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Detalle de orden creado exitosamente.',
        content: {
            'application/json': {
                example: {
                    message: 'Detalle creado correctamente.',
                    data: {
                        id: 18,
                        orderId: 5,
                        productId: 2,
                        quantity: 3,
                        price: 199.99,
                    },
                },
            },
        },
    })
    create(@Body() dto: CreateOrderDetailDto) {
        return this.service.create(dto);
    }

    // ============================================================
    // Actualizar detalle (ADMIN)
    // ============================================================

    /**
     * Actualiza un detalle de orden existente.
     *
     * Solo accesible por ADMIN.
     */
    @Roles(UserRole.ADMIN)
    @Patch(':id')
    @ApiOperation({
        summary: 'Actualizar un detalle de orden (solo ADMIN)',
        description: 'Permite modificar quantity, price o productId.',
    })
    @ApiParam({ name: 'id', example: 18 })
    @ApiBody({
        type: UpdateOrderDetailDto,
        examples: {
            exitoso: {
                summary: 'Actualización correcta',
                value: {
                    quantity: 4,
                    price: 189.99,
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Detalle actualizado correctamente.',
        content: {
            'application/json': {
                example: {
                    message: 'Detalle actualizado exitosamente.',
                    data: {
                        id: 18,
                        productId: 2,
                        quantity: 4,
                        price: 189.99,
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Detalle no encontrado.',
    })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateOrderDetailDto,
    ) {
        return this.service.update(id, dto);
    }

    // ============================================================
    // Eliminar detalle (ADMIN)
    // ============================================================

    /**
     * Elimina un detalle de orden.
     *
     * Solo accesible por ADMIN.
     */
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    @ApiOperation({
        summary: 'Eliminar un detalle de orden (solo ADMIN)',
        description: 'Elimina permanentemente un detalle.',
    })
    @ApiParam({ name: 'id', example: 18 })
    @ApiResponse({
        status: 200,
        description: 'Detalle eliminado correctamente.',
        content: {
            'application/json': {
                example: {
                    message: 'Detalle eliminado correctamente.',
                    deletedId: 18,
                },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Detalle no encontrado.',
    })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.remove(id);
    }
}