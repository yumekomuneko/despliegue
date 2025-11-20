import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

interface ChatContext {
  currentStep: string;
  comparisonProducts?: string[];
}

@WebSocketGateway({
  cors: {
    origin: "*",
  },
  namespace: '/ecommerce-chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  private chatContexts = new Map<string, ChatContext>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService
  ) {}

  // --- Lifecycle: conexión ---
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      // Intentar validar token si existe
      if (token) {
        try {
          const payload = await this.jwtService.verifyAsync(token as string);
          client.data.user = {
            sub: payload.sub,
            email: payload.email,
            role: payload.role
          };
          this.logger.log(`✅ Usuario autenticado: ${payload.email} (ID: ${payload.sub})`);
        } catch (err) {
          this.logger.warn('❌ Token inválido o expirado, conectando como invitado');
          client.data.user = { sub: 'guest', role: 'guest' };
        }
      } else {
        client.data.user = { sub: 'guest', role: 'guest' };
        this.logger.log(`🔗 Cliente conectado como invitado: ${client.id}`);
      }

      // dentro de handleConnection, después de setear client.data.user (o en su try/catch)
  client.on('authenticate', async (payload: any) => {
    const incoming = payload?.token || payload?.auth?.token || payload;
    if (!incoming) {
      client.emit('auth_failed', { reason: 'no_token' });
      return;
    }
    try {
      const payloadObj = await this.jwtService.verifyAsync(String(incoming));
      client.data.user = {
        sub: payloadObj.sub,
        email: payloadObj.email,
        role: payloadObj.role
      };
      this.logger.log(`✅ Autenticación por evento: ${payloadObj.email} (ID: ${payloadObj.sub})`);
      client.emit('authenticated', { user: client.data.user });
    } catch (err) {
      this.logger.warn('❌ authenticate event - token inválido:', err?.message || err);
      client.emit('auth_failed', { reason: err?.message || 'invalid_token' });
    }
  });

// también alias (opcionales)
client.on('auth', (p) => client.emit('authenticate', p));
client.on('login', (p) => client.emit('authenticate', p));


      // Inicializar contexto
      this.chatContexts.set(client.id, { currentStep: 'welcome' });

      // Mensaje de bienvenida
      client.emit('bot_message', {
        type: 'welcome',
        message: '¡Hola! Soy E-BOND tu asistente virtual. ¿En qué puedo ayudarte?',
        options: [
          'Consultar disponibilidad de productos',
          'Comparar productos',
          'Consultar garantías',
          'Consultar Métodos de pago'
        ]
      });

      this.logger.log(`Cliente conectado: ${client.id}`);
    } catch (error) {
      this.logger.error('Error en handleConnection:', error);
      // Aún así permitir conexión de prueba
      client.data.user = { sub: 'guest', role: 'guest' };
      this.chatContexts.set(client.id, { currentStep: 'welcome' });
      client.emit('bot_message', {
        type: 'welcome',
        message: '¡Hola! Modo prueba activado. ¿En qué puedo ayudarte?',
        options: [
          'Consultar disponibilidad de productos',
          'Comparar productos',
          'Consultar garantías',
          'Consultar Métodos de pago'
        ]
      });
    }
  }

  // --- Lifecycle: desconexión ---
  handleDisconnect(client: Socket) {
    this.chatContexts.delete(client.id);
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  // --- Mensajes entrantes ---
  @SubscribeMessage('customer_message')
  async handleCustomerMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { message: string; option?: number }
  ) {
    const context = this.chatContexts.get(client.id);
    if (!context) {
      client.emit('bot_message', {
        type: 'error',
        message: 'Sesión no encontrada. Por favor recarga la página.'
      });
      return;
    }

    const customerId = client.data.user?.sub ?? 'guest';

    try {
      switch (context.currentStep) {
        case 'welcome':
          await this.handleWelcomeResponse(client, data, context);
          break;
        case 'product_availability':
          await this.handleProductAvailability(client, data.message, customerId, context);
          break;
        case 'product_comparison':
          await this.handleProductComparison(client, data.message, context);
          break;
        case 'warranty_info':
          await this.handleWarrantyInfo(client, data.message, context);
          break;
        case 'pay_methods':
          await this.handlepayMethods(client, data.message, context);
          break;
        default:
          await this.handleGeneralInquiry(client, data.message, customerId, context);
      }
    } catch (error) {
      this.logger.error('Error procesando mensaje:', error);
      client.emit('bot_message', {
        type: 'error',
        message: '❌ Lo siento, hubo un error procesando tu solicitud.'
      });
    }
  }

  // --- Handlers ---
  private async handleGeneralInquiry(
    client: Socket,
    message: string,
    customerId: string | number,
    context: ChatContext
  ) {
    client.emit('bot_message', {
      type: 'general_response',
      message: 'Te recomiendo usar las opciones del menú para obtener información específica sobre productos.',
      options: [
        'Consultar disponibilidad de productos',
        'Comparar productos',
        'Consultar garantías',
        'Consultar Métodos de pago'
      ]
    });

    context.currentStep = 'welcome';
  }

  private async handleWelcomeResponse(client: Socket, data: any, context: ChatContext) {
    const option = data.option;

    switch (option) {
      case 0: // Consultar disponibilidad
        context.currentStep = 'product_availability';
        client.emit('bot_message', {
          type: 'product_availability_prompt',
          message: '¿Qué producto te interesa consultar? Por favor ingresa el nombre del producto.'
        });
        break;

      case 1: // Comparar productos
        context.currentStep = 'product_comparison';
        context.comparisonProducts = [];
        client.emit('bot_message', {
          type: 'product_comparison_prompt',
          message: 'Ingresa el nombre del primer producto que quieres comparar:'
        });
        break;

      case 2: // Consultar garantías
        context.currentStep = 'warranty_info';
        client.emit('bot_message', {
          type: 'warranty_prompt',
          message: '¿De qué producto quieres consultar la garantía? Ingresa el nombre:'
        });
        break;

      case 3: // Consultar métodos de pago
        context.currentStep = 'pay_methods';
        {
          const paymentMethodsInfo = await this.chatService.getPaymentMethodsInfo();
          client.emit('bot_message', {
            type: 'payment_methods',
            message: paymentMethodsInfo.message,
            methods: paymentMethodsInfo.methods,
            options: ['Volver al menú principal', 'Consultar otra información']
          });
        }
        break;

      case 4: // Ver pedidos
        // Ejecutar y regresar al menú
        await this.handleViewOrders(client, context);
        context.currentStep = 'welcome';
        break;

      default:
        client.emit('bot_message', {
          type: 'options',
          message: 'Por favor selecciona una opción del menú:',
          options: [
            'Consultar disponibilidad de productos',
            'Comparar productos',
            'Consultar garantías',
            'Consultar Métodos de pago'
          ]
        });
    }
  }

  private async handleProductAvailability(
    client: Socket,
    productQuery: string,
    customerId: string | number,
    context: ChatContext
  ) {
    const result = await this.chatService.checkProductAvailability(productQuery, String(customerId));

    client.emit('bot_message', {
      type: 'product_availability',
      message: result.message,
      product: result.product,
      stock: result.stock,
      recommendations: result.recommendations,
      available: result.available
    });

    // Volver al menú principal
    context.currentStep = 'welcome';
    client.emit('bot_message', {
      type: 'options',
      message: '¿En qué más puedo ayudarte?',
      options: [
        'Consultar disponibilidad de productos',
        'Comparar productos',
        'Consultar garantías',
        'Consultar Métodos de pago'
      ]
    });
  }

  private async handleProductComparison(client: Socket, productQuery: string, context: ChatContext) {
    if (!context.comparisonProducts) context.comparisonProducts = [];

    if (context.comparisonProducts.length < 2) {
      context.comparisonProducts.push(productQuery);

      if (context.comparisonProducts.length === 1) {
        client.emit('bot_message', {
          type: 'product_comparison_next',
          message: 'Ahora ingresa el segundo producto para comparar:'
        });
        return;
      }
    }

    const result = await this.chatService.compareProducts(context.comparisonProducts);

    client.emit('bot_message', {
      type: 'product_comparison',
      message: result.message,
      products: result.products,
      success: result.success
    });

    context.currentStep = 'welcome';
    context.comparisonProducts = [];
  }

  private async handleWarrantyInfo(client: Socket, productQuery: string, context: ChatContext) {
    const warrantyInfo = await this.chatService.getWarrantyInfo(productQuery);

    client.emit('bot_message', {
      type: 'warranty_info',
      message: warrantyInfo.message,
      product: warrantyInfo.product,
      warranty: warrantyInfo.warranty,
      found: warrantyInfo.found
    });

    context.currentStep = 'welcome';
  }

  private async handlepayMethods(client: Socket, message: string, context: ChatContext) {
    try {
      const paymentMethodsInfo = await this.chatService.getPaymentMethodsInfo();

      client.emit('bot_message', {
        type: 'payment_methods',
        message: paymentMethodsInfo.message,
        methods: paymentMethodsInfo.methods,
        securityInfo: paymentMethodsInfo.securityInfo || {
          encrypted: true,
          fraudProtection: true,
          moneyBackGuarantee: true
        }
      });

      context.currentStep = 'welcome';
      client.emit('bot_message', {
        type: 'options',
        message: '¿En qué más puedo ayudarte?',
        options: [
          'Consultar disponibilidad de productos',
          'Comparar productos',
          'Consultar garantías',
          'Consultar Métodos de pago'
        ]
      });
    } catch (error) {
      this.logger.error('Error obteniendo métodos de pago:', error);
      client.emit('bot_message', {
        type: 'error',
        message: 'Lo siento, no pude obtener la información de métodos de pago en este momento.'
      });
    }
  }

  // --- Mostrar historial de pedidos ---
  private async handleViewOrders(client: Socket, context: ChatContext) {
    try {
      const customerId = client.data.user?.sub;
      const userRole = client.data.user?.role;

      this.logger.log('🔍 Debug - User data: ' + JSON.stringify(client.data.user));

      // Validación: sub debe ser number (ID) y role no "guest"
      if (typeof customerId !== 'number' || userRole === 'guest') {
        client.emit('bot_message', {
          type: 'auth_required',
          message: 'Para ver sus pedidos necesita iniciar sesión. Por favor autentíquese primero.',
          options: ['Volver al menú principal']
        });
        context.currentStep = 'welcome';
        return;
      }

      const orderHistory = await this.chatService.getCustomerOrderHistory(String(customerId));

      if (!orderHistory || orderHistory.totalOrders === 0) {
        client.emit('bot_message', {
          type: 'no_orders',
          message: '📭 Aún no tienes pedidos en tu historial.',
          options: ['Volver al menú principal', 'Consultar productos disponibles']
        });
        context.currentStep = 'welcome';
        return;
      }

      client.emit('bot_message', {
        type: 'order_history',
        message: this.formatOrderHistoryMessage(orderHistory),
        orderHistory,
        options: ['Volver al menú principal', 'Consultar disponibilidad de productos', 'Ver detalles de un pedido específico']
      });

      context.currentStep = 'welcome';
    } catch (error) {
      this.logger.error('Error obteniendo historial de pedidos', error);
      client.emit('bot_message', {
        type: 'error',
        message: '❌ Lo siento, no pude obtener tu historial de pedidos en este momento.',
        options: ['Volver al menú principal']
      });
      context.currentStep = 'welcome';
    }
  }

  private formatOrderHistoryMessage(orderHistory: any): string {
    let message = `📦 **HISTORIAL DE PEDIDOS**\n\n`;
    message += `✅ Total de pedidos: ${orderHistory.totalOrders}\n`;
    message += `💰 Total gastado: $${orderHistory.totalSpent}\n`;
    message += `🏷️ Categoría favorita: ${orderHistory.favoriteCategory}\n\n`;
    message += `📋 **Pedidos recientes:**\n`;

    if (orderHistory.recentOrders && orderHistory.recentOrders.length > 0) {
      orderHistory.recentOrders.forEach((order: any, index: number) => {
        message += `\n${index + 1}. Pedido #${order.id}\n`;
        message += `   📅 Fecha: ${new Date(order.date).toLocaleDateString()}\n`;
        message += `   💰 Total: $${order.total}\n`;
        message += `   📦 Items: ${order.items} productos\n`;
        message += `   🟢 Estado: ${order.status}\n`;
      });
    }

    return message;
  }
}
