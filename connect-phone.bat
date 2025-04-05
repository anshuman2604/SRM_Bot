@echo off
echo College AI Assistant - Phone Connection Helper
echo =============================================
echo.

echo This script will help you connect your phone to the app running on your computer.
echo.

echo Step 1: Getting your computer's IP address...
ipconfig | findstr /i "IPv4"
echo.
echo Look for the IPv4 Address that starts with 192.168.x.x or 10.0.x.x
echo This is your computer's IP address on your local network.
echo.
echo Step 2: Make sure your phone is connected to the same WiFi network as your computer.
echo.
echo Step 3: Starting the app in LAN mode (most reliable for phone connections)...
echo.
echo Press any key to start the app...
pause > nul

set NODE_OPTIONS=--max-old-space-size=4096
set UV_THREADPOOL_SIZE=16

npx expo start --lan

echo.
echo If the app crashed, try running it with:
echo npx expo start --no-dev --lan
echo.
pause
