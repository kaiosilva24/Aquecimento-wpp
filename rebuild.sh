#!/bin/bash
# Rebuild frontend with latest changes

echo "Rebuilding frontend..."
cd ~/frontend
npm run build

echo "Setting permissions..."
sudo chmod 755 /home/ubuntu
sudo chmod -R 755 /home/ubuntu/frontend/dist

echo "Restarting nginx..."
sudo systemctl restart nginx

echo "Done! Testing..."
curl -s http://localhost:5173 | head -10
