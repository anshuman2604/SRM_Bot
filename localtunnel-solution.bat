@echo off
echo College AI Assistant - LocalTunnel Solution
echo =========================================
echo.

echo This script uses localtunnel as an alternative to Expo's built-in tunneling.
echo This approach avoids the Windows timing error completely.
echo.

echo Step 1: Installing localtunnel globally...
call npm install -g localtunnel

echo.
echo Step 2: Starting Expo in LAN mode (more stable)...
echo.
echo Starting Expo in a new window...
start cmd /k "set NODE_OPTIONS=--max-old-space-size=4096 && set UV_THREADPOOL_SIZE=16 && npx expo start --lan"

echo.
echo Step 3: Waiting for Expo to start (30 seconds)...
timeout /t 30 /nobreak

echo.
echo Step 4: Creating tunnel to Expo server...
echo.
echo Starting localtunnel in a new window...
start cmd /k "lt --port 8081 --subdomain college-ai-assistant"

echo.
echo =====================================================================
echo INSTRUCTIONS:
echo 1. Wait for both windows to fully start up
echo 2. Look for the URL in the localtunnel window (e.g., https://college-ai-assistant.loca.lt)
echo 3. On your phone, open Expo Go and tap "Enter URL manually"
echo 4. Enter: "exp+" followed by the localtunnel URL
echo    Example: exp+https://college-ai-assistant.loca.lt
echo =====================================================================
echo.
echo Press any key to exit this window...
pause > nul
