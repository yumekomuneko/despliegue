import { Injectable } from '@nestjs/common';

/**
 * Servicio principal de la aplicación.
 *
 * Su propósito suele ser:
 * - Proveer datos simples para probar que el backend está activo.
 * - Servir como ejemplo inicial de inyección de dependencias.
 */
@Injectable()
export class AppService {

  /**
   * Devuelve un mensaje simple utilizado normalmente
   * para comprobar el funcionamiento del servidor.
   *
   * @returns Mensaje de estado básico.
   */
  getHello(): string {
    return '¡BIENVENIDOS SOMOS E-BOND!';
  }
}
