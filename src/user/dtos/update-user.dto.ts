import { IsOptional, IsEnum, IsString, MinLength, IsEmail } from 'class-validator';
import { UserRole } from '../entities/user.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para actualizar un usuario existente.
 *
 * Todas las propiedades son opcionales para permitir actualizaciones parciales.
 */
export class UpdateUserDto {
    @ApiPropertyOptional({ description: 'Nombre del usuario', example: 'Juan' })
    @IsOptional()
    @IsString()
    nombre?: string;

    @ApiPropertyOptional({ description: 'Apellido del usuario', example: 'Pérez' })
    @IsOptional()
    @IsString()
    apellido?: string;

    @ApiPropertyOptional({ description: 'Correo electrónico del usuario', example: 'juan@example.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ description: 'Teléfono del usuario', example: '+573001234567' })
    @IsOptional()
    @IsString()
    telefono?: string;

    @ApiPropertyOptional({ description: 'Contraseña del usuario (mínimo 6 caracteres)', example: 'secure123' })
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @ApiPropertyOptional({ description: 'Rol del usuario', enum: UserRole, example: UserRole.CLIENT })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}