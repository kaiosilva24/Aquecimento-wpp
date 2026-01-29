#!/bin/bash

echo "🚀 Deploying VPN Test to Oracle Server..."

SERVER="ubuntu@152.67.35.127"

# Upload test script
echo "📤 Uploading test script..."
scp test_vpn.sh $SERVER:~/

# Make it executable and run
echo "🔧 Running VPN connection test..."
ssh $SERVER "chmod +x ~/test_vpn.sh && sudo ~/test_vpn.sh"

echo ""
echo "✅ Test complete!"
