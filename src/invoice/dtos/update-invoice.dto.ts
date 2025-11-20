import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceDto } from './create-invoice.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para actualizar una factura existente.
 * Todos los campos son opcionales y permiten actualizar parcialmente la entidad.
 */
export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
    @ApiPropertyOptional({ description: 'ID del usuario que recibe la factura', example: 3 })
    userId?: number;

    @ApiPropertyOptional({ description: 'ID de la orden asociada', example: 12 })
    orderId?: number;

    @ApiPropertyOptional({ description: 'ID del pago asociado', example: 77 })
    paymentId?: number;

    @ApiPropertyOptional({ description: 'Monto total de la factura', example: 35000 })
    totalAmount?: number;

    @ApiPropertyOptional({ description: 'Número único de factura', example: 'INV-2025-00012' })
    invoiceNumber?: string;
}
