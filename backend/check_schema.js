import db from './database/database.js';

db.all('PRAGMA table_info(proxies)', (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(JSON.stringify(rows, null, 2));
});
