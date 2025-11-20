import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Controlador principal de la aplicación.
 *
 * Esta ruta suele utilizarse:
 * - Para pruebas rápidas del servidor.
 * - Para verificar que el backend está en ejecución.
 * - Para devolver un mensaje o información básica del proyecto.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * GET /
   * 
   * Endpoint raíz del servidor.
   * Devuelve un mensaje simple desde el AppService.
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
