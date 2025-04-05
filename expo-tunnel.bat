@echo off
echo College AI Assistant - Easy Tunnel Connection
echo ==========================================
echo.

echo This script will create a stable connection between your phone and computer
echo even when they are on different networks.
echo.

echo Step 1: Starting Expo in LAN mode...
start cmd /k "cd %~dp0 && set NODE_OPTIONS=--max-old-space-size=4096 && set UV_THREADPOOL_SIZE=16 && npx expo start --lan --no-dev"

echo.
echo Step 2: Waiting for Expo to start (15 seconds)...
timeout /t 15 /nobreak

echo.
echo Step 3: Creating tunnel to Expo server...
start cmd /k "cd %~dp0 && lt --port 8081 --subdomain college-ai-assistant"

echo.
echo =====================================================================
echo INSTRUCTIONS:
echo 1. Wait for both windows to fully start up (about 30 seconds)
echo 2. In the second window, look for a URL like: https://college-ai-assistant.loca.lt
echo 3. On your phone, open Expo Go and tap "Enter URL manually"
echo 4. Enter: exp+https://college-ai-assistant.loca.lt
echo    (Replace with the actual URL from step 2)
echo =====================================================================
echo.
echo Press any key to exit this window...
pause > nul
