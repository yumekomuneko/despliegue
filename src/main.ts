/**
 * Punto de entrada principal de la aplicación NestJS.
 * Inicializa el servidor, pipes globales, parsers y Swagger.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      bodyParser: false,
    });

    // Capturar rawBody para Stripe Webhooks
    app.use(
      bodyParser.json({
        verify: (req: any, res, buf) => {
          if (req.originalUrl.startsWith('/payments/webhook')) {
            req.rawBody = buf;
          }
        },
      }),
    );

    // Urlencoded para otras rutas
    app.use(bodyParser.urlencoded({ extended: true }));

    // Validación global
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // CORS
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    // Swagger
    const config = new DocumentBuilder()
      .setTitle('E-BOND API')
      .setDescription('Documentación de la API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    // Listen correcto para Render
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');

    console.log(`🚀 Servidor corriendo en el puerto: ${port}`);
    console.log(`📘 Swagger disponible en /api`);
    console.log(`💬 Chat WebSocket disponible en /ecomerce-chat`);
    
  } catch (error) {
    console.error('Error al iniciar aplicación:', error);
    process.exit(1);
  }
}

bootstrap();
