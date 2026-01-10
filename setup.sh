#!/bin/bash

echo "========================================"
echo "Wisconsin Hail CRM - Quick Setup"
echo "========================================"
echo ""

echo "[1/3] Checking environment..."
if [ ! -f ".env.local" ]; then
    echo "WARNING: .env.local not found!"
    echo "Please copy .env.local.example and fill in your Supabase credentials."
    echo ""
    exit 1
fi

echo "[2/3] Installing dependencies..."
cd frontend
npm install

if [ $? -ne 0 ]; then
    echo "ERROR: npm install failed"
    exit 1
fi

echo ""
echo "[3/3] Starting development server..."
echo ""
echo "The app will open at: http://localhost:3000"
echo ""
npm run dev
