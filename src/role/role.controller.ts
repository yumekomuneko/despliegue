/**
 * Controlador encargado de gestionar los roles del sistema.
 *
 * Define endpoints para crear, consultar, actualizar y eliminar roles.
 * Los endpoints de actualización y eliminación requieren rol ADMIN.
 */

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';

import { RoleService } from './role.service';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
    ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    // ============================================================
    // GET /roles
    // ============================================================
    @Get()
    @ApiOperation({ summary: 'Listar todos los roles' })
    @ApiResponse({ status: 200, description: 'Roles obtenidos correctamente.' })
    findAll() {
        return this.roleService.findAll();
    }

    // ============================================================
    // GET /roles/:id
    // ============================================================
    @Get(':id')
    @ApiOperation({ summary: 'Obtener un rol por ID' })
    @ApiParam({ name: 'id', type: Number, example: 1 })
    @ApiResponse({ status: 200, description: 'Rol obtenido correctamente.' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado.' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.roleService.findOne(id);
    }

    // ============================================================
    // POST /roles
    // ============================================================
    @Post()
    @ApiOperation({ summary: 'Crear un nuevo rol' })
    @ApiBody({ type: CreateRoleDto })
    @ApiResponse({ status: 201, description: 'Rol creado exitosamente.' })
    @ApiResponse({ status: 400, description: 'Datos inválidos.' })
    create(@Body() dto: CreateRoleDto) {
        return this.roleService.create(dto);
    }

    // ============================================================
    // PATCH /roles/:id  (ADMIN)
    // ============================================================
    @Roles(UserRole.ADMIN)
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar un rol por ID (solo ADMIN)' })
    @ApiParam({ name: 'id', type: Number, example: 1 })
    @ApiBody({ type: UpdateRoleDto })
    @ApiResponse({ status: 200, description: 'Rol actualizado correctamente.' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado.' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
        return this.roleService.update(id, dto);
    }

    // ============================================================
    // DELETE /roles/:id  (ADMIN)
    // ============================================================
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar un rol por ID (solo ADMIN)' })
    @ApiParam({ name: 'id', type: Number, example: 1 })
    @ApiResponse({ status: 200, description: 'Rol eliminado correctamente.' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado.' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.roleService.remove(id);
    }
}