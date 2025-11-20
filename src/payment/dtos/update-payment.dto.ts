import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentDto } from './create-payment.dto';
import { IsInt, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/payment.entity';

/**
 * DTO para actualizar un pago.
 * Permite modificar cualquier campo de un pago existente.
 */
export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
    @ApiPropertyOptional({ description: 'ID de la orden asociada', example: 12 })
    @IsInt()
    orderId?: number;

    @ApiPropertyOptional({ description: 'Monto del pago', example: 35000 })
    @IsNumber()
    amount?: number;

    @ApiPropertyOptional({
        description: 'Método de pago',
        enum: PaymentMethod,
        example: PaymentMethod.STRIPE,
    })
    @IsOptional()
    @IsEnum(PaymentMethod, {
        message: `El método de pago debe ser uno de los siguientes valores: ${Object.values(PaymentMethod).join(', ')}`,
    })
    method?: PaymentMethod;

    @ApiPropertyOptional({ description: 'ID de transacción del proveedor', example: 'txn_12345' })
    @IsOptional()
    @IsString()
    transactionId?: string;

    @ApiPropertyOptional({ description: 'Estado del pago', example: 'pending' })
    @IsOptional()
    @IsString()
    status?: string;
}
