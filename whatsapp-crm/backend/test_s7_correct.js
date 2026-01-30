import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function test() {
    console.log('Testing S7 Proxy (10.0.0.3:8080)...');

    const proxyUrl = 'http://10.0.0.3:8080';
    const agent = new HttpsProxyAgent(proxyUrl);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        console.log(`Connecting via ${proxyUrl}...`);
        const res = await fetch('http://ip-api.com/json', {
            agent,
            signal: controller.signal
        });
        clearTimeout(timeout);

        const data = await res.json();
        console.log('✅ SUCCESS!');
        console.log('IP:', data.query);
        console.log('ISP:', data.isp);
        console.log('Country:', data.country);
        console.log('Region:', data.regionName);
        console.log('Full data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ FAILED:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

test();
