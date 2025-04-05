@echo off
echo College AI Assistant - Verbose Tunnel Mode
echo =========================================
echo.

echo This script will start Expo with verbose tunnel logging to help diagnose connection issues.
echo.

echo Setting environment variables...
set EXPO_TUNNEL_VERBOSE=true
set NODE_OPTIONS=--max-old-space-size=4096
set UV_THREADPOOL_SIZE=16

echo.
echo Starting Expo with verbose tunnel logging...
echo.
echo Press any key to start...
pause > nul

npx expo start --tunnel --no-dev

echo.
echo If the tunnel still fails, we'll need to try a different approach.
echo.
pause
