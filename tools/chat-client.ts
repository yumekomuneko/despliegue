import io  from 'socket.io-client';
import * as readline from 'readline';

console.log('🧪 Cliente de prueba - Diagnosticando conexión...');

const socket = io('http://localhost:3000/ecommerce-chat', {
    transports: ['websocket'],
    timeout: 5000
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Todos los eventos posibles
socket.on('connect', () => {
    console.log('✅ CONECTADO al servidor');
    console.log('🆔 Socket ID:', socket.id);
    
    // Enviar un mensaje de prueba inmediatamente
    setTimeout(() => {
        console.log('📤 Enviando mensaje "hola"...');
        socket.emit('customer_message', { message: 'hola' });
    }, 1000);
});

socket.on('disconnect', (reason: any) => {
    console.log('❌ DESCONECTADO. Razón:', reason);
});

socket.on('connect_error', (error: any) => {
    console.log('❌ ERROR DE CONEXIÓN:', error.message);
});

socket.on('error', (error: any) => {
    console.log('❌ ERROR GENERAL:', error);
});

socket.on('bot_message', (data: any) => {
    console.log('📨 MENSAJE DEL BOT:', data);
});

socket.on('message', (data: any) => {
    console.log('📨 MENSAJE:', data);
});

socket.on('welcome', (data: any) => {
    console.log('👋 BIENVENIDA:', data);
});

// Mantener el cliente activo
rl.on('line', (input: string) => {
    if (input === 'exit') {
        console.log('👋 Saliendo...');
        socket.disconnect();
        rl.close();
        process.exit(0);
    }
    
    socket.emit('customer_message', { message: input });
});

// Mantener el proceso activo
setInterval(() => {
    if (socket.connected) {
        console.log('💓 Cliente aún conectado...');
    }
}, 3000);

console.log('🔍 Esperando eventos del servidor...');