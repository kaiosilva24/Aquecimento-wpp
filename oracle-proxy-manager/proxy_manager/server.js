const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const PORT = 3000;
const SCRIPT_DIR = '/home/ubuntu/oracle_scripts';

// Helper to parse WireGuard config
function parseWireGuardPeers(configContent) {
    const peers = [];
    const lines = configContent.split('\n');
    let currentPeer = {};

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('# Name:')) {
            currentPeer.name = trimmed.replace('# Name:', '').trim();
        } else if (trimmed.startsWith('AllowedIPs =')) {
            currentPeer.ip = trimmed.replace('AllowedIPs =', '').trim().split('/')[0];
        } else if (trimmed.startsWith('[Peer]')) {
            if (currentPeer.name) {
                peers.push(currentPeer);
            }
            currentPeer = {};
        }
    });
    // Push last one if exists
    if (currentPeer.name) peers.push(currentPeer);

    return peers;
}

// API to list devices
app.get('/api/devices', (req, res) => {
    exec('sudo cat /etc/wireguard/wg0.conf', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error reading wg0.conf: ${stderr}`);
            return res.status(500).json({ error: 'Failed to read VPN config' });
        }

        try {
            const peers = parseWireGuardPeers(stdout);
            res.json({ devices: peers });
        } catch (e) {
            res.status(500).json({ error: 'Failed to parse VPN config' });
        }
    });
});

// API to get specific device config (for QR code)
app.post('/api/get-device-config', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '');

    exec(`sudo cat ${cleanName}.conf`, { cwd: SCRIPT_DIR }, (error, stdout, stderr) => {
        if (error) {
            return res.status(404).json({ error: 'Config file not found', details: stderr });
        }
        res.json({ config: stdout });
    });
});

// API to add a device
app.post('/api/add-device', (req, res) => {
    const { name, ipSuffix } = req.body;

    if (!name || !ipSuffix) {
        return res.status(400).json({ error: 'Name and IP Suffix are required' });
    }

    const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanSuffix = parseInt(ipSuffix);

    if (isNaN(cleanSuffix) || cleanSuffix < 2 || cleanSuffix > 254) {
        return res.status(400).json({ error: 'Invalid IP Suffix (must be 2-254)' });
    }

    const command = `sudo ./add_device.sh ${cleanName} ${cleanSuffix}`;
    console.log(`Executing in ${SCRIPT_DIR}: ${command}`);

    exec(command, { cwd: SCRIPT_DIR }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: 'Failed to generate config', details: stderr, logs: stdout });
        }

        exec(`sudo cat ${cleanName}.conf`, { cwd: SCRIPT_DIR }, (catErr, catOut) => {
            if (catErr) {
                console.error('Read Error:', catErr);
                return res.json({ message: 'Device added (file read failed)', logs: stdout });
            }
            res.json({ message: 'Device added successfully', config: catOut, logs: stdout });
        });
    });
});

// API to test proxy connection
app.post('/api/test-proxy', (req, res) => {
    const { ipSuffix } = req.body;
    const cleanSuffix = parseInt(ipSuffix);

    if (isNaN(cleanSuffix) || cleanSuffix < 2 || cleanSuffix > 254) {
        return res.status(400).json({ error: 'Invalid IP Suffix' });
    }

    const port = 3000 + (cleanSuffix - 1);
    const command = `curl -x http://127.0.0.1:${port} -s --max-time 10 https://api.ipify.org`;
    console.log(`Testing Proxy on port ${port}: ${command}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.json({ success: false, error: error.message, details: stderr, port });
        }
        res.json({ success: true, ip: stdout.trim(), port });
    });
});

// API to delete device
app.post('/api/delete-device', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '');
    const command = `sudo python3 ${SCRIPT_DIR}/delete_device.py ${cleanName}`;

    console.log(`Deleting: ${cleanName}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Delete Error: ${stderr}`);
            return res.status(500).json({ error: 'Failed to delete', details: stderr, logs: stdout });
        }
        res.json({ success: true, logs: stdout });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy Manager running on http://0.0.0.0:${PORT}`);
});
