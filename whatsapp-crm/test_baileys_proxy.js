import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import { HttpsProxyAgent } from 'https-proxy-agent';
import pino from 'pino';
import fs from 'fs';

const logger = pino({ level: 'debug' });

async function test() {
    console.log('Starting Baileys 7.0 Proxy Test...');

    const authPath = './test_auth_proxy';
    if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    console.log(`Baileys version: ${version}`);

    // Proxy configuration
    const proxyUrl = 'http://10.0.0.2:8888';
    console.log(`Using proxy: ${proxyUrl}`);
    const agent = new HttpsProxyAgent(proxyUrl);

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        agent: agent
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('✅ QR CODE RECEIVED!');
            console.log('QR Length:', qr.length);
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            console.log('Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                // reconnect logic if needed for test
            } else {
                console.log('Logged out');
            }
        } else if (connection === 'open') {
            console.log('✅ Opened connection');
        }
    });

    console.log('Socket initialized, waiting for events...');
}

test();
