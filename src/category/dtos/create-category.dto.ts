import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear una nueva categoría.
 */
export class CreateCategoryDto {
    @ApiProperty({ description: 'Nombre de la categoría', example: 'Electrónica' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Descripción opcional de la categoría', example: 'Productos electrónicos y gadgets' })
    @IsOptional()
    @IsString()
    description?: string;
}
