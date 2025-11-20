import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo rol en el sistema.
 */
export class CreateRoleDto {
    @ApiProperty({
        description: 'Nombre del rol',
        example: 'ADMIN',
        minLength: 3,
    })
    @IsString()
    @MinLength(3)
    nombre: string;

    @ApiPropertyOptional({
        description: 'Descripción del rol',
        example: 'Rol con permisos administrativos completos',
    })
    @IsOptional()
    @IsString()
    descripcion?: string;
}