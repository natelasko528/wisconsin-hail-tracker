#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║   WISCONSIN HAIL TRACKER - STARTING DEVELOPMENT        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Kill any existing processes on ports 3000 and 3001
echo "Checking for existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "Starting backend server..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 3

echo "Starting frontend server..."
cd ../frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   SERVERS STARTED SUCCESSFULLY!                        ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║   Frontend: http://localhost:3000                      ║"
echo "║   Backend:  http://localhost:3001                      ║"
echo "║                                                        ║"
echo "║   Default Login:                                       ║"
echo "║   Email:    admin@example.com                         ║"
echo "║   Password: password123                               ║"
echo "║                                                        ║"
echo "║   Press Ctrl+C to stop both servers                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Logs:"
echo "  Backend: tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
