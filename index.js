require('dotenv').config();
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const port = process.env.PORT || 3001;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

app.use(express.json());

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (message) => {
    console.log(`Received message: ${message.body}`);
    
    if (message.body.toLowerCase() === 'hi' || message.body.toLowerCase() === 'hello') {
        const faqMessage = `
Hello! How can I assist you today? Here are some common questions you can ask:
1. What is your return policy?
2. How can I track my order?
3. Do you offer international shipping?
4. How can I contact support?

Just type the number of your question to get an answer.
        `;

        await client.sendMessage(message.from, faqMessage);
    } else {
        let reply;
        switch (message.body.toLowerCase()) {
            case '1':
                reply = 'Our return policy allows returns within 30 days of purchase.';
                break;
            case '2':
                reply = 'You can track your order using the tracking link sent to your email.';
                break;
            case '3':
                reply = 'Yes, we offer international shipping to many countries.';
                break;
            case '4':
                reply = 'You can contact our support team via the contact form on our website.';
                break;
            default:
                reply = 'I didn’t understand that. Please choose one of the options provided.';
        }
        await client.sendMessage(message.from, reply);
    }
});

client.initialize();

app.get('/', (req, res) => {
    res.send('WhatsApp Web Backend');
});

app.post('/send-message', (req, res) => {
    const { message } = req.body;
    // Implement sending a message here using the client
    res.send(`Message to be sent: ${message}`);
});

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
