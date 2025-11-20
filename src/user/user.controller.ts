/**
 * Controlador encargado de gestionar las operaciones relacionadas con los usuarios.
 *
 * Incluye endpoints para consultar perfiles, listar usuarios, crear, actualizar
 * y eliminar registros. Además distingue entre acciones de usuario autenticado
 * y operaciones exclusivas del rol ADMIN.
 *
 * Todas las rutas están protegidas con autenticación JWT y verificación de roles,
 * excepto la creación, que puede configurarse como pública según sea necesario.
 */

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    ParseIntPipe,
    UseGuards,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';

import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from './entities/user.entity';

import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
    constructor(private readonly userService: UserService) {}

    // =========================================================================
    // Obtener perfil del usuario autenticado
    // =========================================================================

    /**
     * Retorna la información del usuario autenticado mediante su token JWT.
     *
     * Esta ruta permite que cada usuario consulte únicamente su propio perfil.
     */
    @Get('profile')
    @ApiOperation({
        summary: 'Obtener el perfil del usuario autenticado',
        description:
            'Devuelve los datos del usuario que realiza la petición, basándose en el token JWT enviado.',
    })
    @ApiResponse({
        status: 200,
        description: 'Perfil obtenido correctamente.',
        content: {
            'application/json': {
                example: {
                    userId: 12,
                    name: 'María Gómez',
                    email: 'maria@example.com',
                    role: 'client',
                },
            },
        },
    })
    @ApiResponse({
        status: 403,
        description: 'Usuario no encontrado o acceso denegado.',
    })
    async getProfile(@Request() req: any) {
        const user = await this.userService.findOne(req.user.usub);
        if (!user) throw new ForbiddenException('Usuario no encontrado');
        return user;
    }

    // =========================================================================
    // Listar todos los usuarios (ADMIN)
    // =========================================================================

    /**
     * Obtiene una lista completa de los usuarios registrados.
     *
     * Solo accesible por usuarios con rol ADMIN.
     */
    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Listar todos los usuarios (solo ADMIN)',
        description:
            'Retorna todos los usuarios disponibles en la base de datos. Solo administradores autorizados pueden acceder.',
    })
    @ApiResponse({
        status: 200,
        description: 'Usuarios listados correctamente.',
        content: {
            'application/json': {
                example: {
                    data: [
                        {
                            id: 1,
                            name: 'Admin Principal',
                            email: 'admin@example.com',
                            role: 'admin',
                        },
                        {
                            id: 2,
                            name: 'Carlos Pérez',
                            email: 'carlos@example.com',
                            role: 'client',
                        },
                    ],
                },
            },
        },
    })
    @ApiResponse({
        status: 403,
        description: 'Acceso denegado: se requiere rol ADMIN.',
    })
    async findAll() {
        return this.userService.findAll();
    }

    // =========================================================================
    // Obtener usuario por ID (ADMIN)
    // =========================================================================

    /**
     * Consulta los datos de un usuario específico por su ID.
     *
     * Solo accesible por administradores.
     */
    @Get(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Obtener un usuario por ID (solo ADMIN)',
    })
    @ApiParam({ name: 'id', example: 5 })
    @ApiResponse({
        status: 200,
        description: 'Usuario obtenido correctamente.',
        content: {
            'application/json': {
                example: {
                    id: 5,
                    name: 'Ana López',
                    email: 'ana@example.com',
                    role: 'client',
                },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Usuario no encontrado.',
    })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findOne(id);
    }

    // =========================================================================
    // Crear usuario (PUBLIC o ADMIN según configuración)
    // =========================================================================

    /**
     * Registra un nuevo usuario en el sistema.
     *
     * Esta ruta está decorada como @Public(), permitiendo el registro sin autenticación.
     * Puedes quitar el decorador si solo ADMIN debe crear usuarios.
     */
    @Post()
    @Public()
    @ApiOperation({
        summary: 'Crear un nuevo usuario',
        description:
            'Registra un nuevo usuario. Puede configurarse para ser público o exclusivo para administradores.',
    })
    @ApiBody({
        type: CreateUserDto,
        examples: {
            exitoso: {
                summary: 'Registro exitoso',
                value: {
                    name: 'Laura Rincón',
                    email: 'laura@example.com',
                    password: 'secure123',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Usuario creado correctamente.',
    })
    @ApiResponse({
        status: 400,
        description: 'Datos inválidos o error de validación.',
    })
    async create(@Body() dto: CreateUserDto) {
        return this.userService.create(dto);
    }

    // =========================================================================
    // Actualizar perfil propio del usuario autenticado
    // =========================================================================

    /**
     * Permite que un usuario autenticado actualice su propio perfil.
     */
    @Patch('update')
    @ApiOperation({
        summary: 'Actualizar el perfil del usuario autenticado',
    })
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({
        status: 200,
        description: 'Perfil actualizado correctamente.',
    })
    @ApiResponse({
        status: 400,
        description: 'Datos inválidos.',
    })
    async updateProfile(@Request() req: any, @Body() dto: UpdateUserDto) {
        return this.userService.update(req.user.userId, dto);
    }

    // =========================================================================
    // Actualizar usuario por ID (ADMIN)
    // =========================================================================

    /**
     * Actualiza cualquier usuario del sistema mediante su ID.
     *
     * Solo accesible para administradores.
     */
    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Actualizar un usuario por ID (solo ADMIN)',
    })
    @ApiParam({ name: 'id', example: 5 })
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({
        status: 200,
        description: 'Usuario actualizado correctamente.',
    })
    @ApiResponse({
        status: 404,
        description: 'Usuario no encontrado.',
    })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
        return this.userService.update(id, dto);
    }

    // =========================================================================
    // Eliminar usuario (ADMIN)
    // =========================================================================

    /**
     * Elimina a un usuario del sistema.
     *
     * Solo accesible para administradores.
     */
    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Eliminar un usuario por ID (solo ADMIN)',
    })
    @ApiParam({ name: 'id', example: 5 })
    @ApiResponse({
        status: 200,
        description: 'Usuario eliminado correctamente.',
        content: {
            'application/json': {
                example: {
                    message: 'Usuario eliminado exitosamente.',
                    deletedId: 5,
                },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Usuario no encontrado.',
    })
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.userService.delete(id);
    }
}