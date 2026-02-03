import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'warming.db');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

console.log('--- LOCAL ACCOUNTS ---');
db.all('SELECT * FROM accounts', (err, rows) => {
    if (err) console.error(err);
    else console.log(rows);

    console.log('--- LOCAL PROXIES ---');
    db.all('SELECT * FROM proxies', (err, rows) => {
        if (err) console.error(err);
        else console.log(rows);
        db.close();
    });
});
