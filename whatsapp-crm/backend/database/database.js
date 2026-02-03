import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// PostgreSQL Configuration
const pool = new Pool({
  user: 'kaio',
  host: '157.151.26.190',
  database: 'whatsapp_warming',
  password: 'Whatsapp_2024!',
  port: 5432,
  ssl: false,
  max: 20, // Limit pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Helper to convert SQLite '?' to Postgres '$1, $2...'
function convertSql(sql) {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
}

// Initialize database tables (PostgreSQL Dialect)
export function initDatabase() {
  return new Promise(async (resolve, reject) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Accounts table
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
        )
      `);

      // Add constraints separately if needed, but keeping simple for migration compatibility
      // Foreign keys usually require tables to exist, so order matters.
      // SQLite ignores FKs by default often, PG enforces them.
      // We'll skip complex FK setup in CREATE IF NOT EXISTS to avoid errors if table exists.

      // Messages table
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          category TEXT DEFAULT 'casual',
          active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Media table
      await client.query(`
        CREATE TABLE IF NOT EXISTS media (
          id SERIAL PRIMARY KEY,
          type TEXT NOT NULL,
          filename TEXT NOT NULL,
          path TEXT NOT NULL,
          usage_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Delay configuration table
      await client.query(`
        CREATE TABLE IF NOT EXISTS delay_config (
          id SERIAL PRIMARY KEY,
          type TEXT NOT NULL,
          min_seconds INTEGER,
          max_seconds INTEGER,
          fixed_seconds INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Auto-reply configuration table
      await client.query(`
        CREATE TABLE IF NOT EXISTS auto_reply_config (
          id SERIAL PRIMARY KEY,
          enabled_individual INTEGER DEFAULT 1,
          enabled_groups INTEGER DEFAULT 1,
          delay_before_reply INTEGER DEFAULT 5,
          ignore_list TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Proxies table
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
        )
      `);

      // Interactions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS interactions (
          id SERIAL PRIMARY KEY,
          from_account_id INTEGER,
          to_account_id INTEGER,
          to_contact TEXT,
          message_id INTEGER,
          media_id INTEGER,
          type TEXT,
          status TEXT DEFAULT 'pending',
          scheduled_at TIMESTAMP,
          sent_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migrations checking columns (Postgres style)
      // Check if proxy_id exists in accounts
      const checkProxy = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='accounts' AND column_name='proxy_id'");
      if (checkProxy.rowCount === 0) {
        await client.query("ALTER TABLE accounts ADD COLUMN proxy_id INTEGER");
      }

      const checkNetwork = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='accounts' AND column_name='network_mode'");
      if (checkNetwork.rowCount === 0) {
        await client.query("ALTER TABLE accounts ADD COLUMN network_mode TEXT DEFAULT 'local'");
      }

      const checkProtocol = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='proxies' AND column_name='protocol'");
      if (checkProtocol.rowCount === 0) {
        await client.query("ALTER TABLE proxies ADD COLUMN protocol TEXT DEFAULT 'http'");
      }

      await client.query('COMMIT');
      resolve();
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Database Initialization Error:', e);
      reject(e);
    } finally {
      client.release();
    }
  });
}

// Helper functions (Converted to PG)
export function runQuery(sql, params = []) {
  return new Promise(async (resolve, reject) => {
    const client = await pool.connect();
    try {
      let pgSql = convertSql(sql);

      // Auto-append RETURNING id for INSERTs to simulate SQLite behavior
      if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
        pgSql += ' RETURNING id';
      }

      const res = await client.query(pgSql, params);

      // Attempt to capture ID from returned row
      let lastId = 0;
      if (res.rows.length > 0 && res.rows[0].id) {
        lastId = res.rows[0].id;
      }

      resolve({ id: lastId, changes: res.rowCount });
    } catch (err) {
      console.error('Query Error:', err);
      reject(err);
    } finally {
      client.release();
    }
  });
}

export function getQuery(sql, params = []) {
  return new Promise(async (resolve, reject) => {
    const client = await pool.connect();
    try {
      const pgSql = convertSql(sql);
      const res = await client.query(pgSql, params);
      resolve(res.rows[0]);
    } catch (err) {
      console.error('GetQuery Error:', err);
      reject(err);
    } finally {
      client.release();
    }
  });
}

export function allQuery(sql, params = []) {
  return new Promise(async (resolve, reject) => {
    const client = await pool.connect();
    try {
      const pgSql = convertSql(sql);
      const res = await client.query(pgSql, params);
      resolve(res.rows);
    } catch (err) {
      console.error('AllQuery Error:', err);
      reject(err);
    } finally {
      client.release();
    }
  });
}

export default pool;
