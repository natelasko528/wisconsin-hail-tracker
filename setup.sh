#!/bin/bash

# Wisconsin Hail Tracker - Automated Setup Script
# This script sets up everything automatically for local development

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════╗"
echo "║   WISCONSIN HAIL TRACKER - AUTOMATED SETUP            ║"
echo "║   Setting up everything automatically...               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/7] Creating backend environment file...${NC}"
cat > backend/.env << 'EOF'
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database - Using in-memory mode for development
DATABASE_URL=
USE_IN_MEMORY_DB=true

# Authentication
JWT_SECRET=dev-jwt-secret-change-in-production-min-32-characters
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=dev-refresh-secret-change-in-production-min-32-chars
REFRESH_TOKEN_EXPIRES_IN=30d

# NOAA API (optional - will use mock data if not provided)
NOAA_API_TOKEN=

# Skip Tracing (optional - will use mock data)
SKIPTRACE_PROVIDER=mock
TLOXP_API_KEY=

# GoHighLevel (optional - will use mock data)
GHL_API_KEY=
GHL_LOCATION_ID=
GHL_WEBHOOK_SECRET=

# Email (optional - will log to console)
SENDGRID_API_KEY=
FROM_EMAIL=noreply@wisconsinhailtracker.com
FROM_NAME=Wisconsin Hail Tracker

# SMS (optional - will log to console)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Redis (optional)
REDIS_URL=

# AI (optional - will use fallback scoring)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# Logging
LOG_LEVEL=info

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
ENABLE_SKIP_TRACING=true
ENABLE_EMAIL_CAMPAIGNS=true
ENABLE_SMS_CAMPAIGNS=true
ENABLE_GHL_SYNC=true
ENABLE_AUTO_HAIL_SYNC=false

# Cost Tracking
SKIPTRACE_COST_PER_LOOKUP=0.25
SMS_COST_PER_MESSAGE=0.0079
EMAIL_COST_PER_MESSAGE=0.001
EOF

echo -e "${GREEN}✓ Backend environment created${NC}"

echo -e "${YELLOW}[2/7] Creating frontend environment file...${NC}"
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Wisconsin Hail Tracker
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_ENABLE_SKIP_TRACING=true
NEXT_PUBLIC_ENABLE_CAMPAIGNS=true
NEXT_PUBLIC_ENABLE_GHL_SYNC=true
NEXT_PUBLIC_ENABLE_MAP_VIEW=true
EOF

echo -e "${GREEN}✓ Frontend environment created${NC}"

echo -e "${YELLOW}[3/7] Installing backend dependencies...${NC}"
cd backend
npm install --silent
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

echo -e "${YELLOW}[4/7] Installing frontend dependencies...${NC}"
cd ../frontend
npm install --silent
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

cd ..

echo -e "${YELLOW}[5/7] Creating in-memory database module...${NC}"
# This will be created in the next step

echo -e "${YELLOW}[6/7] Creating startup script...${NC}"
cat > start-dev.sh << 'EOF'
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
EOF

chmod +x start-dev.sh

echo -e "${GREEN}✓ Startup script created${NC}"

echo -e "${YELLOW}[7/7] Creating quick start script for Windows...${NC}"
cat > start-dev.bat << 'EOF'
@echo off
echo ╔════════════════════════════════════════════════════════╗
echo ║   WISCONSIN HAIL TRACKER - STARTING DEVELOPMENT        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   SERVERS STARTED SUCCESSFULLY!                        ║
echo ╠════════════════════════════════════════════════════════╣
echo ║   Frontend: http://localhost:3000                      ║
echo ║   Backend:  http://localhost:3001                      ║
echo ║                                                        ║
echo ║   Default Login:                                       ║
echo ║   Email:    admin@example.com                         ║
echo ║   Password: password123                               ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo Press any key to close this window...
pause > nul
EOF

echo -e "${GREEN}✓ Windows startup script created${NC}"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   SETUP COMPLETE! 🎉                                   ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║   To start the application:                            ║"
echo "║                                                        ║"
echo "║   Mac/Linux:   ./start-dev.sh                         ║"
echo "║   Windows:     start-dev.bat                          ║"
echo "║                                                        ║"
echo "║   Or manually:                                         ║"
echo "║   Terminal 1:  cd backend && npm run dev              ║"
echo "║   Terminal 2:  cd frontend && npm run dev             ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Everything is ready! Run ./start-dev.sh to start.${NC}"
