import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';

const execAsync = promisify(exec);

console.log('╔════════════════════════════════════════════╗');
console.log('║   S7 VPN Connection Test                  ║');
console.log('╚════════════════════════════════════════════╝\n');

async function testVPNConnection() {
    try {
        // 1. Check OpenVPN service status
        console.log('📡 Step 1: Checking OpenVPN Service Status...');
        try {
            const { stdout: serviceStatus } = await execAsync('systemctl status openvpn-server@server --no-pager');
            const isActive = serviceStatus.includes('active (running)');
            console.log(`   ✅ OpenVPN Service: ${isActive ? 'RUNNING' : 'NOT RUNNING'}`);
            if (!isActive) {
                console.log('   ⚠️  Service is not running. Starting it...');
                await execAsync('sudo systemctl start openvpn-server@server');
                console.log('   ✅ Service started successfully');
            }
        } catch (error) {
            console.log('   ❌ Failed to check service status:', error.message);
        }

        console.log('\n📊 Step 2: Checking Connected Peers...');
        try {
            const { stdout: statusLog } = await execAsync('cat /var/log/openvpn/openvpn-status.log');
            console.log('   OpenVPN Status Log:');
            console.log('   ' + '─'.repeat(50));

            // Parse connected clients
            const lines = statusLog.split('\n');
            let inClientSection = false;
            let connectedClients = [];

            for (const line of lines) {
                if (line.includes('Common Name,Real Address')) {
                    inClientSection = true;
                    continue;
                }
                if (line.includes('ROUTING TABLE')) {
                    inClientSection = false;
                }
                if (inClientSection && line.trim() && !line.includes('Updated,')) {
                    const parts = line.split(',');
                    if (parts.length >= 4) {
                        connectedClients.push({
                            name: parts[0],
                            realAddress: parts[1],
                            virtualAddress: parts[2],
                            connectedSince: parts[3]
                        });
                    }
                }
            }

            if (connectedClients.length > 0) {
                console.log(`   ✅ Found ${connectedClients.length} connected client(s):\n`);
                connectedClients.forEach((client, idx) => {
                    console.log(`   Client ${idx + 1}:`);
                    console.log(`      Name: ${client.name}`);
                    console.log(`      Real IP: ${client.realAddress}`);
                    console.log(`      VPN IP: ${client.virtualAddress}`);
                    console.log(`      Connected Since: ${client.connectedSince}`);
                    console.log('');
                });

                // Check if S7 is connected
                const s7Client = connectedClients.find(c => c.name.toLowerCase().includes('s7'));
                if (s7Client) {
                    console.log(`   🎯 S7 DEVICE FOUND!`);
                    console.log(`      VPN IP: ${s7Client.virtualAddress}`);
                    return s7Client.virtualAddress;
                } else {
                    console.log('   ⚠️  S7 device not found in connected clients');
                    console.log('   📋 Available clients:', connectedClients.map(c => c.name).join(', '));
                }
            } else {
                console.log('   ⚠️  No clients currently connected to VPN');
            }
        } catch (error) {
            console.log('   ❌ Failed to read status log:', error.message);
        }

        console.log('\n🔍 Step 3: Checking VPN Network Interface...');
        try {
            const { stdout: ifconfig } = await execAsync('ip addr show tun0');
            console.log('   ✅ VPN Interface (tun0) is UP');
            const ipMatch = ifconfig.match(/inet (\d+\.\d+\.\d+\.\d+)/);
            if (ipMatch) {
                console.log(`   Server VPN IP: ${ipMatch[1]}`);
            }
        } catch (error) {
            console.log('   ❌ VPN Interface not found:', error.message);
        }

        console.log('\n🌐 Step 4: Testing Internet Connectivity from Server...');
        try {
            const response = await axios.get('https://ipapi.co/json/', { timeout: 10000 });
            console.log('   ✅ Server Internet Connection:');
            console.log(`      Public IP: ${response.data.ip}`);
            console.log(`      Location: ${response.data.city}, ${response.data.country_name}`);
            console.log(`      ISP: ${response.data.org}`);
        } catch (error) {
            console.log('   ❌ Failed to check internet:', error.message);
        }

        console.log('\n📝 Step 5: Checking Generated Client Configs...');
        try {
            const { stdout: configs } = await execAsync('ls -lh ~/openvpn-ca/client-configs/*.ovpn 2>/dev/null || echo "No configs found"');
            if (configs.includes('.ovpn')) {
                console.log('   ✅ Client configurations found:');
                console.log(configs.split('\n').filter(l => l.includes('.ovpn')).map(l => '      ' + l).join('\n'));
            } else {
                console.log('   ⚠️  No .ovpn files found in ~/openvpn-ca/client-configs/');
            }
        } catch (error) {
            console.log('   ℹ️  Could not list configs:', error.message);
        }

        console.log('\n' + '═'.repeat(50));
        console.log('📋 SUMMARY:');
        console.log('═'.repeat(50));
        console.log('To test the VPN connection from S7 device:');
        console.log('1. Ensure S7 device has OpenVPN Connect app installed');
        console.log('2. Import the s7.ovpn file into the app');
        console.log('3. Connect to the VPN');
        console.log('4. Check if device appears in the connected clients list above');
        console.log('5. Test by visiting https://ifconfig.me on S7 device');
        console.log('   - Should show the Oracle server IP instead of mobile IP');
        console.log('═'.repeat(50));

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testVPNConnection().then(() => {
    console.log('\n✅ VPN Connection Test Complete!\n');
}).catch(error => {
    console.error('\n❌ Test Error:', error);
    process.exit(1);
});
