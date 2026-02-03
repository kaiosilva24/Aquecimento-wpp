import sqlite3 from 'sqlite3';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SQLITE_DB_PATH = join(__dirname, '../../warming.db');
const PG_CONFIG = {
    user: 'kaio',
    host: '157.151.26.190',
    database: 'whatsapp_warming',
    password: 'Whatsapp_2024!',
    port: 5432,
    ssl: false // Oracle internal network or explicit IP usually doesn't strictly require SSL if not set up
};

console.log('🚀 Starting Migration: SQLite -> PostgreSQL');

// Connect to SQLite
const sqlite = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('❌ Error connecting to SQLite:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite');
});

// Connect to PostgreSQL
const pool = new Pool(PG_CONFIG);

async function createTables() {
    const client = await pool.connect();
    try {
        console.log('📦 Creating Tables in PostgreSQL...');

        await client.query('BEGIN');

        // Accounts
        await client.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                status TEXT DEFAULT 'disconnected',
                session_data TEXT,
                proxy_id INTEGER,
                network_mode TEXT DEFAULT 'local',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Proxies
        await client.query(`
            CREATE TABLE IF NOT EXISTS proxies (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                host TEXT,
                port INTEGER,
                protocol TEXT DEFAULT 'http',
                auth_enabled INTEGER DEFAULT 0,
                username TEXT,
                password TEXT,
                active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Messages
        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                category TEXT DEFAULT 'casual',
                active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Media
        await client.query(`
            CREATE TABLE IF NOT EXISTS media (
                id SERIAL PRIMARY KEY,
                type TEXT NOT NULL,
                filename TEXT NOT NULL,
                path TEXT NOT NULL,
                usage_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Delay Config
        await client.query(`
            CREATE TABLE IF NOT EXISTS delay_config (
                id SERIAL PRIMARY KEY,
                type TEXT NOT NULL,
                min_seconds INTEGER,
                max_seconds INTEGER,
                fixed_seconds INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Auto Reply Config
        await client.query(`
            CREATE TABLE IF NOT EXISTS auto_reply_config (
                id SERIAL PRIMARY KEY,
                enabled_individual INTEGER DEFAULT 1,
                enabled_groups INTEGER DEFAULT 1,
                delay_before_reply INTEGER DEFAULT 5,
                ignore_list TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Interactions
        await client.query(`
            CREATE TABLE IF NOT EXISTS interactions (
                id SERIAL PRIMARY KEY,
                from_account_id INTEGER REFERENCES accounts(id),
                to_account_id INTEGER REFERENCES accounts(id),
                to_contact TEXT,
                message_id INTEGER REFERENCES messages(id),
                media_id INTEGER REFERENCES media(id),
                type TEXT,
                status TEXT DEFAULT 'pending',
                scheduled_at TIMESTAMP,
                sent_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query('COMMIT');
        console.log('✅ Tables Created');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating tables:', e);
        throw e;
    } finally {
        client.release();
    }
}

function getSQLiteData(table) {
    return new Promise((resolve, reject) => {
        sqlite.all(`SELECT * FROM ${table}`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function migrateData() {
    const client = await pool.connect();
    try {
        const tables = ['proxies', 'accounts', 'messages', 'media', 'delay_config', 'auto_reply_config', 'interactions'];

        for (const table of tables) {
            console.log(`🔄 Migrating ${table}...`);
            const rows = await getSQLiteData(table);

            if (rows.length === 0) {
                console.log(`   Internal: No data in ${table}`);
                continue;
            }

            for (const row of rows) {
                const keys = Object.keys(row);
                const values = Object.values(row);
                const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                const columns = keys.map(k => `"${k}"`).join(', '); // Quote identifiers

                const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
                await client.query(query, values);
            }
            // Sync sequence
            await client.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(MAX(id), 1)) FROM ${table}`);
            console.log(`   ✅ Synced ${rows.length} rows for ${table}`);
        }

    } catch (e) {
        console.error('❌ Migration Error:', e);
    } finally {
        client.release();
    }
}

async function run() {
    try {
        await createTables();
        await migrateData();
        console.log('🎉 Migration Complete!');
    } catch (e) {
        console.error('Fatal Error:', e);
    } finally {
        await pool.end();
        sqlite.close();
    }
}

run();
