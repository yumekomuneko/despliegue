import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDetailDto } from './create-order-detail.dto';
import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para actualizar un detalle de orden.
 * Permite modificar campos específicos de un producto dentro de una orden.
 */
export class UpdateOrderDetailDto extends PartialType(CreateOrderDetailDto) {
    @ApiPropertyOptional({ description: 'Cantidad del producto en la orden', example: 3, minimum: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    quantity?: number;
}
