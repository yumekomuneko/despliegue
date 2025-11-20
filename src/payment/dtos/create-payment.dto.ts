import { IsInt, IsNumber, IsOptional, Min, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/payment.entity';

/**
 * DTO para crear un pago.
 * 
 * Algunos campos son inyectados automáticamente desde el backend (JWT o lógica interna),
 * por lo que son opcionales en la solicitud.
 */
export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID de la orden asociada al pago',
    example: 12,
  })
  @IsNotEmpty()
  @IsNumber()
  orderId: number; 

  @ApiPropertyOptional({
    description: 'ID del usuario que realiza el pago (inyectado desde JWT)',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  userId?: number; 
  
  @ApiPropertyOptional({
    description: 'Monto del pago (calculado normalmente por el backend)',
    example: 35000,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number; 

  @ApiPropertyOptional({
    description: 'Método de pago (STRIPE, CASH, TRANSFER)',
    enum: PaymentMethod,
    example: PaymentMethod.STRIPE,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;
}