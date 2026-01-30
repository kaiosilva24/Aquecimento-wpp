import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { runQuery, allQuery } from '../database/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.body.type || 'image';
        const uploadPath = path.join(__dirname, '../../uploads', type === 'sticker' ? 'stickers' : 'images');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Get all media
router.get('/', async (req, res) => {
    try {
        const media = await allQuery('SELECT * FROM media ORDER BY created_at DESC');
        res.json(media);
    } catch (error) {
        console.error('Error getting media:', error);
        res.status(500).json({ error: 'Failed to get media' });
    }
});

// Upload media
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const type = req.body.type || 'image';
        const filename = req.file.filename;
        const filePath = req.file.path;

        const result = await runQuery(
            'INSERT INTO media (type, filename, path) VALUES (?, ?, ?)',
            [type, filename, filePath]
        );

        res.json({
            id: result.id,
            type,
            filename,
            path: filePath,
            message: 'Media uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading media:', error);
        res.status(500).json({ error: 'Failed to upload media' });
    }
});

// Delete media
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // TODO: Also delete the physical file
        await runQuery('DELETE FROM media WHERE id = ?', [id]);

        res.json({ message: 'Media deleted successfully' });
    } catch (error) {
        console.error('Error deleting media:', error);
        res.status(500).json({ error: 'Failed to delete media' });
    }
});

export default router;
