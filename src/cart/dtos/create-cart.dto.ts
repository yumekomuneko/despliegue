import { IsNumber, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear un carrito de compras.
 */
export class CreateCartDto {
    @ApiProperty({ description: 'ID del usuario propietario del carrito', example: 3 })
    @IsNumber()
    userId: number;

    @ApiPropertyOptional({ description: 'IDs de productos a agregar al carrito', example: [1, 2, 5] })
    @IsOptional()
    @IsArray()
    productIds?: number[];
}
