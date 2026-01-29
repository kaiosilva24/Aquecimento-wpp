import { getQuery, runQuery } from '../database/database.js';
import whatsappManager from './whatsappManager.js';
import messageService from './messageService.js';
import mediaService from './mediaService.js';
import delayService from './delayService.js';

class AutoReplyService {
    constructor() {
        this.replyHistory = new Map(); // Track recent replies to avoid loops
        this.setupListeners();
    }

    // Setup message listeners
    setupListeners() {
        whatsappManager.on('message', async ({ accountId, message }) => {
            await this.handleIncomingMessage(accountId, message);
        });
    }

    // Get auto-reply configuration
    async getConfig() {
        try {
            const config = await getQuery('SELECT * FROM auto_reply_config WHERE id = 1');
            return config || {
                enabled_individual: 1,
                enabled_groups: 1,
                delay_before_reply: 5,
                ignore_list: ''
            };
        } catch (error) {
            console.error('Error getting auto-reply config:', error);
            throw error;
        }
    }

    // Update auto-reply configuration
    async updateConfig(config) {
        try {
            const { enabled_individual, enabled_groups, delay_before_reply, ignore_list } = config;

            await runQuery(
                `UPDATE auto_reply_config 
         SET enabled_individual = ?, enabled_groups = ?, delay_before_reply = ?, 
             ignore_list = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = 1`,
                [enabled_individual, enabled_groups, delay_before_reply, ignore_list || '']
            );

            return await this.getConfig();
        } catch (error) {
            console.error('Error updating auto-reply config:', error);
            throw error;
        }
    }

    // Handle incoming message
    async handleIncomingMessage(accountId, message) {
        try {
            const config = await this.getConfig();

            // Check if message is from a group
            const isGroup = message.from.includes('@g.us');

            // Check if auto-reply is enabled for this type
            if (isGroup && !config.enabled_groups) return;
            if (!isGroup && !config.enabled_individual) return;

            // Check if sender is in ignore list
            const ignoreList = config.ignore_list ? config.ignore_list.split(',').map(s => s.trim()) : [];
            if (ignoreList.includes(message.from)) return;

            // Prevent replying to own messages
            const client = whatsappManager.getClient(accountId);
            if (!client || !client.info) return;

            const ownNumber = client.info.wid.user;
            if (message.from.includes(ownNumber)) return;

            // Check if we recently replied to this contact (prevent loops)
            const replyKey = `${accountId}-${message.from}`;
            const lastReply = this.replyHistory.get(replyKey);
            const now = Date.now();

            if (lastReply && (now - lastReply) < 60000) { // Don't reply within 1 minute
                return;
            }

            // Wait before replying (simulate human behavior)
            const replyDelay = config.delay_before_reply * 1000;
            await delayService.sleep(replyDelay);

            // Get random message
            const randomMessage = await messageService.getRandomMessage();
            if (!randomMessage) {
                console.log('No messages available for auto-reply');
                return;
            }

            // Process message with variables
            const processedMessage = messageService.processMessage(randomMessage.content);

            // Decide whether to send text or media (70% text, 30% media)
            const sendMedia = Math.random() < 0.3;

            if (sendMedia) {
                // Try to send media
                const mediaType = Math.random() < 0.7 ? 'image' : 'sticker';
                const media = await mediaService.getRandomMedia(mediaType);

                if (media) {
                    await whatsappManager.sendMedia(
                        accountId,
                        message.from,
                        media.path,
                        processedMessage,
                        mediaType === 'sticker'
                    );
                    await mediaService.incrementUsage(media.id);
                } else {
                    // Fallback to text if no media available
                    await whatsappManager.sendMessage(accountId, message.from, processedMessage);
                }
            } else {
                // Send text message
                await whatsappManager.sendMessage(accountId, message.from, processedMessage);
            }

            // Update reply history
            this.replyHistory.set(replyKey, now);

            // Clean old history entries (older than 5 minutes)
            for (const [key, timestamp] of this.replyHistory.entries()) {
                if (now - timestamp > 300000) {
                    this.replyHistory.delete(key);
                }
            }

            console.log(`Auto-replied to ${message.from} from account ${accountId}`);
        } catch (error) {
            console.error('Error handling incoming message:', error);
        }
    }
}

const autoReplyService = new AutoReplyService();
export default autoReplyService;
