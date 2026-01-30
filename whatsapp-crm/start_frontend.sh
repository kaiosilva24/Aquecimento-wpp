#!/bin/bash
# Start frontend on Oracle server

echo "Installing frontend dependencies..."
cd ~/frontend
npm install

echo "Building frontend for production..."
npm run build

echo "Starting frontend server..."
cd ~/frontend
nohup npm run preview -- --host 0.0.0.0 --port 5173 > ../frontend.log 2>&1 &

sleep 3
echo "Frontend started!"
tail -20 ../frontend.log
