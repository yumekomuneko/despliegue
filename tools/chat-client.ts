import io from 'socket.io-client';
import * as readline from 'readline';

class InteractiveChatClient {
    private socket: any;
    private rl: any;
    private currentOptions: string[] = [];
    private token: string | null = null;

    constructor(token?: string) {
        this.token = token || null;
        
        const socketOptions: any = {
            transports: ['websocket', 'polling'],
            forceNew: true,
            timeout: 5000
        };

        console.log('🔧 Inicializando cliente de chat...');
        this.socket = io('http://localhost:3000/ecommerce-chat', socketOptions);

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.setupEventListeners();
        this.setupUserInput();
    }

    private setupEventListeners() {
        this.socket.on('connect', () => {
            console.log(`✅ Conectado al servidor de chat\n`);
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
            console.log(`✅ Bienvenido a E-BOND tu tienda virtual de confianza\n`);

            
            if (this.token) {
                console.log('🔐 Enviando autenticación automática...');
                this.socket.emit('authenticate', { token: this.token });
            }
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Desconectado del servidor');
            this.rl.close();
        });

        this.socket.on('authenticated', (data: any) => {
            console.log('✅ Autenticación exitosa');
        });

        this.socket.on('auth_failed', (data: any) => {
            console.log('❌ Error de autenticación:', data);
        });

        this.socket.on('bot_message', (data: any) => {
            this.handleBotMessage(data);
        });

        this.socket.on('connect_error', (error: any) => {
            console.log('❌ Error de conexión:', error.message);
        });
    }

    private handleBotMessage(data: any) {
        console.log('\n🤖 BOT:', data.message);
        
        // Manejar diferentes tipos de mensajes
        if (data.type === 'payment_methods') {
            this.handlePaymentMethods(data);
            return;
        }
        
        if (data.type === 'order_history') {
            this.handleOrderHistory(data);
            return;
        }
        
        if (data.type === 'auth_required') {
            console.log('🔐 Se requiere autenticación');
            if (this.token) {
                this.socket.emit('authenticate', { token: this.token });
            }
        }

        // Mostrar información de productos
        if (data.product) {
            console.log('\n📦 Producto:', data.product.name);
            console.log('💰 Precio:', data.product.price);
            console.log('📝 Descripción:', data.product.description);
        }

        // Mostrar opciones
        if (data.options) {
            this.currentOptions = data.options;
            console.log('\n📋 Opciones:');
            data.options.forEach((option: string, index: number) => {
                console.log(`   [${index}] ${option}`);
            });
        }

        console.log('\n💬 Escribe tu mensaje o número de opción:');
    }

    private handlePaymentMethods(data: any) {
        console.log('\n💳 Métodos de pago disponibles:');
        data.methods.forEach((method: any) => {
            console.log(`\n🔹 ${method.name}`);
            console.log(`   📝 ${method.description}`);
        });
        
        if (data.options) {
            this.currentOptions = data.options;
            console.log('\n📋 Opciones:');
            data.options.forEach((option: string, index: number) => {
                console.log(`   [${index}] ${option}`);
            });
        }
    }

    private handleOrderHistory(data: any) {
        console.log('\n📦 Historial de pedidos:');
        console.log(`Total de pedidos: ${data.orderHistory.totalOrders}`);
        console.log(`Total gastado: $${data.orderHistory.totalSpent}`);
        
        if (data.options) {
            this.currentOptions = data.options;
            console.log('\n📋 Opciones:');
            data.options.forEach((option: string, index: number) => {
                console.log(`   [${index}] ${option}`);
            });
        }
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

            // Comando de autenticación manual
            if (trimmedInput === 'auth' && this.token) {
                console.log('🔐 Enviando autenticación...');
                this.socket.emit('authenticate', { token: this.token });
                return;
            }

            // Manejar selección de opciones
            const optionIndex = parseInt(trimmedInput);
            if (!isNaN(optionIndex) && this.currentOptions[optionIndex]) {
                this.socket.emit('customer_message', { option: optionIndex });
            } else {
                this.socket.emit('customer_message', { message: trimmedInput });
            }
        });
    }
}

// Uso del cliente
console.log('🚀 Iniciando cliente de chat interactivo...');

// Ejemplo de uso con token (opcional)
const token = process.argv[2]; // Token como argumento
const client = new InteractiveChatClient(token);

console.log('💡 Comandos:');
console.log('   - Escribe números para seleccionar opciones');
console.log('   - "auth" para reautenticar');
console.log('   - "exit" o "quit" para salir\n');