import express from 'express';
import interactionService from '../services/interactionService.js';

const router = express.Router();

// Start warming interactions
router.post('/start', async (req, res) => {
    try {
        if (interactionService.isServiceRunning()) {
            return res.status(400).json({ error: 'Interaction service is already running' });
        }

        await interactionService.start();
        res.json({ message: 'Warming interactions started successfully' });
    } catch (error) {
        console.error('Error starting interactions:', error);
        res.status(500).json({ error: 'Failed to start interactions' });
    }
});

// Stop warming interactions
router.post('/stop', async (req, res) => {
    try {
        if (!interactionService.isServiceRunning()) {
            return res.status(400).json({ error: 'Interaction service is not running' });
        }

        await interactionService.stop();
        res.json({ message: 'Warming interactions stopped successfully' });
    } catch (error) {
        console.error('Error stopping interactions:', error);
        res.status(500).json({ error: 'Failed to stop interactions' });
    }
});

// Get interaction statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await interactionService.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Get recent interactions
router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const interactions = await interactionService.getRecentInteractions(limit);
        res.json(interactions);
    } catch (error) {
        console.error('Error getting recent interactions:', error);
        res.status(500).json({ error: 'Failed to get recent interactions' });
    }
});

// Get service status
router.get('/status', async (req, res) => {
    try {
        const isRunning = interactionService.isServiceRunning();
        res.json({ is_running: isRunning });
    } catch (error) {
        console.error('Error getting service status:', error);
        res.status(500).json({ error: 'Failed to get service status' });
    }
});

export default router;
