const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});


const targetNumber = '+503 7182 3021';

// Mensaje automático
const autoReplyMessage = 'cerra el orto riko amanai murio';

client.on('message', msg => {
    if (msg.from === `${targetNumber}@c.us`) {
        msg.reply(autoReplyMessage);
    }
});

client.initialize();

