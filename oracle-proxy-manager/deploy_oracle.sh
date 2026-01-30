#!/bin/bash
# Deploy script for Oracle server

echo "Stopping existing server..."
pkill -f 'node.*server.js' || true
sleep 2

echo "Starting backend server..."
cd ~/backend
nohup node server.js > ../server.log 2>&1 &
sleep 3

echo "Server started! Checking logs..."
tail -20 ../server.log

echo "Checking database schema..."
sqlite3 ../warming.db ".schema accounts" | head -20
