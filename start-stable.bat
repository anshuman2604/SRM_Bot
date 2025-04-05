@echo off
echo College AI Assistant - Stable Start
echo ================================
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

echo Clearing npm cache...
call npm cache clean --force

echo.
echo Step 3: Applying Windows timing fixes...
call node fix-windows-timing.js

echo.
echo Step 4: Starting Expo in production mode...
echo.
call npx expo start --no-dev

pause
