import express from 'express';
import { runQuery, allQuery, getQuery } from '../database/database.js';
import whatsappManager from '../services/whatsappManager.js';
import { checkConnection } from '../services/networkService.js';

const router = express.Router();

// Get all accounts
router.get('/', async (req, res) => {
    try {
        const accounts = await allQuery('SELECT * FROM accounts ORDER BY created_at DESC');
        res.json(accounts);
    } catch (error) {
        console.error('Error getting accounts:', error);
        res.status(500).json({ error: 'Failed to get accounts' });
    }
});

// Add new account
router.post('/', async (req, res) => {
    try {
        const { name, proxyId, networkMode } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Account name is required' });
        }

        const result = await runQuery(
            'INSERT INTO accounts (name, status, proxy_id, network_mode) VALUES (?, ?, ?, ?)',
            [name, 'disconnected', proxyId || null, networkMode || 'local']
        );

        const accountId = result.id;

        // Create WhatsApp client
        await whatsappManager.createClient(accountId, name);

        res.json({
            id: accountId,
            name,
            status: 'disconnected',
            network_mode: networkMode || 'local',
            message: 'Account created. Scan QR code to connect.'
        });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// Get account status
router.get('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const account = await getQuery('SELECT * FROM accounts WHERE id = ?', [id]);

        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        const isConnected = whatsappManager.isConnected(parseInt(id));

        res.json({
            ...account,
            is_connected: isConnected
        });
    } catch (error) {
        console.error('Error getting account status:', error);
        res.status(500).json({ error: 'Failed to get account status' });
    }
});

// Get QR code for account
router.get('/:id/qr', async (req, res) => {
    try {
        const { id } = req.params;

        // SECURITY CHECK: Verify proxy is working BEFORE returning QR code
        const account = await getQuery('SELECT * FROM accounts WHERE id = ?', [id]);

        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // If account is in proxy mode, we rely on the Manager's initial check.
        // Checking here on every poll (every few seconds) causes DDOS/Rate-limiting of ip-api.com
        // and makes the UI extremely slow.
        if (account.network_mode === 'proxy' && !account.proxy_id) {
            return res.status(403).json({
                error: 'Security Error: Proxy mode enabled but no proxy configured.'
            });
        }

        const qrCode = whatsappManager.getQRCode(parseInt(id));

        if (!qrCode) {
            return res.status(404).json({ error: 'QR code not available. Account may already be connected.' });
        }

        res.json({ qr_code: qrCode });
    } catch (error) {
        console.error('Error getting QR code:', error);
        res.status(500).json({ error: 'Failed to get QR code' });
    }
});

// Delete account
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Disconnect client first
        await whatsappManager.disconnectClient(parseInt(id));

        // Delete from database
        await runQuery('DELETE FROM accounts WHERE id = ?', [id]);

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

// Reconnect account
router.post('/:id/reconnect', async (req, res) => {
    try {
        const { id } = req.params;
        const account = await getQuery('SELECT * FROM accounts WHERE id = ?', [id]);

        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        await whatsappManager.createClient(parseInt(id), account.name);

        res.json({ message: 'Reconnection initiated. Scan QR code if needed.' });
    } catch (error) {
        console.error('Error reconnecting account:', error);
        res.status(500).json({ error: 'Failed to reconnect account' });
    }
});

// Update account network mode
router.put('/:id/network-mode', async (req, res) => {
    try {
        const { id } = req.params;
        const { networkMode, proxyId } = req.body;

        if (!networkMode || !['local', 'proxy'].includes(networkMode)) {
            return res.status(400).json({ error: 'Invalid network mode. Must be "local" or "proxy".' });
        }

        const account = await getQuery('SELECT * FROM accounts WHERE id = ?', [id]);
        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        // If switching to proxy, proxyId is required (unless just switching mode back/forth without changing proxy, but better to enforce)
        // Actually, if mode is proxy, we should update proxy_id. If local, maybe set to null?
        // Let's allow updating both. If proxyId is provided, update it.

        // Logic: Always update network_mode. Update proxy_id only if provided or if switching to local (clear it).
        // Actually, easiest is to allow updating proxy_id if sent.

        let query = 'UPDATE accounts SET network_mode = ?, updated_at = CURRENT_TIMESTAMP';
        let params = [networkMode];

        if (proxyId !== undefined) {
            query += ', proxy_id = ?';
            params.push(proxyId); // Could be null
        } else if (networkMode === 'local') {
            // Optional: Auto-clear proxy_id if local? 
            // query += ', proxy_id = NULL';
            // No, keep it saved in case they switch back. default behavior.
        }

        query += ' WHERE id = ?';
        params.push(id);

        await runQuery(query, params);

        // FORCE DISCONNECT: If the network mode changes, the existing client (if any) is using the OLD mode.
        // We must kill it to prevent "Local" connection persisting while DB says "Proxy".
        if (whatsappManager.isConnected(parseInt(id))) {
            console.log(`[NETWORK CHANGE] Disconnecting account ${id} to apply new network mode: ${networkMode}`);
            await whatsappManager.disconnectClient(parseInt(id));
        }

        res.json({
            message: 'Network mode updated successfully. Active connections were reset.',
            network_mode: networkMode
        });
    } catch (error) {
        console.error('Error updating network mode:', error);
        res.status(500).json({ error: 'Failed to update network mode' });
    }
});

// Get account network status
router.get('/:id/network', async (req, res) => {
    try {
        const { id } = req.params;
        const account = await getQuery('SELECT * FROM accounts WHERE id = ?', [id]);

        if (!account) {
            return res.status(404).json({ error: 'Account not found' });
        }

        let proxyConfig = null;

        // If network mode is 'proxy' and a proxy is assigned, fetch proxy details
        if (account.network_mode === 'proxy') {
            if (!account.proxy_id) {
                return res.json({
                    success: false,
                    mode: 'proxy',
                    error: 'Proxy mode enabled but no proxy ID assigned. Connection blocked to prevent leak.'
                });
            }
            proxyConfig = await getQuery('SELECT * FROM proxies WHERE id = ?', [account.proxy_id]);

            if (!proxyConfig) {
                return res.json({
                    success: false,
                    mode: 'proxy',
                    error: 'Assigned proxy not found in database.'
                });
            }
        }

        console.log(`[Account ${id}] Checking network status via ${account.network_mode}...`);
        const result = await checkConnection(proxyConfig);

        if (result.success) {
            res.json({
                success: true,
                mode: account.network_mode,
                ip: result.ip,
                isp: result.isp,
                country: result.country,
                region: result.region,
                proxy_name: proxyConfig ? proxyConfig.name : null
            });
        } else {
            res.json({
                success: false,
                mode: account.network_mode,
                error: result.error
            });
        }

    } catch (error) {
        console.error('Error checking account network:', error);
        res.status(500).json({ error: 'Failed to check network status' });
    }
});

export default router;
