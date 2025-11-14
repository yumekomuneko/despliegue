import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
    ) {}

    async findAll(): Promise<User[]> {
        return this.usersRepo.find();
    }

    async findOne(id: number): Promise<User> {
        const user = await this.usersRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }

    async update(id: number, dto: UpdateUserDto, currentUser?: User) {
        const user = await this.findOne(id);

        // Previene que un usuario no admin cambie roles
        if (currentUser && currentUser.role !== UserRole.ADMIN) {
        delete dto.role;
        }
        
        if (dto.password) {
        dto.password = await argon2.hash(dto.password);
        }

        Object.assign(user, dto);
        return this.usersRepo.save(user);
    }
}
