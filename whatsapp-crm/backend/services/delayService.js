import { getQuery, runQuery } from '../database/database.js';

class DelayService {
    // Delay types
    static TYPES = {
        FIXED: 'fixed',
        RANDOM: 'random',
        HUMAN: 'human',
        PROGRESSIVE: 'progressive'
    };

    // Get current delay configuration
    async getConfig() {
        try {
            const config = await getQuery('SELECT * FROM delay_config WHERE id = 1');
            return config || { type: 'random', min_seconds: 30, max_seconds: 120 };
        } catch (error) {
            console.error('Error getting delay config:', error);
            throw error;
        }
    }

    // Update delay configuration
    async updateConfig(type, options = {}) {
        try {
            const { min_seconds, max_seconds, fixed_seconds } = options;

            await runQuery(
                `UPDATE delay_config 
         SET type = ?, min_seconds = ?, max_seconds = ?, fixed_seconds = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = 1`,
                [type, min_seconds || null, max_seconds || null, fixed_seconds || null]
            );

            return await this.getConfig();
        } catch (error) {
            console.error('Error updating delay config:', error);
            throw error;
        }
    }

    // Calculate next delay in milliseconds
    async calculateDelay(interactionCount = 0) {
        try {
            const config = await this.getConfig();
            let delaySeconds = 0;

            switch (config.type) {
                case DelayService.TYPES.FIXED:
                    delaySeconds = config.fixed_seconds || 60;
                    break;

                case DelayService.TYPES.RANDOM:
                    const min = config.min_seconds || 30;
                    const max = config.max_seconds || 120;
                    delaySeconds = Math.floor(Math.random() * (max - min + 1)) + min;
                    break;

                case DelayService.TYPES.HUMAN:
                    // Simulates human behavior with natural variations
                    const baseDelay = 60; // 1 minute base
                    const variation = Math.random() * 60; // 0-60 seconds variation
                    const pauseProbability = Math.random();

                    // 20% chance of longer pause (simulating distraction)
                    if (pauseProbability < 0.2) {
                        delaySeconds = baseDelay + variation + (Math.random() * 180); // +0-3 minutes
                    } else {
                        delaySeconds = baseDelay + variation;
                    }
                    break;

                case DelayService.TYPES.PROGRESSIVE:
                    // Increases delay over time to simulate natural conversation slowdown
                    const minProgressive = config.min_seconds || 30;
                    const maxProgressive = config.max_seconds || 300;
                    const increment = (maxProgressive - minProgressive) / 20; // Increase over 20 interactions

                    delaySeconds = Math.min(
                        minProgressive + (increment * interactionCount),
                        maxProgressive
                    );

                    // Add some randomness
                    delaySeconds += Math.random() * 30 - 15; // ±15 seconds
                    break;

                default:
                    delaySeconds = 60;
            }

            // Ensure minimum delay of 10 seconds
            delaySeconds = Math.max(10, delaySeconds);

            return Math.floor(delaySeconds * 1000); // Convert to milliseconds
        } catch (error) {
            console.error('Error calculating delay:', error);
            return 60000; // Default 1 minute
        }
    }

    // Get human-readable delay description
    async getDelayDescription() {
        try {
            const config = await this.getConfig();

            switch (config.type) {
                case DelayService.TYPES.FIXED:
                    return `Fixo: ${config.fixed_seconds}s`;

                case DelayService.TYPES.RANDOM:
                    return `Aleatório: ${config.min_seconds}s - ${config.max_seconds}s`;

                case DelayService.TYPES.HUMAN:
                    return 'Humano: Variações naturais com pausas ocasionais';

                case DelayService.TYPES.PROGRESSIVE:
                    return `Progressivo: ${config.min_seconds}s - ${config.max_seconds}s (aumenta gradualmente)`;

                default:
                    return 'Não configurado';
            }
        } catch (error) {
            console.error('Error getting delay description:', error);
            return 'Erro ao obter configuração';
        }
    }

    // Sleep utility
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const delayService = new DelayService();
export default delayService;
