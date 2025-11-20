import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear un detalle de orden.
 * Representa un producto dentro de una orden, incluyendo cantidad.
 */
export class CreateOrderDetailDto {
    @ApiProperty({ description: 'ID de la orden', example: 12 })
    @IsInt()
    orderId: number;

    @ApiProperty({ description: 'ID del producto', example: 5 })
    @IsInt()
    productId: number;

    @ApiProperty({ description: 'Cantidad del producto en la orden', example: 2, minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;
}
