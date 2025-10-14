#!/bin/bash
# Stop all node processes
echo "Stopping all Node.js processes..."
taskkill /f /im node.exe 2>NUL
taskkill /f /im tsx.exe 2>NUL

# Wait a moment
sleep 2

# Start backend
echo "Starting backend server..."
cd server
start npx tsx index.ts

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
cd ..
start npm run dev

echo "Both servers should be starting now..."
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5000"