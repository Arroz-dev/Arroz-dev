const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

// Función principal para iniciar el bot
async function startBot() {
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
        const msg = m.messages[0];
        console.log('Received message:', msg);

        // Responde automáticamente a cualquier mensaje
        if (!msg.key.fromMe && m.type === 'notify') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Hello! This is an automated response.' });
        }
    });
}

// Inicia el bot
startBot();
