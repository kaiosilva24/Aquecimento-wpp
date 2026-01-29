
import fetch from 'node-fetch';

async function check(url) {
    console.log(`Checking ${url}...`);
    try {
        const res = await fetch(url);
        console.log('Status:', res.status);
        console.log('Type:', res.headers.get('content-type'));
        const text = await res.text();
        console.log('Body Preview:', text.substring(0, 100));
    } catch (e) {
        console.error(e);
    }
    console.log('---');
}

async function run() {
    await check('http://localhost:5173/api/accounts/15/qr');
    await check('http://localhost:5173/api/accounts/15/network');
}

run();
