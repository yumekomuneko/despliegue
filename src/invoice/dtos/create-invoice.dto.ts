import { IsNumber, IsString, IsPositive, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear una nueva factura.
 */
export class CreateInvoiceDto {
    @ApiProperty({ description: 'ID del usuario que recibe la factura', example: 3 })
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    userId: number;

    @ApiProperty({ description: 'ID de la orden asociada', example: 12 })
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    orderId: number;

    @ApiProperty({ description: 'ID del pago asociado', example: 77 })
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    paymentId: number;

    @ApiProperty({ description: 'Monto total de la factura', example: 35000 })
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    totalAmount: number;

    @ApiProperty({ description: 'Número único de factura', example: 'INV-2025-00012' })
    @IsNotEmpty()
    @IsString()
    @Length(5, 50)
    invoiceNumber: string;
}