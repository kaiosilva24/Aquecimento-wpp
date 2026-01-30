
import vpnService from './services/vpnService.js';

async function test() {
    console.log('Testing vpnService.getPeers()...');
    const peers = await vpnService.getPeers();
    console.log(JSON.stringify(peers, null, 2));
}

test();
