@echo off
echo College AI Assistant - Windows Stable Mode
echo =========================================
echo.

echo This script runs the app in a way that avoids the common Windows timing error:
echo "Assertion failed: new_time >= loop->time, file c:\ws\deps\uv\src\win\core.c, line 327"
echo.

echo Step 1: Stopping any running Metro processes...
taskkill /f /im node.exe 2>nul

echo.
echo Step 2: Setting environment variables to improve Windows compatibility...
set NODE_OPTIONS=--max-old-space-size=4096
set UV_THREADPOOL_SIZE=16

echo.
echo Step 3: Starting Expo in production mode (most stable for Windows)...
echo.
echo Note: This mode is more stable but has slower refresh times.
echo If you need to make code changes, restart this script after saving.
echo.
echo Press any key to start the app...
pause > nul

npx expo start --no-dev

echo.
echo If the app crashed, try running it with:
echo npx expo start --no-dev --port 19001
echo.
pause
