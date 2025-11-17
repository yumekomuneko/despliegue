// chat.gateway.ts - VERSIÓN SIMPLIFICADA
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

@WebSocketGateway(81, {
  cors: { origin: '*' },
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

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      
      if (token) {
        const payload = await this.jwtService.verifyAsync(token);
        client.data.user = payload;
        this.logger.log(`Usuario ${payload.email} conectado`);
      }

      // Inicializar contexto de chat
      this.chatContexts.set(client.id, {
        currentStep: 'welcome'
      });

      // Mensaje de bienvenida
      client.emit('bot_message', {
        type: 'welcome',
        message: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte?',
        options: [
          'Consultar disponibilidad de productos',
          'Comparar productos', 
          'Consultar garantías'
        ]
      });

    } catch (error) {
      this.logger.error('Error de conexión:', error);
      // Permitir conexión sin token para pruebas
      this.chatContexts.set(client.id, { currentStep: 'welcome' });
      
      client.emit('bot_message', {
        type: 'welcome',
        message: '¡Hola! Modo prueba activado. ¿En qué puedo ayudarte?',
        options: [
          'Consultar disponibilidad de productos',
          'Comparar productos', 
          'Consultar garantías'
        ]
      });
    }
  }

  handleDisconnect(client: Socket) {
    this.chatContexts.delete(client.id);
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

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

    const customerId = client.data.user?.sub || 'guest';

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
        
        default:
          await this.handleGeneralInquiry(client, data.message, customerId, context);
      }
    } catch (error) {
      this.logger.error('Error procesando mensaje:', error);
      client.emit('bot_message', {
        type: 'error',
        message: 'Lo siento, hubo un error procesando tu solicitud.'
      });
    }
  }

  private async handleGeneralInquiry(
    client: Socket, 
    message: string, 
    customerId: string, 
    context: ChatContext
  ) {
    client.emit('bot_message', {
      type: 'general_response',
      message: 'Te recomiendo usar las opciones del menú para obtener información específica sobre productos.',
      options: [
        'Consultar disponibilidad de productos',
        'Comparar productos',
        'Consultar garantías'
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
      
      default:
        client.emit('bot_message', {
          type: 'options',
          message: 'Por favor selecciona una opción del menú:',
          options: [
            'Consultar disponibilidad de productos',
            'Comparar productos',
            'Consultar garantías'
          ]
        });
    }
  }

  private async handleProductAvailability(
    client: Socket, 
    productQuery: string, 
    customerId: string, 
    context: ChatContext
  ) {
    const result = await this.chatService.checkProductAvailability(productQuery, customerId);
    
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
        'Consultar garantías'
      ]
    });
  }

  private async handleProductComparison(client: Socket, productQuery: string, context: ChatContext) {
    if (!context.comparisonProducts) {
      context.comparisonProducts = [];
    }

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

    // Resetear contexto
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
}

/*import { 
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
import { ProductService } from '../product/product.service';
import { OrderService } from '../order/order.service';
import { PaymentService } from '../payment/payment.service';

interface ChatContext {
    currentStep: string;
    productInquiry?: string;
    comparisonProducts?: string[];
    customerId?: string;
}

@WebSocketGateway(81, {
    cors: { origin: '*' },
    namespace: '/ecommerce-chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(ChatGateway.name);

    @WebSocketServer()
    server: Server;

    private chatContexts = new Map<string, ChatContext>();

    constructor(
        private jwtService: JwtService,
        private chatService: ChatService,
        private productService: ProductService,
        private orderService: OrderService,
        private paymentService: PaymentService
    ) {}

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token;
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = await this.jwtService.verifyAsync(token);
            client.data.user = payload;
            // Inicializar contexto de chat
            this.chatContexts.set(client.id, {
                currentStep: 'welcome',
                customerId: payload.sub
            });

            this.logger.log(`Cliente ${payload.email} conectado al chat de ecommerce`);
            // Mensaje de bienvenida
            client.emit('bot_message', {
                type: 'welcome',
                message: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte?',
                options: [
                    'Consultar disponibilidad de productos',
                    'Comparar productos', 
                    'Ver mi historial de compras',
                    'Información de pagos y métodos',
                    'Consultar garantías'
                ]
            });

        } catch (error) {
            this.logger.error('Error de autenticación:', error);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.chatContexts.delete(client.id);
        this.logger.log(`Cliente desconectado: ${client.id}`);
    }

    @SubscribeMessage('customer_message')
    async handleCustomerMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { message: string; option?: number }
    ) {
        const context = this.chatContexts.get(client.id);
        if (!context) {
            client.emit('bot_message', {
                type: 'error',
                message: 'Sesión no encontrada. Por favor inténtelo de nuevo.'
            });
            return;
        }

        const customerId = client.data.user?.sub; 
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
        
                case 'order_history':
                    await this.handleOrderHistory(client, customerId, context);
                break;
        
                case 'payment_info':
                    await this.handlePaymentInfo(client, context);
                break;
        
                case 'warranty_info':
                    await this.handleWarrantyInfo(client, data.message, context);
                break;
        
                default:
                await this.handleGeneralInquiry(client, data.message, customerId, context);
            }
        } catch (error) {
            this.logger.error('Error procesando mensaje:', error);
            client.emit('bot_message', {
                type: 'error',
                message: 'Lo siento, hubo un error procesando tu solicitud.'
            });
        }
    }

    private async handleGeneralInquiry(
        client: Socket, 
        message: string, 
        customerId: string, 
        context: ChatContext
    ) {
        client.emit('bot_message', {
            type: 'general_response',
            message: 'Entiendo que tienes una consulta. Te recomiendo usar las opciones del menú para obtener información específica.',
            options: [
                'Consultar disponibilidad de productos',
                'Comparar productos',
                'Ver mi historial de compras',
                'Información de pagos y métodos',
                'Consultar garantías'
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
                    message: '¿Qué producto te interesa consultar? Por favor ingresa el nombre o código del producto.'
                });
                break;
            case 1: // Comparar productos
                context.currentStep = 'product_comparison';
                context.comparisonProducts = [];
                client.emit('bot_message', {
                    type: 'product_comparison_prompt',
                    message: 'Ingresa el nombre o código del primer producto que quieres comparar:'
                });
                break;
            case 2: // Historial de compras
                context.currentStep = 'order_history';
                await this.handleOrderHistory(client, client.data.user.sub, context); 
            break;
            case 3: // Información de pagos
                context.currentStep = 'payment_info';
                await this.handlePaymentInfo(client, context); 
            break;
            case 4: // Consultar garantías
                context.currentStep = 'warranty_info';
                client.emit('bot_message', {
                    type: 'warranty_prompt',
                    message: '¿De qué producto quieres consultar la garantía? Ingresa el nombre o código:'
                });
            break;
            default:
                client.emit('bot_message', {
                    type: 'options',
                    message: 'Por favor selecciona una opción del menú:',
                    options: [
                        'Consultar disponibilidad de productos',
                        'Comparar productos',
                        'Ver mi historial de compras',
                        'Información de pagos y métodos',
                        'Consultar garantías'
                    ]
                });
        }
    }

    private async handleProductAvailability(
        client: Socket, 
        productQuery: string, 
        customerId: string, 
        context: ChatContext
    ) {
        const result = await this.chatService.checkProductAvailability(productQuery, customerId);
    
        client.emit('bot_message', {
            type: 'product_availability',
            message: result.message,
            product: result.product,
            stock: result.stock,
            recommendations: result.recommendations,
            available: result.available
        });

    
    context.currentStep = 'welcome';
    
    client.emit('bot_message', {
        type: 'options',
        message: '¿En qué más puedo ayudarte?',
        options: [
            'Consultar disponibilidad de productos',
            'Comparar productos',
            'Ver mi historial de compras', 
            'Información de pagos y métodos',
            'Consultar garantías'
        ]
    });
}

    private async handleProductComparison(client: Socket, productQuery: string, context: ChatContext) {
        if (!context.comparisonProducts) {
            context.comparisonProducts = [];
        }

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

    // Resetear contexto
    context.currentStep = 'welcome';
    context.comparisonProducts = [];
}

    private async handleOrderHistory(client: Socket, customerId: string, context: ChatContext) {
        const history = await this.chatService.getCustomerOrderHistory(customerId);
    
        client.emit('bot_message', {
            type: 'order_history',
            message: `Tienes ${history.totalOrders} pedidos históricos. Total gastado: $${history.totalSpent}`,
            recentOrders: history.recentOrders,
            favoriteCategory: history.favoriteCategory
            });

        context.currentStep = 'welcome';
    }

    private async handlePaymentInfo(client: Socket, context: ChatContext) {
        const paymentInfo = await this.chatService.getPaymentMethodsInfo();
    
        client.emit('bot_message', {
            type: 'payment_info',
            message: 'Métodos de pago disponibles:',
            methods: paymentInfo.methods,
            installments: paymentInfo.installments,
            security: paymentInfo.securityInfo
        });

        context.currentStep = 'welcome';
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
}*/