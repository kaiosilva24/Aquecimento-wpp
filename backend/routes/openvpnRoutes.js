import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execAsync = promisify(exec);

// Helper to run commands with sudo
async function runSudo(command) {
    try {
        const { stdout, stderr } = await execAsync(`sudo ${command}`);
        return stdout.trim();
    } catch (error) {
        console.error(`Error running sudo command "${command}":`, error);
        throw error;
    }
}

// Get OpenVPN status and connected clients
router.get('/status', async (req, res) => {
    try {
        const result = {
            service: { running: false },
            connectedClients: [],
            serverInfo: {},
            timestamp: new Date().toISOString()
        };

        // 1. Check OpenVPN service status
        try {
            const serviceStatus = await execAsync('systemctl is-active openvpn-server@server');
            result.service.running = serviceStatus.trim() === 'active';
        } catch (error) {
            result.service.running = false;
        }

        // 2. Get connected clients from status log
        try {
            const statusLog = await runSudo('cat /var/log/openvpn/openvpn-status.log');
            const lines = statusLog.split('\n');
            let inClientSection = false;

            for (const line of lines) {
                if (line.includes('Common Name,Real Address')) {
                    inClientSection = true;
                    continue;
                }
                if (line.includes('ROUTING TABLE')) {
                    inClientSection = false;
                }
                if (inClientSection && line.trim() && !line.includes('Updated,')) {
                    const parts = line.split(',');
                    if (parts.length >= 4) {
                        result.connectedClients.push({
                            name: parts[0],
                            realAddress: parts[1],
                            vpnIp: parts[2],
                            connectedSince: parts[3],
                            bytesReceived: parts[4] || '0',
                            bytesSent: parts[5] || '0'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error reading OpenVPN status log:', error);
        }

        // 3. Check VPN interface
        try {
            const ifconfig = await execAsync('ip addr show tun0');
            const ipMatch = ifconfig.match(/inet (\d+\.\d+\.\d+\.\d+)/);
            if (ipMatch) {
                result.serverInfo.vpnIp = ipMatch[1];
                result.serverInfo.interface = 'tun0';
                result.serverInfo.interfaceUp = true;
            }
        } catch (error) {
            result.serverInfo.interfaceUp = false;
        }

        // 4. Get server public IP
        try {
            const publicIp = await execAsync('curl -s --max-time 3 ifconfig.me');
            result.serverInfo.publicIp = publicIp.trim();
        } catch (error) {
            result.serverInfo.publicIp = 'unknown';
        }

        // Check if S7 is connected
        const s7Client = result.connectedClients.find(c =>
            c.name.toLowerCase().includes('s7')
        );

        if (s7Client) {
            result.s7Status = {
                connected: true,
                vpnIp: s7Client.vpnIp,
                realAddress: s7Client.realAddress,
                connectedSince: s7Client.connectedSince
            };
        } else {
            result.s7Status = {
                connected: false,
                message: 'S7 device not found in connected clients'
            };
        }

        res.json(result);
    } catch (error) {
        console.error('OpenVPN status error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start OpenVPN service
router.post('/start', async (req, res) => {
    try {
        await runSudo('systemctl start openvpn-server@server');
        res.json({ success: true, message: 'OpenVPN service started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stop OpenVPN service
router.post('/stop', async (req, res) => {
    try {
        await runSudo('systemctl stop openvpn-server@server');
        res.json({ success: true, message: 'OpenVPN service stopped' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get OpenVPN logs
router.get('/logs', async (req, res) => {
    try {
        const logs = await runSudo('tail -n 100 /var/log/openvpn/openvpn.log');
        res.json({ logs: logs.split('\n') });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test connectivity to a specific VPN client
router.post('/test-client', async (req, res) => {
    try {
        const { vpnIp } = req.body;
        if (!vpnIp) {
            return res.status(400).json({ error: 'vpnIp is required' });
        }

        // Ping test
        const pingResult = await execAsync(`ping -c 3 -W 2 ${vpnIp}`);

        res.json({
            success: true,
            vpnIp,
            reachable: true,
            pingOutput: pingResult.stdout
        });
    } catch (error) {
        res.json({
            success: false,
            vpnIp: req.body.vpnIp,
            reachable: false,
            error: error.message
        });
    }
});

export default router;
