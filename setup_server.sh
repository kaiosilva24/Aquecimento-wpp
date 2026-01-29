#!/bin/bash
set -e
echo "STARTING SETUP..."
sudo apt-get update
sudo apt-get install -y curl git unzip libgbm-dev
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y chromium-browser
sudo npm install -g pm2
echo "export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> ~/.bashrc
echo "export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser" >> ~/.bashrc
echo "SETUP COMPLETED SUCCESSFULLY"
