import express from 'express';
import delayService from '../services/delayService.js';
import autoReplyService from '../services/autoReplyService.js';
import proxyService from '../services/proxyService.js';
import { checkConnection } from '../services/networkService.js';

const router = express.Router();

// Get delay configuration
router.get('/delay', async (req, res) => {
    try {
        const config = await delayService.getConfig();
        const description = await delayService.getDelayDescription();
        res.json({ ...config, description });
    } catch (error) {
        console.error('Error getting delay config:', error);
        res.status(500).json({ error: 'Failed to get delay configuration' });
    }
});

// Update delay configuration
router.post('/delay', async (req, res) => {
    try {
        const { type, min_seconds, max_seconds, fixed_seconds } = req.body;

        if (!type) {
            return res.status(400).json({ error: 'Delay type is required' });
        }

        const config = await delayService.updateConfig(type, {
            min_seconds,
            max_seconds,
            fixed_seconds
        });

        const description = await delayService.getDelayDescription();
        res.json({ ...config, description });
    } catch (error) {
        console.error('Error updating delay config:', error);
        res.status(500).json({ error: 'Failed to update delay configuration' });
    }
});

// Get auto-reply configuration
router.get('/auto-reply', async (req, res) => {
    try {
        const config = await autoReplyService.getConfig();
        res.json(config);
    } catch (error) {
        console.error('Error getting auto-reply config:', error);
        res.status(500).json({ error: 'Failed to get auto-reply configuration' });
    }
});

// Update auto-reply configuration
router.post('/auto-reply', async (req, res) => {
    try {
        const config = await autoReplyService.updateConfig(req.body);
        res.json(config);
    } catch (error) {
        console.error('Error updating auto-reply config:', error);
        res.status(500).json({ error: 'Failed to update auto-reply configuration' });
    }
});

// Get all proxies
router.get('/proxy', async (req, res) => {
    try {
        const proxies = await proxyService.getAll();
        res.json(proxies);
    } catch (error) {
        console.error('Error getting proxies:', error);
        res.status(500).json({ error: 'Failed to get proxies' });
    }
});

// Create new proxy
router.post('/proxy', async (req, res) => {
    try {
        const proxy = await proxyService.create(req.body);
        res.json(proxy);
    } catch (error) {
        console.error('Error creating proxy:', error);
        res.status(500).json({ error: 'Failed to create proxy' });
    }
});

// Update proxy
router.put('/proxy/:id', async (req, res) => {
    try {
        const proxy = await proxyService.update(req.params.id, req.body);
        res.json(proxy);
    } catch (error) {
        console.error('Error updating proxy:', error);
        res.status(500).json({ error: 'Failed to update proxy' });
    }
});

// Delete proxy
router.delete('/proxy/:id', async (req, res) => {
    try {
        await proxyService.delete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting proxy:', error);
        res.status(500).json({ error: 'Failed to delete proxy' });
    }
});

// Assign accounts to proxy
router.post('/proxy/:id/accounts', async (req, res) => {
    try {
        const { accountIds } = req.body;
        await proxyService.assignAccounts(req.params.id, accountIds);
        res.json({ success: true });
    } catch (error) {
        console.error('Error assigning accounts:', error);
        res.status(500).json({ error: 'Failed to assign accounts' });
    }
});

// Get accounts for proxy
router.get('/proxy/:id/accounts', async (req, res) => {
    try {
        const accounts = await proxyService.getAssignedAccounts(req.params.id);
        res.json(accounts);
    } catch (error) {
        console.error('Error getting assigned accounts:', error);
        res.status(500).json({ error: 'Failed to get assigned accounts' });
    }
});

// Check network status (IP/ISP)
router.get('/network/status', async (req, res) => {
    try {
        // If accountId is provided, we could check for that account, but 
        // for now let's just return the current server/proxy connection status
        // or check generic connectivity.
        const result = await checkConnection(null); // Check local/server connection
        res.json(result);
    } catch (error) {
        console.error('Error checking network status:', error);
        res.status(500).json({ error: 'Failed to check network status' });
    }
});

export default router;
