import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';
import WebSocket from 'ws';

const proxyUrl = 'http://10.0.0.2:8888';
const agent = new HttpsProxyAgent(proxyUrl);

async function testConnectivity() {
    console.log(`Testing connectivity via ${proxyUrl}...`);

    // 1. Test HTTP
    try {
        console.log('1. Testing HTTP via Axios...');
        const res = await axios.get('http://ip-api.com/json', { httpsAgent: agent, httpAgent: agent });
        console.log('✅ HTTP Success! IP:', res.data.query);
    } catch (err) {
        console.error('❌ HTTP Failed:', err.message);
    }

    // 2. Test WebSocket to WhatsApp
    try {
        console.log('2. Testing WebSocket to WhatsApp (wss://web.whatsapp.com/ws/chat)...');
        // Note: This URL might validly close with an error because we aren't speaking the protocol, 
        // but we want to see if the HANDSHAKE completes (Open event) or if it fails network-wise.

        const ws = new WebSocket('wss://web.whatsapp.com/ws/chat', {
            agent,
            headers: {
                'Origin': 'https://web.whatsapp.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        ws.on('open', () => {
            console.log('✅ WA WebSocket Connected! (Handshake success)');
            ws.close();
        });

        ws.on('error', (err) => {
            console.error('❌ WA WebSocket Failed:', err.message);
        });

        ws.on('unexpected-response', (req, res) => {
            console.log(`⚠️ Unexpected response: ${res.statusCode} (This is GOOD, means server reached)`);
            process.exit(0);
        });

    } catch (err) {
        console.error('❌ WebSocket Setup Failed:', err.message);
    }
}

testConnectivity();
