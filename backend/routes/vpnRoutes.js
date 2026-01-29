import express from 'express';
import vpnService from '../services/vpnService.js';
import QRCode from 'qrcode';

const router = express.Router();

// Get VPN status
router.get('/status', async (req, res) => {
    try {
        const status = await vpnService.getStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get VPN status' });
    }
});

// Setup/Start VPN
router.post('/start', async (req, res) => {
    try {
        await vpnService.setupServer(); // Ensures config exists
        await vpnService.start();
        res.json({ success: true, message: 'VPN started' });
    } catch (error) {
        console.error('Start VPN error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stop VPN
router.post('/stop', async (req, res) => {
    try {
        await vpnService.stop();
        res.json({ success: true, message: 'VPN stopped' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Connected Peers
router.get('/peers', async (req, res) => {
    try {
        const peers = await vpnService.getPeers();
        res.json(peers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get peers' });
    }
});

// Create New Peer (Add Device)
router.post('/peers', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const result = await vpnService.addPeer(name);

        // Generate QR Code for the config
        const qrCode = await QRCode.toDataURL(result.config);

        res.json({
            success: true,
            ip: result.ip,
            publicKey: result.publicKey,
            config: result.config,
            qr_code: qrCode
        });
    } catch (error) {
        console.error('Add peer error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
