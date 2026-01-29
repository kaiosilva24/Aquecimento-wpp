import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function testS7ServerUltimate() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   TESTE S7 SERVER ULTIMATE - PORTA 8888   ║');
    console.log('╚════════════════════════════════════════════╝\n');

    const proxyUrl = 'http://10.0.0.3:8888';
    const agent = new HttpsProxyAgent(proxyUrl);

    console.log('📱 Dispositivo: S7');
    console.log('🔌 Proxy: 10.0.0.3:8888');
    console.log('🔄 Conectando...\n');

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const startTime = Date.now();
        const res = await fetch('http://ip-api.com/json', {
            agent,
            signal: controller.signal
        });
        const responseTime = Date.now() - startTime;
        clearTimeout(timeout);

        const data = await res.json();

        console.log('✅ SUCESSO! Server Ultimate funcionando perfeitamente!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 INFORMAÇÕES DA CONEXÃO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🌐 IP Externo:     ${data.query}`);
        console.log(`📡 Operadora:      ${data.isp}`);
        console.log(`🌍 País:           ${data.country}`);
        console.log(`📍 Estado:         ${data.regionName}`);
        console.log(`🏙️  Cidade:         ${data.city}`);
        console.log(`⚡ Tempo Resposta: ${responseTime}ms`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✅ PRÓXIMOS PASSOS:');
        console.log('1. Atualize o proxy no sistema:');
        console.log('   - Host: 10.0.0.3');
        console.log('   - Porta: 8888');
        console.log('2. Teste a conexão na interface');
        console.log('3. Configure contas WhatsApp para usar este proxy\n');

        return true;
    } catch (error) {
        console.log('❌ FALHOU!\n');
        console.log('Erro:', error.message);

        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n⚠️ Servidor recusou conexão');
            console.log('Verifique:');
            console.log('- Server Ultimate está RODANDO (verde)?');
            console.log('- Bind Address está como 0.0.0.0?');
        } else if (error.message.includes('aborted')) {
            console.log('\n⚠️ Timeout - servidor não respondeu');
            console.log('Verifique:');
            console.log('- S7 tem internet ativa?');
            console.log('- Allow External Connections habilitado?');
        }

        return false;
    }
}

testS7ServerUltimate();
