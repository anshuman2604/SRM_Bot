@echo off
echo College AI Assistant - Tunnel with Different Port
echo =============================================
echo.

echo This script will close any running Metro processes and start on a different port.
echo.

echo Step 1: Stopping any running Metro processes...
taskkill /f /im node.exe 2>nul

echo.
echo Step 2: Clearing Metro cache...
rd /s /q "node_modules\.cache" 2>nul

echo.
echo Step 3: Setting environment variables...
set NODE_OPTIONS=--max-old-space-size=4096
set UV_THREADPOOL_SIZE=16

echo.
echo Step 4: Starting Expo in tunnel mode with a different port...
echo.
echo Note: Establishing the tunnel may take up to 60 seconds.
echo Please be patient while the QR code is being generated.
echo.

npx expo start --tunnel --no-dev --port 8082

echo.
pause
