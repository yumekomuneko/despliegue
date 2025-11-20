import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';

import {
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiQuery,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';

import { ProductService } from './product.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    // ============================================================
    // CRUD BÁSICO
    // ============================================================

    /** Listar todos los productos */
    @Get()
    @ApiOperation({ summary: 'Listar todos los productos' })
    findAll() {
        return this.productService.findAll();
    }

    /** Obtener un producto por ID */
    @Get(':id')
    @ApiOperation({ summary: 'Obtener producto por ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productService.findOne(id);
    }

    /** Crear un producto (solo ADMIN) */
    @Roles(UserRole.ADMIN)
    @Post()
    @ApiOperation({ summary: 'Crear un producto (ADMIN)' })
    create(@Body() dto: CreateProductDto) {
        return this.productService.create(dto);
    }

    /** Actualizar un producto (solo ADMIN) */
    @Roles(UserRole.ADMIN)
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar un producto (ADMIN)' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateProductDto,
    ) {
        return this.productService.update(id, dto);
    }

    /** Eliminar un producto (solo ADMIN) */
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar un producto (ADMIN)' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.productService.remove(id);
    }

    // ============================================================
    // IMPORTAR PRODUCTOS TECH DESDE DUMMYJSON (ADMIN)
    // ============================================================

    @Post('import/tech')
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Importar productos tecnológicos desde DummyJSON (solo ADMIN)',
        description:
            'Esta operación trae productos desde DummyJSON y los guarda en tu base de datos.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                categoryIds: {
                    type: 'array',
                    items: { type: 'number' },
                    example: [1, 3, 5],
                    description:
                        'Opcional: Categorías donde asignar los productos importados.',
                },
            },
        },
    })
    async importTechProducts(@Body() body: { categoryIds?: number[] }) {
        return await this.productService.importTechProductsFromDummyJSON(
            body.categoryIds,
        );
    }

    // ============================================================
    // BUSCAR PRODUCTOS TECH EXTERNOS
    // ============================================================

    @Get('external/search')
    @ApiOperation({
        summary: 'Buscar productos tecnológicos en DummyJSON',
        description: 'Permite buscar productos tech externos por texto.',
    })
    @ApiQuery({
        name: 'q',
        required: true,
        example: 'laptop',
        description: 'Término a buscar en el API de DummyJSON.',
    })
    async searchExternalProducts(@Query('q') query: string) {
        if (!query) return { message: 'Query parameter "q" is required' };
        return await this.productService.searchExternalTechProducts(query);
    }

    // ============================================================
    // OBTENER PRODUCTOS TECH EXTERNOS SIN FILTRO
    // ============================================================

    @Get('external/tech')
    @ApiOperation({
        summary: 'Obtener todos los productos tech desde DummyJSON',
        description: 'Lista completa de productos tecnológicos externos.',
    })
    async getExternalTechProducts() {
        return await this.productService.getExternalTechProducts();
    }
}

