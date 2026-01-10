@echo off
echo ========================================
echo Wisconsin Hail CRM - Quick Setup
echo ========================================
echo.

echo [1/3] Checking environment...
if not exist ".env.local" (
    echo WARNING: .env.local not found!
    echo Please copy .env.local.example and fill in your Supabase credentials.
    echo.
    pause
    exit /b 1
)

echo [2/3] Installing dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo [3/3] Starting development server...
echo.
echo The app will open at: http://localhost:3000
echo.
call npm run dev
