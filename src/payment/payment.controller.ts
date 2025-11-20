/**
 * Controlador encargado de gestionar los pagos del sistema.
 *
 * Define endpoints para pagos con Stripe, pagos manuales,
 * consulta, actualización y eliminación de pagos.
 *
 * Los endpoints administrativos requieren rol ADMIN.
 */

import { 
    Controller, Post, Get, Param, Body, ParseIntPipe, UseGuards, Patch, Delete,
    Query, Req, Headers, HttpStatus, BadRequestException, Res
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { UpdatePaymentDto } from './dtos/update-payment.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

import {
    ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth
} from '@nestjs/swagger';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    // ============================================================
    // Crear sesión de pago con Stripe
    // ============================================================
    @Post('stripe/checkout')
    @ApiOperation({ summary: 'Crear sesión de pago con Stripe Checkout' })
    @ApiBody({ type: CreatePaymentDto })
    @ApiResponse({ status: 201, description: 'Sesión creada correctamente.' })
    @ApiResponse({ status: 400, description: 'Error en datos enviados.' })
    createStripeCheckout(@Body() dto: CreatePaymentDto, @Req() req) {
        dto.userId = Number(req.user.userId);
        return this.paymentService.createStripeCheckout(dto);
    }

    // ============================================================
    // Verificar estado de pago Stripe
    // ============================================================
    @Get('verify')
    @ApiOperation({ summary: 'Verificar estado del pago después de Stripe' })
    @ApiQuery({ name: 'sessionId', required: true, example: 'cs_test_123456789' })
    @ApiResponse({ status: 200, description: 'Pago verificado correctamente.' })
    @ApiResponse({ status: 400, description: 'Session ID no proporcionado o inválido.' })
    verifyPayment(@Query('sessionId') sessionId: string) {
        if (!sessionId) {
            throw new BadRequestException('Session ID is required for verification.');
        }
        return this.paymentService.verifyStripePayment(sessionId);
    }

    // ============================================================
    // Crear pago manual (efectivo / transferencia)
    // ============================================================
    @Post('manual')
    @ApiOperation({ summary: 'Crear pago manual (Efectivo/Transferencia)' })
    @ApiBody({ type: CreatePaymentDto })
    @ApiResponse({ status: 201, description: 'Pago manual creado correctamente.' })
    createManualPayment(@Body() dto: CreatePaymentDto, @Req() req) {
        const currentUserId = Number(req.user.userId);
        const currentUserRole = req.user.role;

        if (currentUserRole !== UserRole.ADMIN) {
            dto.userId = currentUserId;
        }

        return this.paymentService.createManualPayment(dto);
    }

    // ============================================================
    // Obtener todos los pagos (ADMIN)
    // ============================================================
    @Roles(UserRole.ADMIN)
    @Get()
    @ApiOperation({ summary: 'Listar todos los pagos (solo ADMIN)' })
    @ApiResponse({ status: 200, description: 'Listado de todos los pagos.' })
    findAll() {
        return this.paymentService.findAll();
    }

    // ============================================================
    // Obtener pago por ID
    // ============================================================
    @Get(':id')
    @ApiOperation({ summary: 'Obtener un pago por ID' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Pago encontrado correctamente.' })
    @ApiResponse({ status: 404, description: 'Pago no encontrado.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.paymentService.findOne(id);
    }

    // ============================================================
    // Actualizar pago (ADMIN)
    // ============================================================
    @Roles(UserRole.ADMIN)
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar un pago (solo ADMIN)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiBody({ type: UpdatePaymentDto })
    @ApiResponse({ status: 200, description: 'Pago actualizado correctamente.' })
    @ApiResponse({ status: 404, description: 'Pago no encontrado.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePaymentDto) {
        return this.paymentService.update(id, dto);
    }

    // ============================================================
    // Eliminar pago (ADMIN)
    // ============================================================
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar un pago por ID (solo ADMIN)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Pago eliminado correctamente.' })
    @ApiResponse({ status: 404, description: 'Pago no encontrado.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.paymentService.remove(id);
    }

    // ============================================================
    // Webhook Stripe (No protegido)
    // ============================================================
    @Post('webhook')
    @ApiOperation({ summary: 'Webhook oficial de Stripe (recibe eventos externos)' })
    async handleStripeWebhook(
        @Req() req: RawBodyRequest<ExpressRequest>,
        @Headers('stripe-signature') signature: string,
        @Res() res: ExpressResponse,
    ) {
        try {
            await this.paymentService.handleStripeWebhook(req.rawBody, signature);
            return res.status(HttpStatus.OK).send({ received: true });
        } catch (error) {
            return res.status(HttpStatus.BAD_REQUEST).send({ message: error.message });
        }
    }
}