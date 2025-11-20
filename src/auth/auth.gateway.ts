import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class AuthGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'super_secret_key'
      });

      client.data.user = payload;

      console.log(`Usuario ${payload.email} conectado`);
    } catch (error) {
      console.error('Error de autenticación:', error);
      client.disconnect();
      return;
    }
  }

  handleDisconnect(client: Socket) {
    const userPayload = client.data.user;

    if (userPayload) {
      console.log(`Usuario ${userPayload.email} desconectado`);
    } else {
      console.log('Usuario no autenticado desconectado');
    }
  }
}

