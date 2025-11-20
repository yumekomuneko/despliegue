import { IsEmail, IsString, MinLength, IsOptional, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../user/entities/user.entity';

/**
 * DTO para registrar un nuevo usuario.
 */
export class RegisterDto {
    @ApiProperty({ description: 'Correo electrónico del usuario', example: 'usuario@correo.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'Contraseña del usuario (mínimo 6 caracteres)', example: 'securePass123' })
    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    password: string;

    @ApiProperty({ description: 'Nombre del usuario', example: 'Juan' })
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @ApiProperty({ description: 'Apellido del usuario', example: 'Pérez' })
    @IsString()
    @IsNotEmpty()
    apellido: string;

    @ApiPropertyOptional({ description: 'Teléfono del usuario', example: '+573001234567' })
    @IsString()
    @IsOptional()
    telefono?: string;

    @ApiPropertyOptional({ description: 'Rol del usuario', enum: UserRole, example: UserRole.CLIENT })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}