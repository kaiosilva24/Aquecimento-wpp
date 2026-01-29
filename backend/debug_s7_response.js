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

        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers.get('content-type'));

        const text = await res.text();
        console.log('\nResponse (first 500 chars):');
        console.log(text.substring(0, 500));

        // Try to parse as JSON
        try {
            const data = JSON.parse(text);
            console.log('\n✅ Valid JSON!');
            console.log('IP:', data.query);
            console.log('ISP:', data.isp);
        } catch (e) {
            console.log('\n❌ Not JSON - HTML response detected');
            console.log('This means Every Proxy is blocking or intercepting the request');
        }
    } catch (error) {
        console.error('\n❌ Connection failed:', error.message);
    }
}

test();
