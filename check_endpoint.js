
import fetch from 'node-fetch';

async function check() {
    try {
        const res = await fetch('http://localhost:3000/api/accounts/15/qr');
        console.log('Status:', res.status);
        console.log('Type:', res.headers.get('content-type'));
        const text = await res.text();
        console.log('Body Preview:', text.substring(0, 100));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
