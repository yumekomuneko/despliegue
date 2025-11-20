import { IsString, IsEmail, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para la creación de un nuevo usuario.
 *
 * Define las propiedades requeridas y opcionales para registrar un usuario
 * en el sistema.
 */
export class CreateUserDto {
    @ApiProperty({ description: 'Nombre del usuario', example: 'Juan' })
    @IsString()
    nombre: string;

    @ApiProperty({ description: 'Apellido del usuario', example: 'Pérez' })
    @IsString()
    apellido: string;

    @ApiProperty({ description: 'Correo electrónico del usuario', example: 'juan@example.com' })
    @IsEmail()
    email: string;

    @ApiPropertyOptional({ description: 'Teléfono del usuario', example: '+573001234567' })
    @IsOptional()
    @IsString()
    telefono?: string;

    @ApiProperty({ description: 'Contraseña del usuario (mínimo 6 caracteres)', example: 'secure123' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiPropertyOptional({ description: 'Rol del usuario', enum: UserRole, example: UserRole.CLIENT })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}