import db from './backend/database/database.js';

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Tables:', tables);
        }
    });

    db.all("SELECT * FROM proxies", (err, rows) => {
        if (err) {
            console.error('Error querying proxies:', err.message);
        } else {
            console.log('Proxies count:', rows.length);
        }
    });
});
