import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import EventEmitter from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { runQuery, getQuery, allQuery } from '../database/database.js';
import proxyService from './proxyService.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import qrcode from 'qrcode';

// Logger config
const logger = pino({ level: 'silent' }); // 'debug' for verbose

class WhatsAppManager extends EventEmitter {
    constructor() {
        super();
        this.clients = new Map(); // accountId -> socket instance
        this.qrCodes = new Map(); // accountId -> qr string
        console.log(`[DEBUG] WhatsAppManager initialized. __dirname: ${__dirname}`);
    }

    async createClient(accountId, accountName) {
        try {
            console.log(`Creating Baileys client for account ${accountId} (${accountName})`);

            // Auth state folder - use __dirname for absolute path
            const authPath = path.join(__dirname, '..', '.baileys_auth', `session-${accountId}`);
            console.log(`[DEBUG] Auth path: ${authPath}`);
            if (!fs.existsSync(authPath)) {
                fs.mkdirSync(authPath, { recursive: true });
            }

            const { state, saveCreds } = await useMultiFileAuthState(authPath);
            const { version } = await fetchLatestBaileysVersion();

            // Proxy Configuration
            let agent = undefined;
            const account = await getQuery('SELECT proxy_id, network_mode FROM accounts WHERE id = ?', [accountId]);

            console.log(`[DEBUG] Account ${accountId} - Network Mode: ${account?.network_mode}, ProxyID: ${account?.proxy_id}`);

            // Only apply proxy if network_mode is 'proxy'
            if (account && account.network_mode === 'proxy' && account.proxy_id) {
                const proxyConfig = await proxyService.getById(account.proxy_id);
                console.log(`[DEBUG] Proxy config found:`, proxyConfig);

                if (proxyConfig && proxyConfig.active && proxyConfig.host) {
                    const protocol = proxyConfig.protocol || 'http';
                    const auth = (proxyConfig.auth_enabled && proxyConfig.username && proxyConfig.password)
                        ? `${proxyConfig.username}:${proxyConfig.password}@`
                        : '';
                    const proxyUrl = `${protocol}://${auth}${proxyConfig.host}:${proxyConfig.port}`;

                    console.log(`[DEBUG] Constructing proxy URL: ${proxyUrl}`);

                    // Only use HTTP/HTTPS proxy (SOCKS5 causes issues with Baileys)
                    if (protocol === 'http' || protocol === 'https') {
                        // Create agent with explicit options matching the successful diagnostic test
                        agent = new HttpsProxyAgent(proxyUrl, {
                            keepAlive: true,
                            timeout: 60000,
                            scheduling: 'lifo'
                        });
                        console.log(`✓ Using PROXY network: ${proxyUrl}`);
                    } else {
                        console.warn(`Proxy protocol ${protocol} not supported by Baileys, skipping proxy`);
                    }
                } else {
                    console.log(`[DEBUG] Proxy skipped. Active: ${proxyConfig?.active}, Host: ${proxyConfig?.host}`);
                }
            } else if (account && account.network_mode === 'local') {
                console.log(`✓ Using LOCAL network (server direct connection)`);
            } else {
                console.log(`[DEBUG] Network mode: ${account?.network_mode || 'undefined'}, No proxy configured`);
            }

            console.log(`Initializing Baileys with proxy agent: ${!!agent}`);

            const sock = makeWASocket({
                version,
                logger: pino({ level: 'debug' }),
                printQRInTerminal: true,
                auth: state, // Revert to simple auth state
                browser: ['WhatsApp Warming', 'Chrome', '1.0.0'],
                agent,
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: true,
                retryRequestDelayMs: 250
            });

            // Handle connection updates
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                // DEBUG: Log all connection updates
                console.log(`[DEBUG] Account ${accountId} connection update:`, {
                    connection,
                    hasQR: !!qr,
                    hasLastDisconnect: !!lastDisconnect,
                    updateKeys: Object.keys(update)
                });

                if (qr) {
                    console.log(`QR Code received for account ${accountId}`);
                    const qrDataUrl = await qrcode.toDataURL(qr);
                    this.qrCodes.set(accountId, qrDataUrl);
                    console.log(`[DEBUG] QR Code stored for account ${accountId}. Map size: ${this.qrCodes.size}, Has key: ${this.qrCodes.has(accountId)}`);
                    this.emit('qr', { accountId, qrDataUrl });
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log(`Account ${accountId} connection closed due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);

                    if (shouldReconnect) {
                        this.createClient(accountId, accountName);
                    } else {
                        console.log(`Account ${accountId} logged out.`);
                        await runQuery('UPDATE accounts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['disconnected', accountId]);
                        this.clients.delete(accountId);
                        this.emit('disconnected', { accountId, reason: 'Logged out' });
                        // Clean up auth folder required? Maybe not to keep history if re-login
                    }
                } else if (connection === 'open') {
                    console.log(`Account ${accountId} connected successfully`);
                    const userJid = sock.user.id.split(':')[0]; // format: 12345:5@s.whatsapp.net

                    await runQuery(
                        'UPDATE accounts SET status = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        ['connected', userJid, accountId]
                    );

                    this.qrCodes.delete(accountId);
                    this.clients.set(accountId, sock);
                    this.emit('ready', { accountId, phone: userJid });
                    this.emit('authenticated', { accountId });
                }
            });

            // Credential updates
            sock.ev.on('creds.update', saveCreds);

            // Message handling
            sock.ev.on('messages.upsert', async (m) => {
                if (m.type === 'notify') {
                    for (const msg of m.messages) {
                        if (!msg.key.fromMe && msg.message) {
                            // Normalize message to match partially what the app expects
                            const remoteJid = msg.key.remoteJid;
                            const textBody = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
                            const hasMedia = !!(msg.message.imageMessage || msg.message.videoMessage || msg.message.stickerMessage || msg.message.audioMessage);

                            const normalizedMessage = {
                                from: remoteJid,
                                body: textBody,
                                hasMedia: hasMedia,
                                type: hasMedia ? 'media' : 'chat', // Simplified
                                timestamp: msg.messageTimestamp,
                                _data: msg // Keep original just in case
                            };

                            this.emit('message', { accountId, message: normalizedMessage });
                        }
                    }
                }
            });

            this.clients.set(accountId, sock);
            return sock;

        } catch (error) {
            console.error(`Error creating client for account ${accountId}:`, error);
            throw error;
        }
    }

    getClient(accountId) {
        return this.clients.get(accountId);
    }

    getQRCode(accountId) {
        const qr = this.qrCodes.get(accountId);
        console.log(`[DEBUG] getQRCode called for account ${accountId}. Map size: ${this.qrCodes.size}, Has key: ${this.qrCodes.has(accountId)}, QR exists: ${!!qr}`);
        return qr;
    }

    // Baileys disconnect implies ending the socket
    async disconnectClient(accountId) {
        const sock = this.clients.get(accountId);
        if (sock) {
            sock.end(undefined);
            this.clients.delete(accountId);
            await runQuery(
                'UPDATE accounts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                ['disconnected', accountId]
            );
        }
    }

    isConnected(accountId) {
        return this.clients.has(accountId);
    }

    async sendMessage(accountId, to, message) {
        const sock = this.getClient(accountId);
        if (!sock) throw new Error(`Client not found for account ${accountId}`);

        try {
            const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
            await sock.sendMessage(jid, { text: message });
            return true;
        } catch (error) {
            console.error(`Error sending message from account ${accountId}:`, error);
            throw error;
        }
    }

    // Send media
    async sendMedia(accountId, to, mediaPath, caption = '', isSticker = false) {
        const sock = this.getClient(accountId);
        if (!sock) throw new Error(`Client not found for account ${accountId}`);

        try {
            const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
            const buffer = fs.readFileSync(mediaPath);

            if (isSticker) {
                await sock.sendMessage(jid, { sticker: buffer });
            } else {
                // Detect type roughly by extension or assume image for simplicity in this context
                // Ideally use 'file-type' package
                await sock.sendMessage(jid, { image: buffer, caption: caption });
            }
            return true;
        } catch (error) {
            console.error(`Error sending media from account ${accountId}:`, error);
            throw error;
        }
    }

    async restoreSessions() {
        try {
            const accounts = await allQuery('SELECT * FROM accounts WHERE status = ?', ['connected']);
            for (const account of accounts) {
                // Check if auth file exists
                const authPath = path.join(__dirname, '..', '.baileys_auth', `session-${account.id}`);
                if (fs.existsSync(authPath)) {
                    await this.createClient(account.id, account.name);
                } else {
                    console.log(`No session file found for account ${account.id}, skipping auto-restore.`);
                    // Update DB to disconnected? Maybe.
                    await runQuery('UPDATE accounts SET status = ? WHERE id = ?', ['disconnected', account.id]);
                }
            }
        } catch (error) {
            console.error('Error restoring sessions:', error);
        }
    }
}

const whatsappManager = new WhatsAppManager();
export default whatsappManager;
