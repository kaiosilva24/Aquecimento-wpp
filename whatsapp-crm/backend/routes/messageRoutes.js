import express from 'express';
import { runQuery, allQuery, getQuery } from '../database/database.js';

const router = express.Router();

// Get all messages (optional filter by account)
router.get('/', async (req, res) => {
    try {
        const { accountId } = req.query;
        let query = 'SELECT * FROM messages WHERE 1=1';
        let params = [];

        if (accountId && accountId !== 'global') {
            // Fetch Global (account_id IS NULL) + Account Specific
            query += ' AND (account_id IS NULL OR account_id = ?)';
            params.push(accountId);
        } else {
            // Fetch only Global? Or All?
            // Usually dashboard wants to see "Global" messages. 
            // If we want ALL messages regardless of account, we allow it.
            // But let's assume default is "Global Only" if no account specified, 
            // OR "All Global + All Account" if admin?
            // Let's return EVERYTHING if no filter, or maybe just Global?
            // Let's return EVERYTHING for the management UI.
        }

        query += ' ORDER BY created_at DESC';
        const messages = await allQuery(query, params);
        res.json(messages);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

// Add new message (Single)
router.post('/', async (req, res) => {
    try {
        const { content, category = 'casual', active = 1, accountId = null } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const result = await runQuery(
            'INSERT INTO messages (content, category, active, account_id) VALUES (?, ?, ?, ?)',
            [content, category, active, accountId || null]
        );

        const message = await getQuery('SELECT * FROM messages WHERE id = ?', [result.id]);
        res.json(message);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ error: 'Failed to create message' });
    }
});

// Batch add messages
router.post('/batch', async (req, res) => {
    try {
        const { messages, category = 'casual', active = 1, accountId = null } = req.body;
        // messages should be an array of strings

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        let addedCount = 0;
        for (const content of messages) {
            if (content && content.trim()) {
                await runQuery(
                    'INSERT INTO messages (content, category, active, account_id) VALUES (?, ?, ?, ?)',
                    [content.trim(), category, active, accountId || null]
                );
                addedCount++;
            }
        }

        res.json({ message: `Successfully added ${addedCount} messages`, count: addedCount });
    } catch (error) {
        console.error('Error batch creating messages:', error);
        res.status(500).json({ error: 'Failed to create messages' });
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
