#!/bin/bash
# Rebuild frontend
cd ~/frontend
npm run build

# Ensure files are in place
rm -rf ~/backend/public
mkdir -p ~/backend/public
cp -r dist/* ~/backend/public/
