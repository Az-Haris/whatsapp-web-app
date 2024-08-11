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

// Responses mapping
const responses = {
    'hi': `
Hello! How can I assist you today? Here are some common questions you can ask:
1. What is your return policy?
2. How can I track my order?
3. Do you offer international shipping?
4. How can I contact support?

Just type the number of your question to get an answer.
    `,
    'hello': `
Hello! How can I assist you today? Here are some common questions you can ask:
1. What is your return policy?
2. How can I track my order?
3. Do you offer international shipping?
4. How can I contact support?

Just type the number of your question to get an answer.
    `,
    '1': 'Our return policy allows returns within 30 days of purchase.',
    '2': 'You can track your order using the tracking link sent to your email.',
    '3': 'Yes, we offer international shipping to many countries.',
    '4': 'You can contact our support team via the contact form on our website.',
    // Specific keywords
    'order status': 'You can check your order status using the tracking link sent to your email.',
    'return policy': 'Our return policy allows returns within 30 days of purchase.',
    'shipping': 'Yes, we offer international shipping to many countries.',
    'recharge hobe?': "Yes sir. recharge hobe. kot tk?",
    'ok': "Send Money Number din."
};

// Tracking user states and whether the waiting message was sent
const userState = new Map(); // Map to store the state of each user

client.on('message', async (message) => {
    const userId = message.from;
    const messageBody = message.body.toLowerCase();

    // Check for specific keywords first
    if (responses[messageBody]) {
        await client.sendMessage(userId, responses[messageBody]);
        userState.set(userId, { state: 'active', waitingMessageSent: false }); // Reset state
        return;
    }

    // Check if user types 'start'
    if (messageBody === 'start') {
        userState.set(userId, { state: 'active', waitingMessageSent: false });
        await client.sendMessage(userId, responses['hi']); // Restart conversation
        return;
    }

    // Check if user is in 'waiting' state
    const state = userState.get(userId) || { state: 'active', waitingMessageSent: false };
    
    if (state.state === 'waiting') {
        if (!state.waitingMessageSent) {
            await client.sendMessage(userId, "Wait for human reply. Type 'start' to restart.");
            userState.set(userId, { ...state, waitingMessageSent: true }); // Mark message as sent
        }
        return;
    }

    // Handle unknown messages
    if (!responses[messageBody]) {
        if (!state.waitingMessageSent) {
            await client.sendMessage(userId, "Wait for human reply. Type 'start' to restart.");
            userState.set(userId, { ...state, state: 'waiting', waitingMessageSent: true }); // Set state to 'waiting'
        }
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
