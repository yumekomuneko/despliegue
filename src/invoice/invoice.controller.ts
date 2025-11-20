/**
 * Controlador encargado de gestionar las operaciones del módulo de Facturas.
 *
 * Define los endpoints para crear, leer, actualizar, cancelar y eliminar facturas.
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
    ParseIntPipe,
    UseGuards,
    Req,
    ForbiddenException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
} from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dtos/create-invoice.dto';
import { UpdateInvoiceDto } from './dtos/update-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) {}

    // ============================================================
    // Obtener todas las facturas (ADMIN)
    // ============================================================

    /**
     * Devuelve todas las facturas registradas en el sistema.
     *
     * Solo accesible por usuarios con rol `ADMIN`.
     */
    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Obtener todas las facturas (solo ADMIN)',
        description: 'Lista todas las facturas del sistema. Solo accesible por administradores.',
    })
    @ApiResponse({
        status: 200,
        description: 'Facturas obtenidas correctamente.',
        content: {
            'application/json': {
                example: {
                    data: [
                        { invoice_id: 1, userId: 2, total: 120, status: 'PAID' },
                        { invoice_id: 2, userId: 3, total: 250, status: 'PENDING' },
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
        return this.invoiceService.findAll();
    }

    // ============================================================
    // Obtener factura por ID
    // ============================================================

    /**
     * Obtiene los datos de una factura específica por su ID.
     *
     * ADMIN puede ver cualquier factura, CLIENT solo la suya.
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Obtener una factura por ID',
        description: 'Consulta una factura específica por su ID. ADMIN ve cualquiera, CLIENT solo la propia.',
    })
    @ApiParam({ name: 'id', required: true })
    @ApiResponse({
        status: 200,
        description: 'Factura encontrada correctamente.',
        content: {
            'application/json': {
                example: { invoice_id: 3, userId: 2, total: 200, status: 'PAID' },
            },
        },
    })
    @ApiResponse({
        status: 403,
        description: 'No tiene permisos para ver esta factura.',
        content: {
            'application/json': {
                example: {
                    statusCode: 403,
                    message: 'No tienes permiso para ver esta factura',
                    error: 'Forbidden',
                },
            },
        },
    })
    async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
        const role = req.user.role;
        const userId = Number(req.user.userId);

        const invoice = await this.invoiceService.findOne(id);

        if (!invoice) {
            throw new ForbiddenException('Factura no encontrada');
        }

        // ADMIN puede ver cualquier factura
        if (role === UserRole.ADMIN) {
            return invoice;
        }

        // Cliente solo puede ver facturas que le pertenecen
        if (invoice.userId !== userId) {
            throw new ForbiddenException('No tienes permiso para ver esta factura');
        }

        return invoice;
    }

    // ============================================================
    // Crear factura (ADMIN)
    // ============================================================

    /**
     * Crea una nueva factura en el sistema.
     *
     * Solo accesible por usuarios con rol `ADMIN`.
     */
    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Crear una factura (solo ADMIN)',
        description: 'Crea una nueva factura para un usuario. Solo accesible por administradores.',
    })
    @ApiBody({
        type: CreateInvoiceDto,
        examples: {
            exitoso: {
                summary: 'Ejemplo exitoso',
                value: { userId: 2, total: 150, items: [{ productId: 1, quantity: 2 }] },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Factura creada exitosamente.',
        content: {
            'application/json': {
                example: {
                    message: 'Factura creada exitosamente.',
                    data: { invoice_id: 10, userId: 2, total: 150, status: 'PENDING' },
                },
            },
        },
    })
    create(@Body() dto: CreateInvoiceDto) {
        return this.invoiceService.create(dto);
    }

    // ============================================================
    // Actualizar factura (ADMIN)
    // ============================================================

    /**
     * Actualiza los datos de una factura existente.
     *
     * Solo accesible por usuarios con rol `ADMIN`.
     */
    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Actualizar factura (solo ADMIN)',
        description: 'Permite modificar los datos de una factura existente.',
    })
    @ApiBody({ type: UpdateInvoiceDto })
    @ApiResponse({
        status: 200,
        description: 'Factura actualizada correctamente.',
        content: {
            'application/json': {
                example: {
                    message: 'Factura actualizada exitosamente.',
                    data: { invoice_id: 3, total: 180, status: 'PAID' },
                },
            },
        },
    })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInvoiceDto) {
        return this.invoiceService.update(id, dto);
    }

    // ============================================================
    // Cancelar factura (ADMIN)
    // ============================================================

    /**
     * Cancela una factura existente.
     *
     * Solo accesible por usuarios con rol `ADMIN`.
     */
    @Patch(':id/cancel')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Cancelar factura (solo ADMIN)',
        description: 'Cambia el estado de la factura a cancelada.',
    })
    @ApiResponse({
        status: 200,
        description: 'Factura cancelada correctamente.',
        content: {
            'application/json': {
                example: { message: 'Factura cancelada correctamente.', invoice_id: 3 },
            },
        },
    })
    cancel(@Param('id', ParseIntPipe) id: number) {
        return this.invoiceService.cancel(id);
    }

    // ============================================================
    // Eliminar factura (ADMIN)
    // ============================================================

    /**
     * Elimina una factura del sistema.
     *
     * Solo accesible por usuarios con rol `ADMIN`.
     */
    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Eliminar una factura (solo ADMIN)',
        description: 'Elimina permanentemente una factura del sistema.',
    })
    @ApiResponse({
        status: 200,
        description: 'Factura eliminada correctamente.',
        content: {
            'application/json': {
                example: { message: 'Factura eliminada correctamente.', deletedId: 3 },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Factura no encontrada.',
        content: {
            'application/json': {
                example: { statusCode: 404, message: 'Factura no encontrada', error: 'Not Found' },
            },
        },
    })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.invoiceService.remove(id);
    }
}