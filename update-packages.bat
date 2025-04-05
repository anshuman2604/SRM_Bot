@echo off
echo College AI Assistant - Package Update Helper
echo ==========================================
echo.

echo This script will update your Expo packages to the recommended versions
echo while avoiding the Windows timing error.
echo.

echo Step 1: Setting environment variables to improve Windows compatibility...
set NODE_OPTIONS=--max-old-space-size=4096
set UV_THREADPOOL_SIZE=16

echo.
echo Step 2: Creating a package update file...
echo.

echo // This file will update the package.json file with the recommended versions > update-versions.js
echo const fs = require('fs'); >> update-versions.js
echo const path = require('path'); >> update-versions.js
echo. >> update-versions.js
echo // Read the package.json file >> update-versions.js
echo const packageJsonPath = path.join(__dirname, 'package.json'); >> update-versions.js
echo const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')); >> update-versions.js
echo. >> update-versions.js
echo // Update the dependencies >> update-versions.js
echo packageJson.dependencies['expo'] = '~52.0.42'; >> update-versions.js
echo packageJson.dependencies['expo-gl'] = '~15.0.5'; >> update-versions.js
echo packageJson.dependencies['expo-router'] = '~4.0.20'; >> update-versions.js
echo packageJson.dependencies['react-native'] = '0.76.9'; >> update-versions.js
echo. >> update-versions.js
echo // Write the updated package.json file >> update-versions.js
echo fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2)); >> update-versions.js
echo. >> update-versions.js
echo console.log('Package versions updated successfully!'); >> update-versions.js

echo.
echo Step 3: Running the update script...
node update-versions.js

echo.
echo Step 4: Clearing node_modules/.cache to ensure clean rebuild...
if exist "node_modules\.cache" rd /s /q "node_modules\.cache"

echo.
echo Package versions have been updated in package.json.
echo.
echo To apply these changes, you should now run:
echo npm install --force
echo.
echo Press any key to run npm install...
pause > nul

npm install --force

echo.
echo Packages updated! Now you can run the app with:
echo .\connect-phone.bat
echo.
pause
