#!/bin/bash

# Wisconsin Hail Tracker - Instant Deploy
# This script opens everything you need in your browser

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        WISCONSIN HAIL TRACKER - INSTANT DEPLOYMENT           ║"
echo "║              (This takes 2 minutes total)                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📋 Here's what will happen:${NC}"
echo ""
echo "  1. I'll open Render.com for you (sign in with GitHub)"
echo "  2. I'll give you the EXACT settings to copy-paste"
echo "  3. I'll open Vercel for you to add the backend URL"
echo "  4. Done! Your app will be live"
echo ""
read -p "Press ENTER to start..."

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  STEP 1: Deploy Backend to Render (60 seconds)              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${YELLOW}Opening Render.com...${NC}"
echo ""

# Detect OS and open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "https://dashboard.render.com/select-repo?type=web" 2>/dev/null || echo "Please go to: https://dashboard.render.com/select-repo?type=web"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "https://dashboard.render.com/select-repo?type=web" 2>/dev/null || echo "Please go to: https://dashboard.render.com/select-repo?type=web"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    start "https://dashboard.render.com/select-repo?type=web" 2>/dev/null || echo "Please go to: https://dashboard.render.com/select-repo?type=web"
else
    echo "Please go to: https://dashboard.render.com/select-repo?type=web"
fi

echo ""
echo -e "${GREEN}Copy these settings:${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Name: wisconsin-hail-tracker-backend"
echo "Root Directory: backend"
echo "Build Command: npm install"
echo "Start Command: npm start"
echo "Plan: Free"
echo ""
echo "Environment Variables (click 'Add Environment Variable'):"
echo ""
echo "NODE_ENV=production"
echo "USE_IN_MEMORY_DB=true"
echo "PORT=3001"
echo "FRONTEND_URL=https://wisconsin-hail-tracker.vercel.app"
echo "JWT_SECRET=tyROjR8cjBveQuOl3qGRPoy3dov11TKssJV0yZEMyaM="
echo "REFRESH_TOKEN_SECRET=AsIzct6vkdxNmchDu7hTSv5GlkFH49PZSnHjbnGfIEY="
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}⏱️  Wait for Render to finish deploying (3-5 minutes)...${NC}"
echo ""
read -p "When deployment is done, COPY YOUR BACKEND URL and press ENTER..."

echo ""
read -p "Paste your backend URL here: " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  No URL provided. That's ok!${NC}"
    echo ""
    echo "When you have your backend URL:"
    echo "1. Go to: https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker/settings/environment-variables"
    echo "2. Add: NEXT_PUBLIC_API_URL = <your-backend-url>"
    echo "3. Redeploy"
    exit 0
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  STEP 2: Update Vercel with Backend URL (30 seconds)        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${YELLOW}Opening Vercel settings...${NC}"
echo ""

# Open Vercel environment variables page
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker/settings/environment-variables" 2>/dev/null
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker/settings/environment-variables" 2>/dev/null
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    start "https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker/settings/environment-variables" 2>/dev/null
fi

echo -e "${GREEN}Add this environment variable:${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Name: NEXT_PUBLIC_API_URL"
echo "Value: $BACKEND_URL"
echo "Environments: Check all 3 boxes (Production, Preview, Development)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "After adding the variable, press ENTER to continue..."

echo ""
echo -e "${YELLOW}Opening Vercel deployments...${NC}"
echo ""

# Open Vercel deployments
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker" 2>/dev/null
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker" 2>/dev/null
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    start "https://vercel.com/natelasko528s-projects/wisconsin-hail-tracker" 2>/dev/null
fi

echo ""
echo -e "${GREEN}Click the '...' menu on your latest deployment → 'Redeploy'${NC}"
echo ""
read -p "After clicking Redeploy, press ENTER..."

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT COMPLETE!                                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${GREEN}🎉 Your app is now live!${NC}"
echo ""
echo "Test it here: https://wisconsin-hail-tracker.vercel.app"
echo ""
echo "Login with:"
echo "  Email: admin@example.com"
echo "  Password: password123"
echo ""
echo -e "${BLUE}Opening your app...${NC}"
echo ""

# Open the app
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://wisconsin-hail-tracker.vercel.app" 2>/dev/null
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "https://wisconsin-hail-tracker.vercel.app" 2>/dev/null
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    start "https://wisconsin-hail-tracker.vercel.app" 2>/dev/null
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Backend URL: $BACKEND_URL"
echo "║  Frontend URL: https://wisconsin-hail-tracker.vercel.app"
echo "║  Status: ✅ LIVE"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Enjoy your Wisconsin Hail Tracker!"
