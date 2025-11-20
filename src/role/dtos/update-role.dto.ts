import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para actualizar un rol existente.
 * 
 * Todos los campos son opcionales y permiten modificar únicamente
 * los que el usuario proporcione.
 */
export class UpdateRoleDto extends PartialType(CreateRoleDto) {
    @ApiPropertyOptional({
        description: 'Nombre del rol',
        example: 'ADMIN',
        minLength: 3,
    })
    nombre?: string;

    @ApiPropertyOptional({
        description: 'Descripción del rol',
        example: 'Rol con permisos administrativos completos',
    })
    descripcion?: string;
}
