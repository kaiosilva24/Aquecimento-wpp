import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Polyfill for global.crypto in Node.js < 19
if (!global.crypto) {
    global.crypto = crypto;
}

import { initDatabase } from './database/database.js';
import whatsappManager from './services/whatsappManager.js';
import autoReplyService from './services/autoReplyService.js';

// Import routes
import accountRoutes from './routes/accountRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import configRoutes from './routes/configRoutes.js';
import interactionRoutes from './routes/interactionRoutes.js';
import proxyRoutes from './routes/proxyRoutes.js';
import vpnRoutes from './routes/vpnRoutes.js';
import openvpnRoutes from './routes/openvpnRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JSON Error Handler (prevent crash on invalid JSON)
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON:', err.message);
        return res.status(400).json({ status: 'error', message: 'Invalid JSON payload' });
    }
    next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/config', configRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/proxies', proxyRoutes);
app.use('/api/vpn', vpnRoutes);
app.use('/api/openvpn', openvpnRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'WhatsApp Warming System is running' });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
}

// Initialize and start server
async function startServer() {
    try {
        console.log('Initializing database...');
        await initDatabase();
        console.log('Database initialized successfully');

        console.log('Restoring WhatsApp sessions...');
        await whatsappManager.restoreSessions();
        console.log('WhatsApp sessions restored');

        // Initialize auto-reply service (it will set up listeners)
        console.log('Auto-reply service initialized');

        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on http://localhost:${PORT}`);
            console.log(`📱 WhatsApp Warming System ready!`);
            console.log(`\nAPI Endpoints:`);
            console.log(`  - Accounts: http://localhost:${PORT}/api/accounts`);
            console.log(`  - Messages: http://localhost:${PORT}/api/messages`);
            console.log(`  - Media: http://localhost:${PORT}/api/media`);
            console.log(`  - Config: http://localhost:${PORT}/api/config`);
            console.log(`  - Interactions: http://localhost:${PORT}/api/interactions`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

startServer();
