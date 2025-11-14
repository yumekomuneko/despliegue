import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
    constructor(private readonly userService: UserService) {}

    /** 🧍 Perfil del usuario autenticado */
    @Get('profile')
    async getProfile(@Request() req) {
        const user = await this.userService.findOne(req.user.userId);
        if (!user) throw new ForbiddenException('Usuario no encontrado');
        return user;
    }

    /** 👑 Listar todos los usuarios (solo ADMIN) */
    @Get()
    @Roles(UserRole.ADMIN)
    async findAll() {
        return this.userService.findAll();
    }

    /** 🧠 Obtener usuario por ID (solo ADMIN) */
    @Get(':id')
    @Roles(UserRole.ADMIN)
    async findOne(@Param('id') id: number) {
        return this.userService.findOne(id);
    }

    /** ✏️ Actualizar datos del usuario autenticado */
    @Patch('update')
    async updateProfile(@Request() req, @Body() dto: UpdateUserDto) {
        return this.userService.update(req.user.userId, dto);
    }
}
