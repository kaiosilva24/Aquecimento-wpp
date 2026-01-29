import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function test() {
    console.log('Testing S7 Every Proxy (10.0.0.3:8888)...\n');

    const proxyUrl = 'http://10.0.0.3:8888';
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
        console.log('\n✅ SUCCESS!\n');
        console.log('IP Externo:', data.query);
        console.log('ISP:', data.isp);
        console.log('País:', data.country);
        console.log('Região:', data.regionName);
        console.log('Cidade:', data.city);
        console.log('\nDados completos:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('\n❌ FALHOU:', error.message);
        if (error.cause) console.error('Causa:', error.cause);
    }
}

test();
