import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode';
import fs from 'fs';

const logger = pino({ level: 'info' });

async function testBaileys() {
    console.log('Starting Baileys test...');

    const authPath = './test_baileys_auth';
    if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    console.log('Creating socket...');
    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: true,
        auth: state,
        browser: ['Test', 'Chrome', '10.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        console.log('Connection update:', {
            connection,
            hasQR: !!qr,
            qrType: typeof qr,
            qrLength: qr ? qr.length : 0,
            updateKeys: Object.keys(update)
        });

        if (qr) {
            console.log('✅ QR CODE RECEIVED!');
            console.log('QR String:', qr.substring(0, 50) + '...');

            try {
                const qrDataUrl = await qrcode.toDataURL(qr);
                console.log('✅ QR Code converted to Data URL successfully');
                console.log('Data URL length:', qrDataUrl.length);

                // Save to file for testing
                fs.writeFileSync('test_qr.txt', qrDataUrl);
                console.log('✅ QR Code saved to test_qr.txt');
            } catch (error) {
                console.error('❌ Error converting QR:', error);
            }
        }

        if (connection === 'close') {
            console.log('Connection closed');
            process.exit(0);
        } else if (connection === 'open') {
            console.log('✅ Connected successfully!');
            process.exit(0);
        }
    });
}

testBaileys().catch(console.error);

// Timeout after 30 seconds
setTimeout(() => {
    console.log('Test timeout - exiting');
    process.exit(1);
}, 30000);
