import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para el inicio de sesión de un usuario.
 */
export class LoginDto {
    @ApiProperty({ description: 'Correo electrónico del usuario', example: 'usuario@correo.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Contraseña del usuario', example: 'securePassword123' })
    @IsString()
    password: string;
}
