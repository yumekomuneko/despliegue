import io  from 'socket.io-client';
import * as readline from 'readline';
import { Patch } from '@nestjs/common';
import path from 'path';

class InteractiveChatClient {
    private socket: any;
    private rl: any;
    private currentOptions: string[] = [];
    private token: string | null = null;

    constructor( token?: string) {
        console.log('\n🔧 [CLIENT DEBUG] Constructor llamado');
        console.log('🔧 [CLIENT DEBUG] Token recibido:', token ? 'PRESENTE' : 'AUSENTE');
        
        if (token) {
            console.log('🔧 [CLIENT DEBUG] Token completo:', token);
            console.log('🔧 [CLIENT DEBUG] Longitud del token:', token.length);
            
            // Limpiar el token (remover comillas extras)
            this.token = token.replace(/^"|"$/g, '').trim();
            console.log('🔧 [CLIENT DEBUG] Token limpio:', this.token);
            console.log('🔧 [CLIENT DEBUG] Longitud token limpio:', this.token.length);

        // Verificar que sea un JWT válido
        const parts = this.token.split('.');
        if (parts.length === 3) {
                console.log('✅ Token JWT válido - 3 partes detectadas');
            } else {
                console.log('❌ Token NO tiene formato JWT válido');
                this.token = null;
            }
        } else {
            console.log('🔧 [CONSTRUCTOR DEBUG] Sin token - modo invitado');
            this.token = null;
        }

        
        const socketOptions: any = {
            transports: ['websocket'],
            forceNew: true,
            timeout:5000,
            path: '/socket.io'
        };

        // Agregar autenticación SI hay token
        if (this.token) {
            socketOptions.auth = {
                token: this.token
            };
            socketOptions.query = {
                token: this.token
            };
            console.log('🔧 [CONSTRUCTOR DEBUG] Socket.IO configurado CON autenticación');
            console.log('🔧 [CONSTRUCTOR DEBUG] Auth token:', this.token.substring(0, 20) + '...');
        } else {
            console.log('🔧 [CONSTRUCTOR DEBUG] Configurando Socket.IO sin autenticación');
        }

        console.log('🔧 [CONSTRUCTOR DEBUG] Opciones de Socket.IO:', JSON.stringify(socketOptions, null, 2));

        this.socket = io('https://TU_SERVICIO.onrender.com/ecommerce-chat', socketOptions);


        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.setupEventListeners();
        this.setupUserInput();

        console.log('🔧 [CONSTRUCTOR DEBUG] Constructor completado');
    }


    private setupEventListeners() {
        this.socket.on('connect', () => {
            console.log(`✅ Conectado al servidor de chat\n`);
            console.log(`✅ Bienvenido a  E-BOND tu tienda virtual de confianza\n`);
            console.log(` ¡Conectamos personas, productos y experiencias en tiempo real!\n`);
            console.log(`
                 _______                  ________  ________  ________   ________
                |\\  ___ \\                |\\   __  \\|\\   __  \\|\\   ___  \\|\\   ___ \\    
                \\ \\   __/|   ____________\\ \\  \\|\\ /\\ \\  \\|\\  \\ \\  \\\\ \\  \\ \\  \\_|\\ \\ 
                 \\ \\  \\_|/__|\\____________\\ \\   __  \\ \\   __  \\ \\  \\\\ \\  \\ \\  \\ \\\\ \\ 
                  \\ \\  \\_|\\ \\|____________|\\ \\  \\|\\  \\ \\  \\|\\  \\ \\  \\\\ \\  \\ \\  \\_\\\\ \\ 
                   \\ \\_______\\              \\ \\_______\\ \\_______\\ \\__\\\\ \\__\\ \\_______\\ 
                    \\|_______|               \\|_______|\\|_______|\\|__| \\|__|\\|_______|
                    `);

            // INTENTAR AUTENTICACIÓN INMEDIATA DESPUÉS DE CONECTAR
            if (this.token) {
                console.log('🔧 [AUTH DEBUG] Enviando autenticación automática...');
                this.socket.emit('authenticate', { token: this.token });
            }
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Desconectado del servidor');
            this.rl.close();
        });

        // AGREGAR EVENTOS DE AUTENTICACIÓN
        this.socket.on('authenticated', (data: any) => {
            console.log('✅✅✅ [AUTH DEBUG] Autenticación exitosa en el servidor');
            console.log('🔧 [AUTH DEBUG] Datos:', data);
        });

        this.socket.on('unauthorized', (data: any) => {
            console.log('❌❌❌ [AUTH DEBUG] No autorizado:', data);
        });

        this.socket.on('auth_success', (data: any) => {
            console.log('✅✅✅ [AUTH DEBUG] Auth success:', data);
        });

        this.socket.on('auth_failed', (data: any) => {
            console.log('❌ [AUTH DEBUG] Auth failed:', data);
        });

        this.socket.on('bot_message', (data: any) => {
            console.log('******🔧 [CLIENT DEBUG] Tipo recibido:******', data.type);
            
            // MANEJO MEJORADO DE AUTH_REQUIRED
            if (data.type === 'auth_required') {
                console.log('🔧 [AUTH DEBUG] Servidor solicita autenticación');
                console.log('🔧 [AUTH DEBUG] Token disponible:', this.token ? 'SÍ' : 'NO');
                
                if (this.token) {
                    console.log('🔄 [AUTH DEBUG] Reenviando autenticación...');
                    // Probar diferentes métodos de autenticación
                    this.socket.emit('authenticate', { token: this.token });
                    this.socket.emit('auth', { token: this.token });
                    this.socket.emit('login', { token: this.token });
                    
                    // También intentar como mensaje normal
                    setTimeout(() => {
                        this.socket.emit('customer_message', { 
                            message: 'login',
                            token: this.token 
                        });
                    }, 500);
                }
            }
            
            // Manejar métodos de pago específicamente
            if (data.type === 'payment_methods') {
                console.log('******🔧 [CLIENT DEBUG] Ejecutando handlePaymentMethods******');
                this.handlePaymentMethods(data);
                return;
            }

            console.log('\n🤖 BOT:', data.message);
            
            if (data.product) {
                console.log('\n________________________________________');
                console.log('/|                                       |');
                console.log(`||      📦 Información del producto   `, '|');
                console.log('||_______________________________________|');
                console.log('/_______________________________________/');
                console.log(`\n Nombre: ${data.product.name}`); //REVIZAR
                console.log(`   Precio: $${data.product.price}`); //REVIZAR
                console.log(`   Descripción: ${data.product.description}`);
                console.log(`   Disponible: ${data.available ? '✅ Sí' : '❌ No'}`);
                
                if (data.stock) {
                    console.log(`   Stock: ${data.stock.quantity} unidades`);
                    console.log(`   Stock bajo: ${data.stock.lowStock ? '⚠️ Sí' : '✅ No'}`);
                }
            }

            if (data.products && data.products.length > 0) {
                console.log('\n ________________________________________');
                console.log('/|                                       |');
                console.log(`||      ⚖️ Comparación de productos      `,  '|');
                console.log('||_______________________________________|');
                console.log('/_______________________________________/');

                data.products.forEach((product: any, index: number) => {
                    console.log(`\n   Producto ${index + 1}: ${product.name}`);
                    console.log(`     Precio: $${product.price}`);
                    console.log(`     Disponible: ${product.available ? '✅' : '❌'}`);
                    console.log(`     Categorías: ${product.categories?.join(', ') || 'N/A'}`);
                });
            }

            if (data.warranty) {
                console.log('\n ________________________________________');
                console.log('/|                                       |');
                console.log(`||      🛡️ Información de garantía    ` ,'|');
                console.log('||_______________________________________|');
                console.log('/_______________________________________/');
                console.log(`\n Duración: ${data.warranty.duration}`);
                console.log(`   Tipo: ${data.warranty.type}`);
                console.log(`   Contacto: ${data.warranty.contactSupport}`);
            }

            if (data.options) {
                this.currentOptions = data.options;
                console.log('\n📋 Opciones:');
                data.options.forEach((option: string, index: number) => {
                    console.log(`   [${index}] ${option}`);
                });
            }

            //historial de pedidos

            if (data.type === 'order_history') {
                console.log(' __________________________________________');
                console.log('/|                                         |');
                console.log(`||       📦 Historial de pedidos      `, '|');
                console.log('||_________________________________________|');
                console.log(`/__________________________________________/`);
                console.log(`\n Total de pedidos: ${data.orderHistory.totalOrders}`);
                console.log(`   Total gastado: $${data.orderHistory.totalSpent}`);
                console.log(`   Categoría favorita: ${data.orderHistory.favoriteCategory}`);
                if (data.orderHistory.recentOrders && data.orderHistory.recentOrders.length > 0) {
                    console.log('\n📋 Pedidos recientes:');
                    data.orderHistory.recentOrders.forEach((order: any, index: number) => {
                    console.log(`\n   Pedido #${order.id}:`);
                    console.log(`     Fecha: ${new Date(order.date).toLocaleDateString()}`);
                    console.log(`     Total: $${order.total}`);
                    console.log(`     Items: ${order.items} productos`);
                    console.log(`     Estado: ${order.status}`);
                });
            }
            if (data.type === 'no_orders') {
                console.log('\n📭 No tienes pedidos en tu historial.');
            }

            if (data.type === 'auth_required') {
                console.log('\n⚠️ Necesitas iniciar sesión para ver tus pedidos.');
            }

            console.log('\n💬 Escribe tu mensaje o número de opción:');
        }
        });

        this.socket.on('connect_error', (error: any) => {
            console.log('❌ Error de conexión:', error.message);
        });

    }

    private handlePaymentMethods(data: any) {
        console.log('\n🤖 BOT:', data.message);
        
        if (data.methods && data.methods.length > 0) {
            console.log('\n💳 Métodos de pago disponibles:');
            data.methods.forEach((method: any, index: number) => {
                console.log(`\n🔹 ${method.name}`);
                console.log(`   📝 ${method.description}`);
                
                if (method.supportedCards && method.supportedCards.length > 0) {
                    console.log(`   💳 Tarjetas aceptadas: ${method.supportedCards.join(', ')}`);
                }
                
                if (method.installments) {
                    console.log(`   📅 ${method.installments}`);
                }
                
                console.log(`   ⏱️ ${method.processingTime}`);
            });
        }

        if (data.securityInfo) {
            console.log('\n🛡️ Información de seguridad:');
            if (data.securityInfo.encrypted) console.log('   ✅ Transacciones encriptadas con SSL');
            if (data.securityInfo.fraudProtection) console.log('   ✅ Protección contra fraudes');
            if (data.securityInfo.moneyBackGuarantee) console.log('   ✅ Garantía de devolución de 30 días');
            if (data.securityInfo.sslCertified) console.log('   ✅ Certificado SSL');
        }

        if (data.options) {
            this.currentOptions = data.options;
            console.log('\n📋 Opciones:');
            data.options.forEach((option: string, index: number) => {
                console.log(`   [${index}] ${option}`);
            });
        }

        console.log('\n💬 Escribe tu mensaje o número de opción:');
    }

    private setupUserInput() {
        this.rl.on('line', (input: string) => {
            const trimmedInput = input.trim();
            
            if (trimmedInput === 'exit' || trimmedInput === 'quit') {
                console.log('👋 Saliendo del chat...');
                this.socket.disconnect();
                this.rl.close();
                return;
            }

            // COMANDO ESPECIAL PARA AUTENTICACIÓN
            if (trimmedInput === 'auth') {
                console.log('🔐 EJECUTANDO AUTENTICACIÓN MANUAL...');
                if (this.token) {
                    console.log('Enviando múltiples métodos de autenticación...');
                    this.socket.emit('authenticate', { token: this.token });
                    this.socket.emit('auth', { token: this.token });
                    this.socket.emit('login', { token: this.token });
                    this.socket.emit('authorize', { token: this.token });
                    
                    // También como mensaje normal
                    this.socket.emit('customer_message', { 
                        message: `token:${this.token}`
                    });
                } else {
                    console.log('❌ No hay token disponible');
                }
                return;
            }

            // COMANDO PARA VER TOKEN
            if (trimmedInput === 'debug_token') {
                console.log('🔐 INFORMACIÓN DEL TOKEN:');
                if (this.token) {
                    const parts = this.token.split('.');
                    if (parts.length === 3) {
                        try {
                            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                            console.log('User ID:', payload.sub);
                            console.log('Email:', payload.email);
                            console.log('Role:', payload.role);
                            console.log('Expira:', new Date(payload.exp * 1000).toLocaleString());
                        } catch (e) {
                            console.log('Error decodificando token');
                        }
                    }
                }
                return;
            }

            // Verificar si es un número de opción
            const optionIndex = parseInt(trimmedInput);
            if (!isNaN(optionIndex) && optionIndex >= 0 && optionIndex < this.currentOptions.length) {
                this.socket.emit('customer_message', { option: optionIndex });
            } else {
                this.socket.emit('customer_message', { message: trimmedInput });
            }
        });
    }
}

// Iniciar cliente interactivo
console.log('🚀 Iniciando cliente de chat interactivo...');
console.log('💡 Escribe "exit" o "quit" para salir');
console.log('🔧 Comandos especiales: "auth" para autenticar, "debug_token" para ver token\n');

// Leer el token correctamente desde los argumentos
const args = process.argv.slice(2);
const token = args[0];

console.log('🔧 [INIT DEBUG] Argumentos recibidos:', process.argv.slice(2));
console.log('🔧 [INIT DEBUG] Token extraído:', token ? 'PRESENTE' : 'AUSENTE');

if (token) {
    console.log('🔑 Token detectado en argumentos');
    console.log('🔐 Longitud del token:', token.length);
    console.log('🔐 Primeros 30 caracteres:', token.substring(0, 30) + '...');
    
    // Verificar formato básico del token
    if (token.split('.').length === 3) {
        console.log('✅ Formato JWT válido detectado');
    } else {
        console.log('⚠️  El token no tiene formato JWT estándar');
    }
} else {
    console.log('👤 Modo invitado - Sin token proporcionado');
    console.log('💡 Para autenticarte, ejecuta:');
    console.log('   npx ts-node chat-client.ts "tu_token_jwt"');
}

console.log('\n🔧 [INIT DEBUG] Instanciando InteractiveChatClient con token...');

const client = new InteractiveChatClient(token);

console.log('🔧 [INIT DEBUG] Cliente inicializado correctamente');