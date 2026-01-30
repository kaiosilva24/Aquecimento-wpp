import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function testServerUltimate() {
    console.log('=== Testing S7 Server Ultimate Proxy ===\n');
    console.log('Device: S7 (10.0.0.3)');
    console.log('Port: 8888 (Server Ultimate default)\n');

    const proxyUrl = 'http://10.0.0.3:8888';
    const agent = new HttpsProxyAgent(proxyUrl);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        console.log('Connecting via proxy...');
        const res = await fetch('http://ip-api.com/json', {
            agent,
            signal: controller.signal
        });
        clearTimeout(timeout);

        console.log(`Status: ${res.status}`);

        const data = await res.json();

        console.log('\n✅ SUCESSO! Server Ultimate está funcionando!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📱 IP Externo:', data.query);
        console.log('📡 Operadora:', data.isp);
        console.log('🌍 País:', data.country);
        console.log('📍 Região:', data.regionName);
        console.log('🏙️  Cidade:', data.city);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('Dados completos:');
        console.log(JSON.stringify(data, null, 2));

        return true;
    } catch (error) {
        console.error('\n❌ FALHOU:', error.message);
        console.error('\nPossíveis causas:');
        console.error('1. Server Ultimate não está rodando no S7');
        console.error('2. Porta incorreta (verifique no app)');
        console.error('3. Firewall bloqueando a conexão');
        console.error('4. S7 sem internet ativa');
        return false;
    }
}

testServerUltimate();
