/**
 * Controlador encargado de gestionar las operaciones del módulo de Categorías.
 *
 * Define los endpoints para crear, leer, actualizar y eliminar categorías.
 * 
 * Todas las rutas están protegidas mediante autenticación JWT y verificación de roles.
 * Solo los usuarios con rol `ADMIN` pueden crear, actualizar o eliminar categorías.
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
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    // ============================================================
    // Obtener todas las categorías
    // ============================================================

    /**
     * Devuelve la lista completa de categorías registradas.
     */
    @Get()
    @ApiOperation({ summary: 'Obtener todas las categorías' })
    @ApiResponse({
        status: 200,
        description: 'Lista de categorías devuelta correctamente.',
        content: {
            'application/json': {
                example: {
                    data: [
                        { category_id: 1, name: 'Electrónica' },
                        { category_id: 2, name: 'Ropa' },
                    ],
                },
            },
        },
    })
    findAll() {
        return this.categoryService.findAll();
    }

    // ============================================================
    // Obtener categoría por ID
    // ============================================================

    /**
     * Obtiene los datos de una categoría específica por su ID.
     */
    @Get(':id')
    @ApiOperation({ summary: 'Obtener una categoría por ID' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({
        status: 200,
        description: 'Categoría encontrada correctamente.',
        content: {
            'application/json': {
                example: { category_id: 1, name: 'Electrónica' },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Categoría no encontrada.',
        content: {
            'application/json': {
                example: { statusCode: 404, message: 'Categoría no encontrada', error: 'Not Found' },
            },
        },
    })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.categoryService.findOne(id);
    }

    // ============================================================
    // Crear nueva categoría (ADMIN)
    // ============================================================

    /**
     * Crea una nueva categoría en el sistema.
     *
     * Solo accesible por usuarios con rol `ADMIN`.
     */
    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Crear una nueva categoría (ADMIN)' })
    @ApiBody({
        type: CreateCategoryDto,
        examples: {
            exitoso: {
                summary: 'Categoría creada correctamente',
                value: { name: 'Hogar' },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Categoría creada correctamente.',
        content: {
            'application/json': {
                example: { message: 'Categoría creada correctamente.', data: { category_id: 3, name: 'Hogar' } },
            },
        },
    })
    @ApiResponse({
        status: 403,
        description: 'No autorizado. Solo el ADMIN puede crear categorías.',
    })
    create(@Body() dto: CreateCategoryDto) {
        return this.categoryService.create(dto);
    }

    // ============================================================
    // Actualizar categoría (ADMIN)
    // ============================================================

    /**
     * Actualiza los datos de una categoría existente.
     *
     * Solo accesible por usuarios con rol `ADMIN`.
     */
    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Actualizar una categoría existente (ADMIN)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiBody({
        type: UpdateCategoryDto,
        examples: {
            exitoso: { summary: 'Actualización exitosa', value: { name: 'Tecnología' } },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Categoría actualizada correctamente.',
        content: {
            'application/json': {
                example: { message: 'Categoría actualizada correctamente.', data: { category_id: 1, name: 'Tecnología' } },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Categoría no encontrada.',
    })
    @ApiResponse({
        status: 403,
        description: 'No autorizado.',
    })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
        return this.categoryService.update(id, dto);
    }

    // ============================================================
    // Eliminar categoría (ADMIN)
    // ============================================================

    /**
     * Elimina una categoría del sistema.
     *
     * Solo accesible por usuarios con rol `ADMIN`.
     */
    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Eliminar una categoría (ADMIN)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({
        status: 200,
        description: 'Categoría eliminada correctamente.',
        content: {
            'application/json': {
                example: { message: 'Categoría eliminada correctamente.', deletedId: 1 },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Categoría no encontrada.',
        content: {
            'application/json': {
                example: { statusCode: 404, message: 'Categoría no encontrada', error: 'Not Found' },
            },
        },
    })
    @ApiResponse({
        status: 403,
        description: 'No autorizado.',
    })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.categoryService.remove(id);
    }
}