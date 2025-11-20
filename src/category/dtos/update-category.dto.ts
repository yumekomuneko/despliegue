import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO para actualizar una categoría existente.
 * Todos los campos son opcionales.
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @ApiPropertyOptional({ description: 'Nombre de la categoría', example: 'Electrónica' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Descripción de la categoría', example: 'Productos electrónicos y gadgets' })
    @IsOptional()
    @IsString()
    description?: string;
}
