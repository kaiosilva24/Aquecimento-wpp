#!/bin/bash

echo "🧹 Cleaning up Oracle Server..."

# Stop and remove the old service if it exists
if systemctl is-active --quiet whatsapp-warming; then
    echo "Stopping whatsapp-warming service..."
    sudo systemctl stop whatsapp-warming
    sudo systemctl disable whatsapp-warming
    sudo rm /etc/systemd/system/whatsapp-warming.service
    sudo systemctl daemon-reload
    echo "✅ Service removed."
fi

# Remove the application code
if [ -d "$HOME/whatsapp-warming" ]; then
    echo "Removing legacy code..."
    rm -rf "$HOME/whatsapp-warming"
    echo "✅ Code removed."
fi

# Ensure WireGuard is still running
echo "Checking WireGuard..."
if ! systemctl is-active --quiet wg-quick@wg0; then
    echo "⚠️ WireGuard is not running. Starting it..."
    sudo systemctl start wg-quick@wg0
else
    echo "✅ WireGuard is running."
fi

echo "🎉 Cleanup complete! The server is now ready to be a pure Proxy Gateway."
