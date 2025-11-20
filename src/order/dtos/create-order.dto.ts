import { IsInt, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear una nueva orden.
 * Se puede asociar a un usuario y a un carrito específico.
 */
export class CreateOrderDto {
    @ApiPropertyOptional({ description: 'ID del usuario que realiza la orden', example: 5 })
    @IsOptional()
    @IsInt()
    userId?: number;

    @ApiProperty({ description: 'ID del carrito asociado a la orden', example: 12 })
    @IsInt()
    cartId: number;

    @ApiPropertyOptional({ description: 'Estado inicial de la orden', example: 'pending' })
    @IsOptional()
    @IsString()
    status?: string;
}
