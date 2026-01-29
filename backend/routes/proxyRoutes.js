import express from 'express';
import { runQuery, allQuery } from '../database/database.js';
import { checkConnection } from '../services/networkService.js';

const router = express.Router();

// Get all proxies
router.get('/', async (req, res) => {
    try {
        const proxies = await allQuery('SELECT * FROM proxies ORDER BY created_at DESC');
        res.json(proxies);
    } catch (error) {
        console.error('Error getting proxies:', error);
        res.status(500).json({ error: 'Failed to get proxies' });
    }
});

// Add new proxy
router.post('/', async (req, res) => {
    try {
        const { name, host, port, protocol, username, password, auth_enabled } = req.body;

        if (!name || !host || !port) {
            return res.status(400).json({ error: 'Name, host and port are required' });
        }

        const auth = auth_enabled ? 1 : 0;

        await runQuery(
            'INSERT INTO proxies (name, host, port, protocol, username, password, auth_enabled, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)',
            [name, host, port, protocol || 'http', username, password, auth]
        );

        res.json({ message: 'Proxy added successfully' });
    } catch (error) {
        console.error('Error adding proxy:', error);
        res.status(500).json({ error: 'Failed to add proxy' });
    }
});

// Update proxy
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, host, port, protocol, username, password, auth_enabled, active } = req.body;

        const auth = auth_enabled ? 1 : 0;
        const isActive = active ? 1 : 0;

        await runQuery(
            'UPDATE proxies SET name = ?, host = ?, port = ?, protocol = ?, username = ?, password = ?, auth_enabled = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, host, port, protocol || 'http', username, password, auth, isActive, id]
        );

        res.json({ message: 'Proxy updated successfully' });
    } catch (error) {
        console.error('Error updating proxy:', error);
        res.status(500).json({ error: 'Failed to update proxy' });
    }
});

// Delete proxy
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await runQuery('DELETE FROM proxies WHERE id = ?', [id]);
        res.json({ message: 'Proxy deleted successfully' });
    } catch (error) {
        console.error('Error deleting proxy:', error);
        res.status(500).json({ error: 'Failed to delete proxy' });
    }
});

// Test proxy connection
router.post('/test', async (req, res) => {
    try {
        const { host, port, protocol, username, password, auth_enabled } = req.body;

        if (!host || !port) {
            return res.status(400).json({ error: 'Host and port are required' });
        }

        const proxyConfig = {
            host,
            port,
            protocol: protocol || 'http',
            username,
            password,
            auth_enabled: Boolean(auth_enabled)
        };

        console.log('Testing proxy connection:', { host, port, protocol });
        const result = await checkConnection(proxyConfig);

        if (result.success) {
            res.json({
                success: true,
                ip: result.ip,
                isp: result.isp,
                country: result.country,
                region: result.region,
                proxy_url: result.proxy_url
            });
        } else {
            res.json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('Error testing proxy:', error);
        res.status(500).json({ error: 'Failed to test proxy connection' });
    }
});

export default router;
