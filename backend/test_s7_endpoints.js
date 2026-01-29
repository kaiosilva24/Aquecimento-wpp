import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function testEndpoint(url, description) {
    console.log(`\nTesting: ${description}`);
    console.log(`URL: ${url}`);

    const proxyUrl = 'http://10.0.0.3:8888';
    const agent = new HttpsProxyAgent(proxyUrl);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(url, {
            agent,
            signal: controller.signal
        });
        clearTimeout(timeout);

        const text = await res.text();
        console.log(`✅ Status: ${res.status}`);
        console.log(`Response: ${text.substring(0, 200)}`);
        return true;
    } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('=== Testing S7 Every Proxy (10.0.0.3:8888) ===\n');

    await testEndpoint('http://ifconfig.me', 'Simple IP check (ifconfig.me)');
    await testEndpoint('http://icanhazip.com', 'Simple IP check (icanhazip.com)');
    await testEndpoint('http://httpbin.org/ip', 'HTTP Bin IP');
    await testEndpoint('http://ip-api.com/json', 'IP-API (original)');
}

runTests();
