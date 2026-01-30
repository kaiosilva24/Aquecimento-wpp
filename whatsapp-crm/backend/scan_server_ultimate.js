import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const ports = [8080, 8888, 3128, 1080, 9090, 8000, 8008, 8081];

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
        console.log(`\n✅ PORTA ${port} FUNCIONA!`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📱 IP:', data.query);
        console.log('📡 ISP:', data.isp);
        console.log('🌍 País:', data.country);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return port;
    } catch (error) {
        const msg = error.message.includes('ECONNREFUSED') ? 'Recusado' :
            error.message.includes('aborted') ? 'Timeout' :
                error.message.substring(0, 30);
        console.log(`❌ Porta ${port}: ${msg}`);
        return null;
    }
}

async function scanPorts() {
    console.log('🔍 Procurando Server Ultimate no S7 (10.0.0.3)...\n');

    for (const port of ports) {
        const result = await testPort(port);
        if (result) {
            console.log(`\n🎯 Configure o sistema para usar: 10.0.0.3:${result}`);
            return;
        }
    }

    console.log('\n⚠️ Nenhuma porta respondeu.');
    console.log('\nVerifique no Server Ultimate:');
    console.log('1. Se o servidor HTTP Proxy está ATIVO');
    console.log('2. Qual porta está configurada');
    console.log('3. Se "Allow External Connections" está habilitado');
}

scanPorts();
