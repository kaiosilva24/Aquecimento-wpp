import { allQuery, runQuery } from '../database/database.js';
import whatsappManager from './whatsappManager.js';
import messageService from './messageService.js';
import mediaService from './mediaService.js';
import delayService from './delayService.js';

class InteractionService {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.interactionCount = 0;
    }

    // Start the warming interactions
    async start() {
        if (this.isRunning) {
            console.log('Interaction service already running');
            return;
        }

        this.isRunning = true;
        this.interactionCount = 0;
        console.log('Starting interaction service...');

        // Run interactions loop
        this.runInteractionLoop();
    }

    // Stop the warming interactions
    async stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        console.log('Interaction service stopped');
    }

    // Main interaction loop
    async runInteractionLoop() {
        while (this.isRunning) {
            try {
                await this.executeInteraction();

                // Calculate next delay
                const delay = await delayService.calculateDelay(this.interactionCount);
                console.log(`Next interaction in ${Math.floor(delay / 1000)} seconds`);

                // Wait for next interaction
                await new Promise(resolve => {
                    this.intervalId = setTimeout(resolve, delay);
                });

                this.interactionCount++;
            } catch (error) {
                console.error('Error in interaction loop:', error);
                // Wait 30 seconds before retrying on error
                await delayService.sleep(30000);
            }
        }
    }

    // Helper to simulate typing
    async simulateTyping(senderId, receiverPhone, messageContent) {
        // Calculate typing duration: ~50ms - 100ms per character + random base
        const charCount = messageContent.length;
        const typingSpeed = Math.floor(Math.random() * 50) + 50; // 50-100ms per char
        const baseVariance = Math.floor(Math.random() * 1000); // 0-1s variance
        const typingDuration = (charCount * typingSpeed) + baseVariance;

        // Cap duration at 15 seconds to avoid looking "stuck"
        const finalDuration = Math.min(Math.max(1000, typingDuration), 15000);

        console.log(`[HUMAN] Account ${senderId} typing for ${Math.floor(finalDuration / 1000)}s...`);

        // Send "composing" presence
        await whatsappManager.sendPresenceUpdate(senderId, receiverPhone, 'composing');

        // Wait
        await delayService.sleep(finalDuration);

        // Send "paused" (optional, but good practice before sending)
        await whatsappManager.sendPresenceUpdate(senderId, receiverPhone, 'paused');

        return finalDuration;
    }

    // Execute a single interaction
    async executeInteraction() {
        try {
            // Get all connected accounts
            const connectedAccounts = whatsappManager.getConnectedClients();

            if (connectedAccounts.length < 2) {
                console.log('Need at least 2 connected accounts for interactions');
                return;
            }

            // Select random sender and receiver
            const senderAccountId = connectedAccounts[Math.floor(Math.random() * connectedAccounts.length)];
            let receiverAccountId;

            do {
                receiverAccountId = connectedAccounts[Math.floor(Math.random() * connectedAccounts.length)];
            } while (receiverAccountId === senderAccountId);

            // Get receiver's phone number
            const receiverClient = whatsappManager.getClient(receiverAccountId);
            if (!receiverClient || !receiverClient.info) {
                console.log('Receiver client not ready');
                return;
            }

            const receiverPhone = receiverClient.info.wid.user;

            // Get random message
            const randomMessage = await messageService.getRandomMessage();
            if (!randomMessage) {
                console.log('No messages available');
                return;
            }

            // Process message (Spintax + Variables)
            const processedMessage = messageService.processMessage(randomMessage.content);

            // Decide whether to send media (30% chance)
            const sendMedia = Math.random() < 0.3;

            let interactionType = 'text';
            let mediaId = null;

            if (sendMedia) {
                const mediaType = Math.random() < 0.7 ? 'image' : 'sticker';
                const media = await mediaService.getRandomMedia(mediaType);

                if (media) {
                    // Simulate typing/recording before sending media
                    await this.simulateTyping(senderAccountId, receiverPhone, "media_placeholder");

                    await whatsappManager.sendMedia(
                        senderAccountId,
                        receiverPhone,
                        media.path,
                        processedMessage,
                        mediaType === 'sticker'
                    );
                    await mediaService.incrementUsage(media.id);
                    interactionType = mediaType;
                    mediaId = media.id;
                } else {
                    // Fallback to text if no media
                    await this.simulateTyping(senderAccountId, receiverPhone, processedMessage);
                    await whatsappManager.sendMessage(senderAccountId, receiverPhone, processedMessage);
                }
            } else {
                // Determine message type (Text or Audio if supported later, for now just text)
                await this.simulateTyping(senderAccountId, receiverPhone, processedMessage);
                await whatsappManager.sendMessage(senderAccountId, receiverPhone, processedMessage);
            }

            // Log interaction
            await runQuery(
                `INSERT INTO interactions 
         (from_account_id, to_account_id, to_contact, message_id, media_id, type, status, sent_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [senderAccountId, receiverAccountId, receiverPhone, randomMessage.id, mediaId, interactionType, 'sent']
            );

            console.log(`Interaction: Account ${senderAccountId} -> Account ${receiverAccountId} (${interactionType})`);
        } catch (error) {
            console.error('Error executing interaction:', error);
            throw error;
        }
    }

    // Get interaction statistics
    async getStats() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const stats = await allQuery(`
        SELECT 
          COUNT(*) as total_interactions,
          COUNT(CASE WHEN sent_at >= ? THEN 1 END) as today_interactions,
          COUNT(CASE WHEN type = 'text' THEN 1 END) as text_count,
          COUNT(CASE WHEN type = 'image' THEN 1 END) as image_count,
          COUNT(CASE WHEN type = 'sticker' THEN 1 END) as sticker_count
        FROM interactions
      `, [today.toISOString()]);

            return {
                ...stats[0],
                is_running: this.isRunning,
                current_count: this.interactionCount
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }

    // Get recent interactions
    async getRecentInteractions(limit = 50) {
        try {
            return await allQuery(`
        SELECT 
          i.*,
          a1.name as from_account_name,
          a2.name as to_account_name,
          m.content as message_content
        FROM interactions i
        LEFT JOIN accounts a1 ON i.from_account_id = a1.id
        LEFT JOIN accounts a2 ON i.to_account_id = a2.id
        LEFT JOIN messages m ON i.message_id = m.id
        ORDER BY i.sent_at DESC
        LIMIT ?
      `, [limit]);
        } catch (error) {
            console.error('Error getting recent interactions:', error);
            throw error;
        }
    }

    // Check if service is running
    isServiceRunning() {
        return this.isRunning;
    }
}

const interactionService = new InteractionService();
export default interactionService;
