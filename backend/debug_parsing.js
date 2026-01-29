import { exec } from 'child_process';

console.log('--- Running WG Dump Check ---');
exec('sudo wg show wg0 dump', (err, stdout) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('Raw Output Length:', stdout.length);

    const lines = stdout.split('\n').filter(l => l.trim());
    console.log(`Found ${lines.length} lines (including header implied if > 0)`);

    lines.slice(1).forEach((line, idx) => {
        console.log(`\n-- Peer ${idx + 1} --`);
        const parts = line.split('\t');
        console.log(`Parts count: ${parts.length}`);

        // Map expected fields
        const fields = [
            'publicKey', 'presharedKey', 'endpoint', 'allowedIps',
            'handshake', 'rx', 'tx', 'keepalive'
        ];

        parts.forEach((p, i) => {
            console.log(`  [${i}] ${fields[i] || 'unknown'}: "${p}"`);
        });
    });
});
