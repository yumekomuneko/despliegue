import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para agregar o actualizar un producto en el carrito.
 */
export class AddCartItemDto {
    @ApiProperty({ description: 'ID del producto a agregar', example: 5 })
    @IsNotEmpty()
    @IsInt()
    productId: number;

    @ApiProperty({ description: 'Cantidad de unidades del producto', example: 2, minimum: 1 })
    @IsNotEmpty()
    @IsInt()
    @Min(1, { message: 'La cantidad debe ser al menos 1' })
    quantity: number;
}