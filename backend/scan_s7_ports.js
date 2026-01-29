import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const ports = [8080, 8888, 3128, 8118, 9090, 1080];

async function testPort(port) {
    const proxyUrl = `http://10.0.0.3:${port}`;
    const agent = new HttpsProxyAgent(proxyUrl);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch('http://ip-api.com/json', {
            agent,
            signal: controller.signal
        });
        clearTimeout(timeout);

        const data = await res.json();
        console.log(`\n✅ PORT ${port} WORKS!`);
        console.log('IP:', data.query);
        console.log('ISP:', data.isp);
        console.log('Country:', data.country);
        return true;
    } catch (error) {
        console.log(`❌ Port ${port}: ${error.message.substring(0, 50)}`);
        return false;
    }
}

async function findWorkingPort() {
    console.log('Scanning S7 (10.0.0.3) for Every Proxy...\n');

    for (const port of ports) {
        const works = await testPort(port);
        if (works) {
            console.log(`\n🎯 Use this in the system: 10.0.0.3:${port}`);
            return;
        }
    }

    console.log('\n⚠️ No working proxy found on common ports.');
    console.log('Check the Every Proxy app to see which port it\'s using.');
}

findWorkingPort();
