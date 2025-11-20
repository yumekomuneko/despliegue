/**
 * Punto de entrada principal de la aplicación NestJS.
 * Aquí se inicializa el servidor, se configuran los pipes globales,
 * parsers personalizados y la documentación Swagger.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  try {
    /**
     * Creación de la aplicación NestJS.
     * - `bodyParser: false` desactiva el parser interno de Nest
     *    para permitir capturar el rawBody manualmente.
     */
    const app = await NestFactory.create(AppModule, {
      bodyParser: false,
    });

    /**
     * Configuración manual de body-parser para capturar rawBody,
     * especialmente requerido para validación de webhooks (ej. Stripe).
     * - Solo aplica a la ruta `/payments/webhook`
     */
    app.use(
      bodyParser.json({
        verify: (req: any, res, buf) => {
          if (req.originalUrl.startsWith('/payments/webhook')) {
            req.rawBody = buf; // Guarda el raw body para la verificación de la firma
          }
        },
      }),
    );

    /**
     * Parser urlencoded para soportar formularios
     * en el resto de las rutas del backend.
     */
    app.use(bodyParser.urlencoded({ extended: true }));

    /**
     * Pipes globales de validación de DTOs.
     *
     * - `whitelist`: elimina propiedades no permitidas.
     * - `forbidNonWhitelisted`: lanza error ante campos desconocidos.
     * - `transform`: convierte automáticamente los tipos de datos.
     */
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Configuración de CORS
    app.enableCors({
      origin: process.env.CORS_ORIGIN || true,
      credentials: true,
    });

    // -------------------------------------------------------------
    // 🚀 CONFIGURACIÓN SWAGGER — Documentación Interactiva
    // -------------------------------------------------------------
    /**
     * Configuración base del documento Swagger.
     *
     * - `addBearerAuth()`: habilita el botón "Authorize" para JWT.
     * - `setDescription()`: descripción visible en el panel Swagger.
     */
    const config = new DocumentBuilder()
      .setTitle('E-BOND API')
      .setDescription('Documentación de la API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    // Generar documento Swagger a partir de los decoradores
    const document = SwaggerModule.createDocument(app, config);

    /**
     * Ruta donde estará disponible el panel Swagger.
     * Ejemplo: http://localhost:3000/api
     */
    SwaggerModule.setup('api', app, document);
    // -------------------------------------------------------------

    // ✅ SOLO UN app.listen() - Inicialización del servidor
    const port = process.env.PORT ?? 3000;
    await app.listen(port);

    // Logs informativos
    console.log(`🚀 Servidor corriendo en: http://localhost:${port}`);
    console.log(`📘 Swagger disponible en: http://localhost:${port}/api`);
    console.log(`💬 Chat disponible en: http://localhost:${port}/ecomerce-chat`);

  } catch (error) {
    console.error('Error al iniciar aplicación:', error);
    process.exit(1);
  }
}

bootstrap();