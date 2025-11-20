/**
 * Controlador encargado de gestionar la autenticación de usuarios.
 *
 * Define los endpoints para registro, login, verificación de correo
 * y restablecimiento de contraseña.
 */

import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ============================================================
  // Registrar usuario
  // ============================================================
  /**
   * Crea un nuevo usuario en el sistema.
   */
  @Post('register')
  @ApiOperation({ summary: 'Registrar usuario' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado correctamente.',
    content: {
      'application/json': {
        example: {
          message: 'Usuario registrado exitosamente.',
          user: { id: 5, email: 'user@example.com', nombre: 'Juan Pérez' },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos.',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ============================================================
  // Verificar email con token
  // ============================================================
  /**
   * Verifica el correo electrónico del usuario mediante un token enviado por email.
   */
  @Get('verify')
  @ApiOperation({ summary: 'Verificar email con token' })
  @ApiQuery({ name: 'token', required: true, description: 'Token de verificación' })
  @ApiResponse({
    status: 200,
    description: 'Correo verificado correctamente.',
    content: {
      'application/json': {
        example: { message: 'Correo verificado exitosamente.' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido o expirado.',
    content: {
      'application/json': { example: { message: 'Token inválido o expirado.' } },
    },
  })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // ============================================================
  // Iniciar sesión
  // ============================================================
  /**
   * Permite al usuario autenticarse en el sistema.
   */
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso.',
    content: {
      'application/json': {
        example: { token: 'jwt-token-aqui', message: 'Login exitoso' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales incorrectas.',
    content: {
      'application/json': { example: { message: 'Email o contraseña incorrectos' } },
    },
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  // ============================================================
  // Solicitar restablecimiento de contraseña
  // ============================================================
  /**
   * Envía un correo con token para restablecer la contraseña del usuario.
   */
  @Post('request-reset')
  @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
  @ApiBody({ schema: { properties: { email: { type: 'string' } } } })
  @ApiResponse({
    status: 200,
    description: 'Correo de recuperación enviado.',
    content: {
      'application/json': { example: { message: 'Correo enviado correctamente.' } },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Email no encontrado.',
    content: {
      'application/json': { example: { message: 'Email no registrado.' } },
    },
  })
  requestReset(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  // ============================================================
  // Endpoint temporal para comprobar token de reseteo
  // ============================================================
  /**
   * Ruta temporal para verificar token de restablecimiento.
   * Se recomienda usar POST /auth/reset-password para completar el cambio.
   */
  @Get('reset-password')
  @ApiOperation({ summary: 'Comprobar token de reseteo (temporal)' })
  @ApiQuery({ name: 'token', required: true, description: 'Token de reseteo' })
  @ApiResponse({
    status: 200,
    description: 'Token recibido.',
    content: {
      'application/json': {
        example: {
          status: 'OK',
          message: 'Ruta temporal de prueba para restablecimiento recibida.',
          instruccion: 'Usa ahora la ruta POST /auth/reset-password.',
          token_recibido: 'token-aqui',
        },
      },
    },
  })
  showResetPasswordPage(@Query('token') token: string) {
    return { 
      status: 'OK',
      message: 'Ruta temporal de prueba para restablecimiento recibida.',
      instruccion: 'Usa ahora la ruta POST /auth/reset-password en Postman o Thunder Client.',
      token_recibido: token,
    };
  }

  // ============================================================
  // Restablecer contraseña
  // ============================================================
  /**
   * Permite restablecer la contraseña usando un token válido.
   */
  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida correctamente.',
    content: {
      'application/json': { example: { message: 'Contraseña actualizada correctamente.' } },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido o expirado.',
    content: {
      'application/json': { example: { message: 'Token inválido o expirado.' } },
    },
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}