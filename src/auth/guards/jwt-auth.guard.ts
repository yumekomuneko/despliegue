import { CanActivate, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private jwtService: JwtService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        console.log('=== JWT GUARD EXECUTED ===');
        
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        console.log('Is Public route:', isPublic);

        if (isPublic) {
            console.log('Public route - allowing access');
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        
        console.log('Authorization header:', request.headers.authorization);
        console.log('Token extracted:', !!token);

        if (!token) {
            console.log('No token found');
            throw new UnauthorizedException('Token not found');
        }

        try {
            console.log('Verifying token...');
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET || 'super_secret_key'
            });
            console.log('Token payload:', payload);
            request.user = payload;
            console.log('User set in request');
            return true;
        } catch (error) {
            console.log('Token verification FAILED:', error.message);
            throw new UnauthorizedException('Invalid token');
        }
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}