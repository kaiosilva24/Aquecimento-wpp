import { allQuery, getQuery, runQuery } from '../database/database.js';

class MediaService {
    // Get random media by type
    async getRandomMedia(type = 'image') {
        try {
            const mediaList = await allQuery(
                'SELECT * FROM media WHERE type = ?',
                [type]
            );

            if (mediaList.length === 0) {
                return null;
            }

            const randomIndex = Math.floor(Math.random() * mediaList.length);
            return mediaList[randomIndex];
        } catch (error) {
            console.error('Error getting random media:', error);
            throw error;
        }
    }

    // Get all media
    async getAllMedia() {
        try {
            return await allQuery('SELECT * FROM media ORDER BY created_at DESC');
        } catch (error) {
            console.error('Error getting all media:', error);
            throw error;
        }
    }

    // Get media by ID
    async getMediaById(id) {
        try {
            return await getQuery('SELECT * FROM media WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error getting media by ID:', error);
            throw error;
        }
    }

    // Increment usage count
    async incrementUsage(id) {
        try {
            await runQuery(
                'UPDATE media SET usage_count = usage_count + 1 WHERE id = ?',
                [id]
            );
        } catch (error) {
            console.error('Error incrementing media usage:', error);
            throw error;
        }
    }

    // Delete media
    async deleteMedia(id) {
        try {
            await runQuery('DELETE FROM media WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error deleting media:', error);
            throw error;
        }
    }
}

const mediaService = new MediaService();
export default mediaService;
