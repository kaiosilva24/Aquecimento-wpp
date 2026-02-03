import { allQuery, getQuery } from '../database/database.js';

class MessageService {
    // Get a random message from the pool
    async getRandomMessage(category = null) {
        try {
            let query = 'SELECT * FROM messages WHERE active = 1';
            const params = [];

            if (category) {
                query += ' AND category = ?';
                params.push(category);
            }

            const messages = await allQuery(query, params);

            if (messages.length === 0) {
                return null;
            }

            const randomIndex = Math.floor(Math.random() * messages.length);
            return messages[randomIndex];
        } catch (error) {
            console.error('Error getting random message:', error);
            throw error;
        }
    }

    // Process message with variables
    processMessage(messageContent, variables = {}) {
        let processed = messageContent;

        // Default variables
        const now = new Date();
        const defaultVars = {
            hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            data: now.toLocaleDateString('pt-BR'),
            dia: now.toLocaleDateString('pt-BR', { weekday: 'long' }),
            ...variables
        };

        // Process Spintax: {Option A|Option B|Option C}
        // Matches { ... } blocks and picks one random option separated by |
        processed = processed.replace(/\{([^{}]+)\}/g, (match, content) => {
            if (content.includes('|')) {
                const options = content.split('|');
                return options[Math.floor(Math.random() * options.length)];
            }
            return match; // If no pipe, it might be a variable we missed or invalid syntax, leave it (or it was already replaced)
        });

        // Replace all variables
        for (const [key, value] of Object.entries(defaultVars)) {
            const regex = new RegExp(`\\{${key}\\}`, 'gi');
            processed = processed.replace(regex, value);
        }

        return processed;
    }

    // Get all active messages
    async getAllMessages() {
        try {
            return await allQuery('SELECT * FROM messages ORDER BY created_at DESC');
        } catch (error) {
            console.error('Error getting all messages:', error);
            throw error;
        }
    }

    // Get message by ID
    async getMessageById(id) {
        try {
            return await getQuery('SELECT * FROM messages WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error getting message by ID:', error);
            throw error;
        }
    }
}

const messageService = new MessageService();
export default messageService;
