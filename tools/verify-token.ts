// verify-token.ts
import { JwtService } from '@nestjs/jwt';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjI1LCJlbWFpbCI6Inl1bWVrb211bmVrb0BnbWFpbC5jb20iLCJyb2xlIjoiY2xpZW50ZSIsImlhdCI6MTc2MzU5NjU3MiwiZXhwIjoxNzYzNjgyOTcyfQ.IMJvXvR65l_Pn1t89BxTLf1dmCJAdSbZtedqZsiXPgk";

async function verifyToken() {
    console.log('🔐 Verificando token...');
    console.log('Token:', token);
    console.log('Longitud:', token.length);
    
    const jwtService = new JwtService({
        secret: process.env.JWT_SECRET || 'super_secret_key'
    });
    
    try {
        const payload = await jwtService.verifyAsync(token);
        console.log('✅ Token VÁLIDO');
        console.log('Payload:', payload);
        console.log('User ID:', payload.sub);
        console.log('Email:', payload.email);
        console.log('Role:', payload.role);
        console.log('Expira:', new Date(payload.exp * 1000));
    } catch (error: any) {
        console.log('❌ Token INVÁLIDO');
        console.log('Error:', error.message);
        console.log('Nombre del error:', error.name);
        
        if (error.name === 'TokenExpiredError') {
            console.log('💡 El token ha expirado, genera uno nuevo');
        } else if (error.name === 'JsonWebTokenError') {
            console.log('💡 Error en el formato del token');
        }
    }
}

verifyToken();