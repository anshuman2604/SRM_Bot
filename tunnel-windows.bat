@echo off
echo College AI Assistant - Windows Tunnel Mode
echo =========================================
echo.

echo This script starts the app in tunnel mode with all Windows fixes applied.
echo Use this when your phone is on a different network than your computer.
echo.

echo Step 1: Setting environment variables...
set NODE_OPTIONS=--max-old-space-size=4096
set UV_THREADPOOL_SIZE=16

echo.
echo Step 2: Clearing Metro cache...
rd /s /q "node_modules\.cache" 2>nul

echo.
echo Step 3: Starting Expo in tunnel mode...
echo.
echo Note: Establishing the tunnel may take up to 60 seconds.
echo Please be patient while the QR code is being generated.
echo.

npx expo start --tunnel --no-dev

echo.
pause
