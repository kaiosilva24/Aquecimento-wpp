#!/bin/bash

echo "╔════════════════════════════════════════════╗"
echo "║   S7 VPN Connection Test (Shell Version)  ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📡 Step 1: Checking OpenVPN Service Status...${NC}"
if systemctl is-active --quiet openvpn-server@server; then
    echo -e "   ${GREEN}✅ OpenVPN Service: RUNNING${NC}"
else
    echo -e "   ${RED}❌ OpenVPN Service: NOT RUNNING${NC}"
    echo -e "   ${YELLOW}⚠️  Attempting to start service...${NC}"
    sudo systemctl start openvpn-server@server
    sleep 2
    if systemctl is-active --quiet openvpn-server@server; then
        echo -e "   ${GREEN}✅ Service started successfully${NC}"
    else
        echo -e "   ${RED}❌ Failed to start service${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📊 Step 2: Checking Connected Peers...${NC}"
if [ -f /var/log/openvpn/openvpn-status.log ]; then
    echo "   OpenVPN Status Log:"
    echo "   ──────────────────────────────────────────────────"
    
    # Extract connected clients
    CLIENTS=$(awk '/Common Name,Real Address/,/ROUTING TABLE/' /var/log/openvpn/openvpn-status.log | grep -v "Common Name" | grep -v "ROUTING TABLE" | grep -v "Updated," | grep -v "^$")
    
    if [ -n "$CLIENTS" ]; then
        CLIENT_COUNT=$(echo "$CLIENTS" | wc -l)
        echo -e "   ${GREEN}✅ Found $CLIENT_COUNT connected client(s):${NC}"
        echo ""
        
        echo "$CLIENTS" | while IFS=',' read -r name real_addr vpn_ip connected_since bytes_recv bytes_sent; do
            echo "   Client:"
            echo "      Name: $name"
            echo "      Real IP: $real_addr"
            echo "      VPN IP: $vpn_ip"
            echo "      Connected Since: $connected_since"
            echo ""
            
            # Check if this is S7
            if echo "$name" | grep -qi "s7"; then
                echo -e "   ${GREEN}🎯 S7 DEVICE FOUND!${NC}"
                echo "      VPN IP: $vpn_ip"
                S7_VPN_IP="$vpn_ip"
            fi
        done
        
        if [ -z "$S7_VPN_IP" ]; then
            echo -e "   ${YELLOW}⚠️  S7 device not found in connected clients${NC}"
        fi
    else
        echo -e "   ${YELLOW}⚠️  No clients currently connected to VPN${NC}"
    fi
else
    echo -e "   ${RED}❌ Status log not found at /var/log/openvpn/openvpn-status.log${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Step 3: Checking VPN Network Interface...${NC}"
if ip addr show tun0 &>/dev/null; then
    echo -e "   ${GREEN}✅ VPN Interface (tun0) is UP${NC}"
    SERVER_VPN_IP=$(ip addr show tun0 | grep "inet " | awk '{print $2}' | cut -d'/' -f1)
    echo "      Server VPN IP: $SERVER_VPN_IP"
else
    echo -e "   ${RED}❌ VPN Interface (tun0) not found${NC}"
fi

echo ""
echo -e "${BLUE}🌐 Step 4: Testing Server Internet Connectivity...${NC}"
PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me)
if [ -n "$PUBLIC_IP" ]; then
    echo -e "   ${GREEN}✅ Server Public IP: $PUBLIC_IP${NC}"
    
    # Get location info
    LOCATION=$(curl -s --max-time 5 "https://ipapi.co/$PUBLIC_IP/json/" | grep -E '"city"|"country_name"|"org"' | head -3)
    if [ -n "$LOCATION" ]; then
        echo "   Location Info:"
        echo "$LOCATION" | sed 's/^/      /'
    fi
else
    echo -e "   ${RED}❌ Failed to get public IP${NC}"
fi

echo ""
echo -e "${BLUE}🔥 Step 5: Checking Firewall Rules...${NC}"
if sudo iptables -t nat -L POSTROUTING -n | grep -q "10.8.0.0/24"; then
    echo -e "   ${GREEN}✅ NAT rule for VPN traffic is configured${NC}"
else
    echo -e "   ${YELLOW}⚠️  NAT rule not found${NC}"
fi

if sudo iptables -L INPUT -n | grep -q "udp dpt:1194"; then
    echo -e "   ${GREEN}✅ Firewall allows OpenVPN port 1194${NC}"
else
    echo -e "   ${YELLOW}⚠️  OpenVPN port rule not found${NC}"
fi

echo ""
echo -e "${BLUE}📝 Step 6: Checking Client Configurations...${NC}"
if [ -d ~/openvpn-ca/client-configs ]; then
    OVPN_FILES=$(ls ~/openvpn-ca/client-configs/*.ovpn 2>/dev/null)
    if [ -n "$OVPN_FILES" ]; then
        echo -e "   ${GREEN}✅ Client configurations found:${NC}"
        ls -lh ~/openvpn-ca/client-configs/*.ovpn | awk '{print "      " $9 " (" $5 ")"}'
    else
        echo -e "   ${YELLOW}⚠️  No .ovpn files found${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Client configs directory not found${NC}"
fi

echo ""
echo "══════════════════════════════════════════════════"
echo -e "${BLUE}📋 SUMMARY & NEXT STEPS:${NC}"
echo "══════════════════════════════════════════════════"
echo ""
echo "To verify S7 VPN connection:"
echo "1. ✅ Ensure s7.ovpn file is imported in OpenVPN Connect app"
echo "2. ✅ Connect to VPN from S7 device"
echo "3. ✅ Run this script again to see S7 in connected clients"
echo "4. ✅ On S7 device, visit https://ifconfig.me"
echo "   → Should show: $PUBLIC_IP (Oracle server IP)"
echo "   → NOT your mobile carrier IP"
echo ""
echo "To test proxy functionality:"
echo "5. ✅ Use the VPN IP in your WhatsApp proxy configuration"
if [ -n "$S7_VPN_IP" ]; then
    echo "   → S7 VPN IP: $S7_VPN_IP"
fi
echo ""
echo "══════════════════════════════════════════════════"
