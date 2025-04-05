@echo off
echo ===== Installing Authentication Fix Dependencies =====
echo.

echo Installing NetInfo package for network detection...
call npm install @react-native-community/netinfo --force

echo.
echo Installing AsyncStorage for offline persistence...
call npm install @react-native-async-storage/async-storage --force

echo.
echo Dependencies installed successfully!
echo.
echo Now run the app with:
echo npx expo start --tunnel
echo.
pause