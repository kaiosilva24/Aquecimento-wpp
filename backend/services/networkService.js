import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import fetch from 'node-fetch';

export async function checkConnection(proxyConfig = null) {
    let agent = null;
    let proxyUrl = null;

    if (proxyConfig) {
        const { host, port, protocol, auth_enabled, username, password } = proxyConfig;

        // Construct proxy URL
        if (auth_enabled && username && password) {
            proxyUrl = `${protocol}://${username}:${password}@${host}:${port}`;
        } else {
            proxyUrl = `${protocol}://${host}:${port}`;
        }

        // Create appropriate agent
        if (protocol === 'socks4' || protocol === 'socks5') {
            agent = new SocksProxyAgent(proxyUrl);
        } else {
            agent = new HttpsProxyAgent(proxyUrl);
        }
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

        // usage of ip-api.com/json which returns IP, ISP, Country, etc.
        // Note: ip-api.com is free for non-commercial use, limit 45 requests/minute
        const response = await fetch('http://ip-api.com/json', {
            agent: agent,
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Network Service] Error ${response.status} from ${response.url} using proxy ${proxyUrl || 'DIRECT'}. Body:`, errorText);
            throw new Error(`External service returned ${response.status}. Details: ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();

        if (data.status === 'fail') {
            throw new Error(`IP Lookup failed: ${data.message}`);
        }

        return {
            success: true,
            ip: data.query,
            isp: data.isp,
            country: data.country,
            region: data.regionName,
            proxy_used: !!proxyConfig,
            proxy_url: proxyUrl ? proxyUrl.replace(/:[^:]*@/, ':***@') : null
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
