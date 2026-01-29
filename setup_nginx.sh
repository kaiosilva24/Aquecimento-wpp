#!/bin/bash
# Install and configure nginx

echo "Installing nginx..."
sudo apt-get update
sudo apt-get install -y nginx

echo "Stopping any processes on port 5173..."
sudo pkill -f "python3 -m http.server 5173" || true
sudo pkill -f "vite.*5173" || true
sleep 2

echo "Copying nginx configuration..."
sudo cp ~/whatsapp-warming.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/whatsapp-warming.conf /etc/nginx/sites-enabled/

echo "Testing nginx configuration..."
sudo nginx -t

echo "Restarting nginx..."
sudo systemctl restart nginx

echo "Nginx configured and started!"
echo ""
echo "Testing..."
curl -s http://localhost:5173 | head -10
