import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, '../../warming.db'));

// Initialize database tables
export function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Accounts table
      db.run(`
        CREATE TABLE IF NOT EXISTS accounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          status TEXT DEFAULT 'disconnected',
          session_data TEXT,
          proxy_id INTEGER,
          network_mode TEXT DEFAULT 'local',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (proxy_id) REFERENCES proxies(id)
        )
      `, (err) => {
        if (!err) {
          // Migration: Add proxy_id column if it doesn't exist
          db.run("ALTER TABLE accounts ADD COLUMN proxy_id INTEGER REFERENCES proxies(id)", (err) => {
            // Ignore error if column already exists
          });
          // Migration: Add network_mode column if it doesn't exist
          db.run("ALTER TABLE accounts ADD COLUMN network_mode TEXT DEFAULT 'local'", (err) => {
            // Ignore error if column already exists
          });
          // Migration: Add protocol column to proxies if it doesn't exist
          db.run("ALTER TABLE proxies ADD COLUMN protocol TEXT DEFAULT 'http'", (err) => {
            // Ignore error if column already exists
          });
        }
      });

      // Messages table
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          category TEXT DEFAULT 'casual',
          active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Media table
      db.run(`
        CREATE TABLE IF NOT EXISTS media (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          filename TEXT NOT NULL,
          path TEXT NOT NULL,
          usage_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Delay configuration table
      db.run(`
        CREATE TABLE IF NOT EXISTS delay_config (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          min_seconds INTEGER,
          max_seconds INTEGER,
          fixed_seconds INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Auto-reply configuration table
      db.run(`
        CREATE TABLE IF NOT EXISTS auto_reply_config (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          enabled_individual INTEGER DEFAULT 1,
          enabled_groups INTEGER DEFAULT 1,
          delay_before_reply INTEGER DEFAULT 5,
          ignore_list TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Proxies table (Renamed from proxy_config and added name)
      db.run(`
        CREATE TABLE IF NOT EXISTS proxies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          host TEXT,
          port INTEGER,
          protocol TEXT DEFAULT 'http',
          auth_enabled INTEGER DEFAULT 0,
          username TEXT,
          password TEXT,
          active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Interactions table
      db.run(`
        CREATE TABLE IF NOT EXISTS interactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          from_account_id INTEGER,
          to_account_id INTEGER,
          to_contact TEXT,
          message_id INTEGER,
          media_id INTEGER,
          type TEXT,
          status TEXT DEFAULT 'pending',
          scheduled_at DATETIME,
          sent_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (from_account_id) REFERENCES accounts(id),
          FOREIGN KEY (to_account_id) REFERENCES accounts(id),
          FOREIGN KEY (message_id) REFERENCES messages(id),
          FOREIGN KEY (media_id) REFERENCES media(id)
        )
      `);

      // Insert default delay config if not exists
      db.run(`
        INSERT OR IGNORE INTO delay_config (id, type, min_seconds, max_seconds)
        VALUES (1, 'random', 30, 120)
      `);

      // Insert default auto-reply config if not exists
      db.run(`
        INSERT OR IGNORE INTO auto_reply_config (id, enabled_individual, enabled_groups, delay_before_reply)
        VALUES (1, 1, 1, 5)
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

// Helper functions
export function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export default db;
