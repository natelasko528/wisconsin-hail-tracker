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
