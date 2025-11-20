/**
 * Punto de entrada principal de la aplicación NestJS.
 * Configuración de seguridad, validaciones, Swagger y parsers.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      bodyParser: false,
      logger:
        process.env.NODE_ENV === 'production'
          ? ['error', 'warn', 'log']
          : ['log', 'debug', 'error', 'warn', 'verbose'],
    });

    // -----------------------------
    // Seguridad con Helmet
    // -----------------------------
    app.use(helmet());

    // -----------------------------
    // Body Parser con soporte para rawBody (Stripe)
    // -----------------------------
    app.use(
      bodyParser.json({
        verify: (req: any, res, buf) => {
          if (req.originalUrl.startsWith('/payments/webhook')) {
            req.rawBody = buf;
          }
        },
      }),
    );

    app.use(bodyParser.urlencoded({ extended: true }));

    // -----------------------------
    // Validación global de DTOs
    // -----------------------------
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // -----------------------------
    // Configuración de CORS (Producción o Desarrollo)
    // -----------------------------
    app.enableCors({
      origin:
        process.env.NODE_ENV === 'production'
          ? [
              'https://tu-dominio.com',
              'https://www.tu-dominio.com',
            ]
          : '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    // -----------------------------
    // Swagger SOLO si NO estamos en producción
    // -----------------------------
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('E-BOND API')
        .setDescription('Documentación de la API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api', app, document);

      console.log('📘 Swagger habilitado en /api (solo en desarrollo)');
    }

    // -----------------------------
    // Server: escuchar en 0.0.0.0 para despliegue cloud
    // -----------------------------
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');

    console.log(`🚀 Servidor corriendo en el puerto: ${port}`);
    console.log(`💬 Chat WebSocket disponible en /ecomerce-chat`);

  } catch (error) {
    console.error('❌ Error al iniciar la aplicación:', error);
    process.exit(1);
  }
}

bootstrap();

