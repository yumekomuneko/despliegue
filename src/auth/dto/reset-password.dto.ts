import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para restablecer la contraseña de un usuario.
 */
export class ResetPasswordDto {
    @ApiProperty({ description: 'Token enviado por correo para verificar la solicitud de cambio', example: 'abc123token' })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ description: 'Nueva contraseña (mínimo 6 caracteres)', example: 'newSecurePass123' })
    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    newPassword: string;
}
