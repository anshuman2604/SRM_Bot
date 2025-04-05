@echo off
echo College AI Assistant - Windows Production Mode
echo ==========================================
echo.

echo This script starts the app in production mode with all Windows fixes applied.
echo.

echo Step 1: Setting environment variables...
set NODE_OPTIONS=--max-old-space-size=4096
set UV_THREADPOOL_SIZE=16

echo.
echo Step 2: Starting Expo in production mode...
echo.
echo Note: The app will start in production mode, which is more stable on Windows.
echo.

npx expo start --no-dev

echo.
pause
