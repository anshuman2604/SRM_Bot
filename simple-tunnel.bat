@echo off
echo College AI Assistant - Simple QR Code Tunnel
echo ==========================================
echo.

echo This script will create a simple tunnel with a QR code you can scan.
echo.

echo Step 1: Installing required packages...
call npm install --save-dev @expo/ngrok@^4.1.0

echo.
echo Step 2: Setting environment variables to prevent Windows timing errors...
set NODE_OPTIONS=--max-old-space-size=4096
set UV_THREADPOOL_SIZE=16
set EXPO_TUNNEL_VERBOSE=true

echo.
echo Step 3: Starting Expo with tunnel and QR code...
echo.
echo Please be patient while the tunnel is being established.
echo This may take up to 60 seconds.
echo.
echo When the QR code appears, scan it with your phone's camera.
echo.

npx expo start --tunnel --no-dev

echo.
echo If the tunnel failed, try restarting your computer and running this script again.
echo.
pause
