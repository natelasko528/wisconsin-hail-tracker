#!/bin/bash

# Wisconsin Hail Tracker - Backend Deployment Helper
# This script helps you deploy the backend to various platforms

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║   WISCONSIN HAIL TRACKER - BACKEND DEPLOYMENT          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to generate random secret
generate_secret() {
    openssl rand -base64 32 | tr -d '\n'
}

echo -e "${BLUE}Choose your deployment platform:${NC}"
echo ""
echo "  1) Railway    (Easiest - $5/month free credit)"
echo "  2) Render     (Completely Free - 500 hours/month)"
echo "  3) Fly.io     (Global Edge - Great performance)"
echo "  4) Just prepare files (I'll deploy manually)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}Deploying to Railway...${NC}"
        echo ""

        # Check if Railway CLI is installed
        if ! command -v railway &> /dev/null; then
            echo -e "${YELLOW}Installing Railway CLI...${NC}"
            npm install -g @railway/cli
        fi

        # Navigate to backend
        cd backend

        # Login
        echo -e "${BLUE}Please login to Railway (browser will open)${NC}"
        railway login

        # Initialize project
        echo -e "${YELLOW}Initializing Railway project...${NC}"
        railway init

        # Generate secrets
        JWT_SECRET=$(generate_secret)
        REFRESH_SECRET=$(generate_secret)

        # Set environment variables
        echo -e "${YELLOW}Setting environment variables...${NC}"
        railway variables set JWT_SECRET="$JWT_SECRET"
        railway variables set REFRESH_TOKEN_SECRET="$REFRESH_SECRET"
        railway variables set FRONTEND_URL="https://wisconsin-hail-tracker.vercel.app"
        railway variables set USE_IN_MEMORY_DB="true"
        railway variables set NODE_ENV="production"
        railway variables set PORT="3001"

        # Deploy
        echo -e "${YELLOW}Deploying backend...${NC}"
        railway up

        # Get URL
        echo ""
        echo -e "${GREEN}✓ Deployment complete!${NC}"
        echo ""
        railway domain
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo "1. Copy the URL above"
        echo "2. Go to Vercel Dashboard → Settings → Environment Variables"
        echo "3. Add: NEXT_PUBLIC_API_URL = <your-railway-url>"
        echo "4. Redeploy in Vercel"
        ;;

    2)
        echo ""
        echo -e "${YELLOW}Preparing for Render deployment...${NC}"
        echo ""

        JWT_SECRET=$(generate_secret)
        REFRESH_SECRET=$(generate_secret)

        echo -e "${GREEN}✓ Generated secrets successfully${NC}"
        echo ""
        echo -e "${BLUE}Follow these steps:${NC}"
        echo ""
        echo "1. Go to: https://render.com/deploy"
        echo ""
        echo "2. Click 'New +' → 'Web Service'"
        echo ""
        echo "3. Connect your GitHub repo: wisconsin-hail-tracker"
        echo ""
        echo "4. Configure:"
        echo "   - Name: wisconsin-hail-tracker-backend"
        echo "   - Root Directory: backend"
        echo "   - Build Command: npm install"
        echo "   - Start Command: npm start"
        echo "   - Plan: Free"
        echo ""
        echo "5. Add Environment Variables:"
        echo ""
        echo "   NODE_ENV=production"
        echo "   USE_IN_MEMORY_DB=true"
        echo "   PORT=3001"
        echo "   FRONTEND_URL=https://wisconsin-hail-tracker.vercel.app"
        echo -e "   JWT_SECRET=${GREEN}$JWT_SECRET${NC}"
        echo -e "   REFRESH_TOKEN_SECRET=${GREEN}$REFRESH_SECRET${NC}"
        echo ""
        echo "6. Click 'Create Web Service'"
        echo ""
        echo "7. Copy your Render URL and add to Vercel:"
        echo "   NEXT_PUBLIC_API_URL = <your-render-url>"
        echo ""

        # Save secrets to file
        cat > backend/.env.render << EOF
# Generated secrets for Render deployment
# Copy these to Render dashboard

NODE_ENV=production
USE_IN_MEMORY_DB=true
PORT=3001
FRONTEND_URL=https://wisconsin-hail-tracker.vercel.app
JWT_SECRET=$JWT_SECRET
REFRESH_TOKEN_SECRET=$REFRESH_SECRET
EOF

        echo -e "${GREEN}✓ Secrets saved to backend/.env.render${NC}"
        ;;

    3)
        echo ""
        echo -e "${YELLOW}Deploying to Fly.io...${NC}"
        echo ""

        # Check if Fly CLI is installed
        if ! command -v fly &> /dev/null; then
            echo -e "${YELLOW}Installing Fly CLI...${NC}"
            curl -L https://fly.io/install.sh | sh
            export FLYCTL_INSTALL="$HOME/.fly"
            export PATH="$FLYCTL_INSTALL/bin:$PATH"
        fi

        # Login
        echo -e "${BLUE}Please login to Fly.io${NC}"
        fly auth login

        # Navigate to backend
        cd backend

        # Launch app
        echo -e "${YELLOW}Launching Fly.io app...${NC}"
        fly launch --name wisconsin-hail-tracker-backend --region ord --no-deploy

        # Generate secrets
        JWT_SECRET=$(generate_secret)
        REFRESH_SECRET=$(generate_secret)

        # Set secrets
        echo -e "${YELLOW}Setting secrets...${NC}"
        fly secrets set JWT_SECRET="$JWT_SECRET"
        fly secrets set REFRESH_TOKEN_SECRET="$REFRESH_SECRET"
        fly secrets set FRONTEND_URL="https://wisconsin-hail-tracker.vercel.app"
        fly secrets set USE_IN_MEMORY_DB="true"
        fly secrets set NODE_ENV="production"

        # Deploy
        echo -e "${YELLOW}Deploying...${NC}"
        fly deploy

        # Get info
        echo ""
        echo -e "${GREEN}✓ Deployment complete!${NC}"
        echo ""
        fly info
        echo ""
        echo -e "${BLUE}Your backend URL: https://wisconsin-hail-tracker-backend.fly.dev${NC}"
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo "1. Go to Vercel Dashboard → Settings → Environment Variables"
        echo "2. Add: NEXT_PUBLIC_API_URL = https://wisconsin-hail-tracker-backend.fly.dev"
        echo "3. Redeploy in Vercel"
        ;;

    4)
        echo ""
        echo -e "${YELLOW}Preparing deployment files...${NC}"
        echo ""

        JWT_SECRET=$(generate_secret)
        REFRESH_SECRET=$(generate_secret)

        # Create .env.production file
        cat > backend/.env.production << EOF
# Wisconsin Hail Tracker - Production Environment
# Generated: $(date)

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://wisconsin-hail-tracker.vercel.app

# Database
USE_IN_MEMORY_DB=true
DATABASE_URL=

# Authentication
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=$REFRESH_SECRET
REFRESH_TOKEN_EXPIRES_IN=30d

# Optional Services
NOAA_API_TOKEN=
SKIPTRACE_PROVIDER=mock
TLOXP_API_KEY=
GHL_API_KEY=
GHL_LOCATION_ID=
GHL_WEBHOOK_SECRET=
SENDGRID_API_KEY=
FROM_EMAIL=noreply@wisconsinhailtracker.com
FROM_NAME=Wisconsin Hail Tracker
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
REDIS_URL=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info

# Features
ENABLE_SKIP_TRACING=true
ENABLE_EMAIL_CAMPAIGNS=true
ENABLE_SMS_CAMPAIGNS=true
ENABLE_GHL_SYNC=true
ENABLE_AUTO_HAIL_SYNC=false

# Costs
SKIPTRACE_COST_PER_LOOKUP=0.25
SMS_COST_PER_MESSAGE=0.0079
EMAIL_COST_PER_MESSAGE=0.001
EOF

        echo -e "${GREEN}✓ Created backend/.env.production${NC}"
        echo ""
        echo -e "${BLUE}Deployment files ready:${NC}"
        echo "  • backend/.env.production (environment variables)"
        echo "  • backend/Dockerfile (Docker deployment)"
        echo "  • backend/railway.toml (Railway deployment)"
        echo "  • backend/render.yaml (Render deployment)"
        echo ""
        echo -e "${BLUE}See BACKEND_DEPLOYMENT.md for detailed instructions${NC}"
        ;;

    *)
        echo -e "${RED}Invalid choice. Please run the script again.${NC}"
        exit 1
        ;;
esac

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   DEPLOYMENT SETUP COMPLETE!                           ║"
echo "╚════════════════════════════════════════════════════════╝"
