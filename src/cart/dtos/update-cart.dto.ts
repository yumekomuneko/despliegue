import { PartialType } from '@nestjs/mapped-types';
import { CreateCartDto } from './create-cart.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsNumber } from 'class-validator';

/**
 * DTO para actualizar un carrito de compras.
 * Permite modificar opcionalmente el propietario o los productos del carrito.
 */
export class UpdateCartDto extends PartialType(CreateCartDto) {
    @ApiPropertyOptional({ description: 'ID del usuario propietario del carrito', example: 3 })
    @IsOptional()
    @IsNumber()
    userId?: number;

    @ApiPropertyOptional({ description: 'IDs de productos a agregar o actualizar en el carrito', example: [1, 2, 5] })
    @IsOptional()
    @IsArray()
    productIds?: number[];
}
