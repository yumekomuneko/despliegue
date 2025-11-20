import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para actualizar una orden existente.
 * Permite modificar únicamente los campos que se envían en la solicitud.
 */
export class UpdateOrderDto extends PartialType(CreateOrderDto) {
    @ApiPropertyOptional({ description: 'Estado de la orden', example: 'completed' })
    @IsOptional()
    @IsString()
    status?: string;
}
