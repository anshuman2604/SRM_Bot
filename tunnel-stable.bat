@echo off
echo College AI Assistant - Stable Tunnel Connection
echo =============================================
echo.

echo This script will create a stable tunnel connection for phones on different networks.
echo It uses a combination of techniques to avoid the Windows timing error.
echo.

echo Step 1: Stopping any running Metro processes...
taskkill /f /im node.exe 2>nul

echo.
echo Step 2: Clearing all caches...
echo Clearing Expo cache...
rd /s /q "%APPDATA%\Expo" 2>nul
rd /s /q "%USERPROFILE%\.expo" 2>nul
rd /s /q ".expo" 2>nul
rd /s /q ".expo-shared" 2>nul
rd /s /q "node_modules\.cache" 2>nul

echo.
echo Step 3: Setting environment variables to improve Windows compatibility...
set NODE_OPTIONS=--max-old-space-size=4096
set UV_THREADPOOL_SIZE=16

echo.
echo Step 4: Installing ngrok dependency (required for tunneling)...
call npm install @expo/ngrok --save-dev

echo.
echo Step 5: Starting Expo with a stable tunnel configuration...
echo.
echo Note: This process will take a bit longer than usual, but it will be more stable.
echo Please be patient while the tunnel is being established.
echo.
echo Press any key to start the tunnel...
pause > nul

echo Starting tunnel in 3 seconds...
timeout /t 3 >nul

echo.
echo Starting Expo with tunnel...
call npx expo start --tunnel --no-dev

echo.
echo If the tunnel failed, try this alternative command:
echo set EXPO_TUNNEL_VERBOSE=true ^& npx expo start --tunnel --no-dev
echo.
pause
