import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Helper to run commands with sudo
async function runSudo(command) {
    try {
        const { stdout, stderr } = await execAsync(`sudo ${command}`);
        if (stderr && !stderr.includes('Finished') && !stderr.includes('Notice')) {
            console.log('[WireGuard Info]', stderr);
        }
        return stdout.trim();
    } catch (error) {
        console.error(`Error running sudo command "${command}":`, error);
        throw error;
    }
}

class VpnService {
    constructor() {
        this.configPath = '/etc/wireguard/wg0.conf';
        this.interface = 'wg0';
        // Correct subnet based on existing wg0.conf
        this.serverIp = '10.0.0.1';
        this.subnet = '24';
    }

    async generateKeys() {
        const privateKey = await runSudo('wg genkey');
        const publicKey = await runSudo(`echo "${privateKey}" | wg pubkey`);
        return { privateKey, publicKey };
    }

    async getStatus() {
        try {
            await runSudo(`wg show ${this.interface}`);
            return { running: true };
        } catch (error) {
            return { running: false };
        }
    }

    async start() {
        const status = await this.getStatus();
        if (status.running) return;
        await runSudo(`wg-quick up ${this.interface}`);
    }

    async stop() {
        const status = await this.getStatus();
        if (!status.running) return;
        await runSudo(`wg-quick down ${this.interface}`);
    }

    async getConfig() {
        try {
            const content = await runSudo(`cat ${this.configPath}`);
            return content;
        } catch (error) {
            return null;
        }
    }

    async getPeers() {
        try {
            const raw = await runSudo(`wg show ${this.interface} dump`);
            // Format: public_key, preshared_key, endpoint, allowed_ips, latest_handshake, transfer_rx, transfer_tx, persistent_keepalive
            const lines = raw.split('\n').filter(l => l.trim());
            const peers = lines.slice(1).map(line => {
                // Log raw line for debugging
                console.log(`[VPN Debug] Parsing line: ${line.substring(0, 50)}...`);

                const parts = line.split('\t');
                // Ensure we have enough parts
                if (parts.length < 4) {
                    console.warn(`[VPN Debug] Invalid line format: ${line}`);
                    return null;
                }

                const [publicKey, psk, endpoint, allowedIps, handshake, rx, tx, keepalive] = parts;

                return {
                    publicKey,
                    endpoint: endpoint === '(none)' ? null : endpoint,
                    allowedIps,
                    handshake: parseInt(handshake) || 0,
                    rx: parseInt(rx) || 0,
                    tx: parseInt(tx) || 0
                };
            }).filter(p => p !== null);
            return peers;
        } catch (error) {
            console.error('[VPN Debug] getPeers Error:', error);
            return []; // Interface might be down
        }
    }

    async _getNextIp() {
        const peers = await this.getPeers();
        if (peers.length === 0) return '10.0.0.2';

        const usedIps = peers.map(p => {
            // p.allowedIps is like "10.0.0.2/32"
            return p.allowedIps.split('/')[0];
        });

        let max = 1;
        for (const ip of usedIps) {
            const parts = ip.split('.');
            if (parts.length === 4) {
                const octet = parseInt(parts[3]);
                if (!isNaN(octet) && octet > max) max = octet;
            }
        }
        return `10.0.0.${max + 1}`;
    }

    async addPeer(name) {
        // 1. Generate keys
        const { privateKey, publicKey } = await this.generateKeys();

        // 2. Get next IP
        const clientIp = await this._getNextIp();

        // 3. Append to server config
        const peerBlock = `
# Peer: ${name}
[Peer]
PublicKey = ${publicKey}
AllowedIPs = ${clientIp}/32
`;
        await runSudo(`bash -c "echo '${peerBlock}' >> ${this.configPath}"`);

        // 4. Update running interface
        const tempFile = `/tmp/new_peer_${Date.now()}.conf`;
        await runSudo(`echo "[Peer]
PublicKey = ${publicKey}
AllowedIPs = ${clientIp}/32" | tee ${tempFile}`);

        try {
            await runSudo(`wg addconf ${this.interface} ${tempFile}`);
        } catch (e) {
            // Ignore
        }
        await runSudo(`rm ${tempFile}`);

        // 5. Generate Client Config
        const serverPriv = await this._getServerPrivateKey();
        const serverPub = await runSudo(`echo "${serverPriv}" | wg pubkey`);
        const serverEndpoint = await this._getServerEndpoint();

        const clientConfig = `[Interface]
PrivateKey = ${privateKey}
Address = ${clientIp}/${this.subnet}
DNS = 8.8.8.8

[Peer]
PublicKey = ${serverPub}
Endpoint = ${serverEndpoint}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
`;

        return { config: clientConfig, ip: clientIp, publicKey };
    }

    async _getServerPrivateKey() {
        const conf = await this.getConfig();
        const match = conf.match(/PrivateKey\s*=\s*(.+)/);
        return match ? match[1].trim() : null;
    }

    async _getServerEndpoint() {
        try {
            // Try to get external IP
            const ip = await runSudo("curl -s --connect-timeout 2 ifconfig.me");
            if (ip && ip.trim().length > 0) return `${ip.trim()}:51820`;
        } catch (e) { }
        return 'SERVER_IP:51820'; // Fallback
    }

    // Create initial server config if missing (matches 10.0.0.1/24)
    async setupServer() {
        const exists = await runSudo(`test -f ${this.configPath} && echo yes || echo no`);
        if (exists === 'yes') return;

        const { privateKey } = await this.generateKeys();

        const config = `[Interface]
Address = 10.0.0.1/24
SaveConfig = true
PostUp = ufw route allow in on wg0 out on enp0s3
PostUp = iptables -t nat -I POSTROUTING -o enp0s3 -j MASQUERADE
PreDown = ufw route delete allow in on wg0 out on enp0s3
PreDown = iptables -t nat -D POSTROUTING -o enp0s3 -j MASQUERADE
ListenPort = 51820
PrivateKey = ${privateKey}
`;
        await runSudo(`bash -c "echo '${config}' > ${this.configPath}"`);
        await runSudo('sysctl -w net.ipv4.ip_forward=1');
    }
}

export default new VpnService();
