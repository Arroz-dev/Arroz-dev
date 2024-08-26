const { default: makeWASocket, DisconnectReason, useSingleFileAuthState } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const { unlinkSync } = require('fs');

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function connectToWhatsApp() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        // allow to pass proxy options if needed
        getMessage: async (key) => {
            // Return null or a previously fetched message here
            return {
                conversation: 'hello'
            }
        }
    });

    // Guardar el estado al finalizar la conexión
    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) && lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            // attempt to reconnect if the connection closes
            if (shouldReconnect) {
                connectToWhatsApp();
            } else {
                unlinkSync('./auth_info.json'); // Borra las credenciales si se cierra la sesión
            }
        } else if (connection === 'open') {
            console.log('Connected successfully to WhatsApp');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        console.log(JSON.stringify(m, undefined, 2));

        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            // Verifica el número de teléfono
            const senderNumber = msg.key.remoteJid;
            const definedNumber = '+50371823021@s.whatsapp.net'; // Reemplaza con el número de teléfono definido

            if (senderNumber === definedNumber) {
                // Enviar un mensaje de texto de respuesta
                await sock.sendMessage(senderNumber, { text: 'cerra el orto riko amanai murio' });
            }
        }
    });
}

connectToWhatsApp()
    .catch(err => console.log("unexpected error: " + err)); // captura errores
