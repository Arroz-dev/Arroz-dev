const makeWASocket = require('@adiwajshing/baileys').default;
const { DisconnectReason } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

// Ruta al archivo de autenticación
const authFilePath = path.join(__dirname, 'auth_info.json');

// Cargar el estado de autenticación desde el archivo
let authState = {};
if (fs.existsSync(authFilePath)) {
    authState = JSON.parse(fs.readFileSync(authFilePath));
}

// Función para guardar el estado de autenticación
const saveAuthState = (newAuthState) => {
    fs.writeFileSync(authFilePath, JSON.stringify(newAuthState, null, 2));
};

// Número específico que debe enviar el mensaje para que el bot responda
const specificNumber = '50371823021@s.whatsapp.net';

// Función principal para iniciar el bot
async function startBot() {
    const sock = makeWASocket({
        auth: authState,
        printQRInTerminal: true // Muestra el código QR en la terminal para escanearlo con WhatsApp
    });

    // Guarda el estado cuando ocurra un cambio
    sock.ev.on('creds.update', (newCreds) => {
        saveAuthState(newCreds);
    });

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
                    await sock.sendMessage(msg.key.remoteJid, { text: 'rina murio we' });
                } catch (error) {
                    console.error('Error sending message:', error);
                }
            }
        }
    });
}

// Inicia el bot
startBot();
