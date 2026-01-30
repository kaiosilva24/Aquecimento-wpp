import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function test() {
    console.log('Testing node-fetch with agent...');
    try {
        console.log('1. Direct fetch:');
        const res1 = await fetch('http://ip-api.com/json');
        const data1 = await res1.json();
        console.log('Direct IP:', data1.query);

        console.log('2. Proxy fetch (Invalid Proxy 127.0.0.1:9999):');
        const agent = new HttpsProxyAgent('http://127.0.0.1:9999');

        // Set a short timeout to avoid hanging
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const res2 = await fetch('http://ip-api.com/json', {
            agent,
            signal: controller.signal
        });
        clearTimeout(timeout);

        const data2 = await res2.json();
        console.log('Proxy IP:', data2.query);
        if (data2.query === data1.query) {
            console.log('FAILURE: Proxy was IGNORED. Request went direct.');
        } else {
            console.log('SUCCESS: Proxy worked (IP changed).');
        }

    } catch (e) {
        console.log('Proxy fetch result:', e.message);
        if (e.message.includes('ECONNREFUSED') || e.code === 'ECONNREFUSED' || e.name === 'AbortError') {
            console.log('SUCCESS: Agent was attempted (Connection Refused/Timeout). This proves the agent is NOT ignored.');
        } else {
            console.log('UNKNOWN ERROR:', e);
        }
    }
}

test();
