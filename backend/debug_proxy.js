import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import fetch from 'node-fetch';

console.log('Imports successful');

try {
    const proxyUrl = 'socks5://user:pass@1.2.3.4:1080'; // Dummy SOCKS proxy
    console.log('Attempting to create SocksProxyAgent...');
    const agent = new SocksProxyAgent(proxyUrl);
    console.log('Agent created:', agent);

    console.log('Attempting fetch...');
    // This will fail connection but shouldn't crash process
    fetch('https://api.ipify.org', { agent, timeout: 5000 })
        .then(res => console.log('Fetch success:', res.status))
        .catch(err => console.log('Fetch error (expected):', err.message));

} catch (e) {
    console.error('CRITICAL CRASH during execution:', e);
}
