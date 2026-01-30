import Database from 'better-sqlite3';

const db = new Database('warming.db');

console.log('=== Account 11 ===');
const account = db.prepare('SELECT * FROM accounts WHERE id = 11').get();
console.log(account);

console.log('\n=== All Proxies ===');
const proxies = db.prepare('SELECT * FROM proxies').all();
proxies.forEach(p => console.log(p));

if (account && account.proxy_id) {
    console.log(`\n=== Proxy assigned to Account 11 (ID: ${account.proxy_id}) ===`);
    const proxy = db.prepare('SELECT * FROM proxies WHERE id = ?').get(account.proxy_id);
    console.log(proxy);
}

db.close();
