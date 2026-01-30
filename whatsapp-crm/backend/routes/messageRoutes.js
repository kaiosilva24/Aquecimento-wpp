import express from 'express';
import { runQuery, allQuery, getQuery } from '../database/database.js';

const router = express.Router();

// Get all messages
router.get('/', async (req, res) => {
    try {
        const messages = await allQuery('SELECT * FROM messages ORDER BY created_at DESC');
        res.json(messages);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

// Add new message
router.post('/', async (req, res) => {
    try {
        const { content, category = 'casual', active = 1 } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const result = await runQuery(
            'INSERT INTO messages (content, category, active) VALUES (?, ?, ?)',
            [content, category, active]
        );

        const message = await getQuery('SELECT * FROM messages WHERE id = ?', [result.id]);
        res.json(message);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ error: 'Failed to create message' });
    }
});

// Update message
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, category, active } = req.body;

        await runQuery(
            'UPDATE messages SET content = ?, category = ?, active = ? WHERE id = ?',
            [content, category, active, id]
        );

        const message = await getQuery('SELECT * FROM messages WHERE id = ?', [id]);
        res.json(message);
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ error: 'Failed to update message' });
    }
});

// Delete message
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await runQuery('DELETE FROM messages WHERE id = ?', [id]);
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

export default router;
