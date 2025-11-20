/**
 * Controlador encargado de gestionar las operaciones del módulo de Órdenes.
 *
 * Define los endpoints para crear, leer, actualizar y eliminar órdenes,
 * así como para cambiar el estado y obtener las órdenes de un usuario.
 * 
 * Todas las rutas están protegidas mediante autenticación JWT y verificación de roles.
 * Solo los usuarios con rol `ADMIN` pueden acceder a ciertos endpoints administrativos.
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
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiParam,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { OrderStatus } from './entities/order.entity';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    // ============================================================
    // Obtener todas las órdenes (ADMIN)
    // ============================================================

    /**
     * Devuelve todas las órdenes registradas en el sistema.
     *
     * Solo accesible por usuarios con rol `ADMIN`.
     */
    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Obtener todas las órdenes (solo ADMIN)',
        description: 'Lista todas las órdenes del sistema. Solo accesible por administradores.',
    })
    @ApiResponse({
        status: 200,
        description: 'Órdenes obtenidas correctamente.',
        content: {
            'application/json': {
                example: {
                    data: [
                        { order_id: 1, userId: 2, total: 120, status: 'PENDING' },
                        { order_id: 2, userId: 3, total: 250, status: 'COMPLETED' },
                    ],
                },
            },
        },
    })
    @ApiResponse({
        status: 403,
        description: 'Acceso denegado: se requiere rol ADMIN.',
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
        return this.orderService.findAll();
    }

    // ============================================================
    // Obtener órdenes del usuario autenticado
    // ============================================================

    /**
     * Obtiene todas las órdenes pertenecientes al usuario autenticado.
     */
    @Get('my-orders')
    @ApiOperation({
        summary: 'Obtener órdenes del usuario autenticado',
        description: 'Lista todas las órdenes del usuario que realizó la solicitud.',
    })
    @ApiResponse({
        status: 200,
        description: 'Órdenes obtenidas correctamente.',
        content: {
            'application/json': {
                example: {
                    data: [
                        { order_id: 5, userId: 2, total: 150, status: 'PENDING' },
                    ],
                },
            },
        },
    })
    getMyOrders(@Req() req) {
        const userId = Number(req.user.sub);
        return this.orderService.findOrdersByUser(userId);
    }

    // ============================================================
    // Obtener orden por ID
    // ============================================================

    /**
     * Obtiene los datos de una orden específica por su ID.
     *
     * ADMIN puede ver cualquier orden, CLIENT solo la suya.
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Obtener una orden por ID',
        description: 'Consulta una orden específica por su ID. ADMIN ve cualquiera, CLIENT solo la propia.',
    })
    @ApiParam({ name: 'id', required: true })
    @ApiResponse({
        status: 200,
        description: 'Orden encontrada correctamente.',
        content: {
            'application/json': {
                example: { order_id: 3, userId: 2, total: 200, status: 'PENDING' },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Orden no encontrada.',
        content: {
            'application/json': {
                example: { statusCode: 404, message: 'Orden no encontrada', error: 'Not Found' },
            },
        },
    })
    findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
        const role = req.user.role;
        const userId = Number(req.user.sub);

        if (role === UserRole.ADMIN) {
            return this.orderService.findOne(id);
        }

        return this.orderService.findOne(id, userId);
    }

    // ============================================================
    // Crear nueva orden
    // ============================================================

    /**
     * Crea una nueva orden en el sistema.
     *
     * ADMIN puede asignar órdenes a cualquier usuario.
     * CLIENT solo puede crear órdenes para sí mismo.
     */
    @Post()
    @ApiOperation({
        summary: 'Crear una nueva orden',
        description: 'Crea una orden para un usuario. ADMIN puede asignar a otros, CLIENT solo para sí.',
    })
    @ApiBody({
        type: CreateOrderDto,
        examples: {
            exitoso: {
                summary: 'Ejemplo exitoso',
                value: { userId: 2, total: 150, items: [{ productId: 1, quantity: 2 }] },
            },
            errorValidacion: {
                summary: 'Error de validación',
                value: { total: -10, items: [] },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Orden creada exitosamente.',
        content: {
            'application/json': {
                example: {
                    message: 'Orden creada exitosamente.',
                    data: { order_id: 10, userId: 2, total: 150, status: 'PENDING' },
                },
            },
        },
    })
    create(@Body() dto: CreateOrderDto, @Req() req) {
        const userId = Number(req.user.sub);
        const role = req.user.role;

        if (role !== UserRole.ADMIN) {
            dto.userId = userId;
        }

        return this.orderService.create(userId, dto);
    }

    // ============================================================
    // Actualizar orden (ADMIN)
    // ============================================================

    /**
     * Actualiza los datos de una orden existente.
     *
     * Solo accesible por usuarios con rol ADMIN.
     */
    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Actualizar una orden existente (solo ADMIN)',
        description: 'Modifica datos de una orden específica.',
    })
    @ApiBody({ type: UpdateOrderDto })
    @ApiResponse({
        status: 200,
        description: 'Orden actualizada correctamente.',
        content: {
            'application/json': {
                example: {
                    message: 'Orden actualizada exitosamente.',
                    data: { order_id: 3, total: 180, status: 'PENDING' },
                },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Orden no encontrada.',
    })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderDto) {
        return this.orderService.update(id, dto);
    }

    // ============================================================
    // Cambiar estado de orden
    // ============================================================

    /**
     * Cambia el estado de una orden.
     *
     * ADMIN puede cambiar cualquier estado.
     * CLIENT solo puede cancelar su propia orden.
     */
    @Patch(':id/status')
    @ApiOperation({
        summary: 'Cambiar estado de una orden (ADMIN) / cancelar (CLIENT)',
    })
    @ApiBody({
        schema: { type: 'object', properties: { status: { type: 'string' } } },
    })
    @ApiResponse({
        status: 200,
        description: 'Estado actualizado correctamente.',
    })
    @ApiResponse({
        status: 403,
        description: 'No tiene permisos para cambiar este estado.',
    })
    updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: OrderStatus, @Req() req) {
        const userId = Number(req.user.sub);
        const role = req.user.role;

        if (role === UserRole.ADMIN) {
            return this.orderService.updateStatus(id, status);
        }

        return this.orderService.updateStatus(id, status, userId);
    }

    // ============================================================
    // Eliminar orden (ADMIN)
    // ============================================================

    /**
     * Elimina una orden del sistema.
     *
     * Solo accesible por usuarios con rol ADMIN.
     */
    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Eliminar una orden (solo ADMIN)',
        description: 'Elimina permanentemente una orden del sistema.',
    })
    @ApiResponse({
        status: 200,
        description: 'Orden eliminada correctamente.',
        content: {
            'application/json': {
                example: { message: 'Orden eliminada correctamente.', deletedId: 3 },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Orden no encontrada.',
        content: {
            'application/json': {
                example: { statusCode: 404, message: 'Orden no encontrada', error: 'Not Found' },
            },
        },
    })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.orderService.remove(id);
    }
}