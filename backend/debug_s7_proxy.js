
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function test() {
    console.log('Testing S7 Proxy (10.0.0.2:8888)...');

    // Construct proxy agent
    // Note: TinyProxy is HTTP/HTTPS proxy. 
    // If protocol is http, use http://10.0.0.2:8888
    const proxyUrl = 'http://10.0.0.2:8888';
    const agent = new HttpsProxyAgent(proxyUrl);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        console.log(`Connecting via ${proxyUrl}...`);
        const res = await fetch('http://ip-api.com/json', {
            agent,
            signal: controller.signal
        });
        clearTimeout(timeout);

        const data = await res.json();
        console.log('Result:', data);
    } catch (error) {
        console.error('Proxy Test Failed:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

test();
