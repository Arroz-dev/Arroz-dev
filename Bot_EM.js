const makeWASocket = require('@adiwajshing/baileys').default;
const { DisconnectReason } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

// Ruta al archivo de autenticación
const authFilePath = path.join(__dirname, 'auth_info.json');

// Usa useSingleFileAuthState para manejar la autenticación
const { state, saveState } = require('@adiwajshing/baileys').useSingleFileAuthState(authFilePath);

// Número específico que debe enviar el mensaje para que el bot responda
const specificNumber = '12345678@s.whatsapp.net';

// Función principal para iniciar el bot
function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true // Muestra el código QR en la terminal para escanearlo con WhatsApp
    });

    // Guarda el estado cuando ocurra un cambio
    sock.ev.on('creds.update', saveState);

    // Maneja eventos de conexión
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error === Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : false;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                startBot(); // Intenta reconectar
            }
        } else if (connection === 'open') {
            console.log('Connected');
        }
    });

    // Maneja mensajes recibidos
    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            const msg = m.messages[0];
            if (msg && !msg.key.fromMe && msg.key.remoteJid === specificNumber) {
                console.log('Received message:', msg);
                try {
                    await sock.sendMessage(msg.key.remoteJid, { text: 'hello ' });
                } catch (error) {
                    console.error('Error sending message:', error);
                }
            }
        }
    });
}

// Inicia el bot
startBot();
