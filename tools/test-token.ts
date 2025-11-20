// test-token-delivery.ts
import io from 'socket.io-client';

console.log('🧪 TEST: Envío de token WebSocket');
console.log('Argumentos recibidos:', process.argv);

const token = process.argv[2];

if (!token) {
    console.log('❌ ERROR: No se proporcionó token');
    console.log('💡 Uso: npx ts-node test-token-delivery.ts "tu_token"');
    process.exit(1);
}

console.log('\n🔐 TOKEN RECIBIDO:');
console.log('Token:', token);
console.log('Longitud:', token.length);
console.log('Primeros 50 chars:', token.substring(0, 50) + '...');

const socketOptions = {
    transports: ['websocket'],
    auth: {
        token: token
    },
    query: {
        token: token
    }
};

console.log('\n🔧 OPCIONES SOCKET:');
console.log(JSON.stringify(socketOptions, null, 2));

const socket = io('', socketOptions);

socket.on('connect', () => {
    console.log('\n✅ CONECTADO AL SERVIDOR');
    console.log('Socket ID:', socket.id);
    
    // Probar autenticación inmediatamente
    setTimeout(() => {
        console.log('\n📤 Enviando solicitud de pedidos...');
        socket.emit('customer_message', { option: 4 });
    }, 1000);
});

socket.on('bot_message', (data: any) => {
    console.log('\n📥 RESPUESTA DEL SERVIDOR:');
    console.log('Tipo:', data.type);
    console.log('Mensaje:', data.message);
    
    if (data.type === 'order_history') {
        console.log('🎉 ¡ÉXITO! Historial de pedidos recibido');
        console.log('Total de pedidos:', data.orderHistory.totalOrders);
    } else if (data.type === 'auth_required') {
        console.log('❌ FALLO: El token no llegó al servidor');
    }
    
    // Desconectar después de recibir respuesta
    setTimeout(() => {
        socket.disconnect();
        process.exit(0);
    }, 2000);
});

socket.on('connect_error', (error: any) => {
    console.log('❌ ERROR DE CONEXIÓN:', error.message);
});

// Timeout de seguridad
setTimeout(() => {
    console.log('⏰ Timeout - Desconectando...');
    socket.disconnect();
    process.exit(1);
}, 10000);