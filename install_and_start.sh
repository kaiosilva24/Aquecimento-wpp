#!/bin/bash
cd ~/backend
npm install
cd ~/backend
nohup node server.js > ../server.log 2>&1 &
sleep 3
tail -30 ../server.log
