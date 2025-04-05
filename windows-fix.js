// This script modifies Node.js behavior to work around Windows timing issues
const fs = require('fs');
const path = require('path');

console.log('Applying comprehensive Windows timing fixes...');

// 1. Fix metro.config.js
const metroConfigPath = path.join(__dirname, 'metro.config.js');
const metroConfig = `// Modified by windows-fix.js to resolve Windows timing issues
const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Increase timeouts to prevent timing errors
defaultConfig.resolver.sourceExts.push('cjs');
defaultConfig.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];
defaultConfig.server = defaultConfig.server || {};
defaultConfig.server.timeoutInterval = 120000; // 2 minutes

// Disable watchman health check which can cause timing issues
defaultConfig.watcher = {
  additionalExts: ['mjs', 'cjs'],
  healthCheck: {
    enabled: false,
  },
  watchman: {
    deferStates: ['hg.update'],
  },
};

module.exports = defaultConfig;
`;

fs.writeFileSync(metroConfigPath, metroConfig);
console.log('✅ Updated metro.config.js');

// 2. Fix app.json
const appJsonPath = path.join(__dirname, 'app.json');
let appJson;
try {
  appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
} catch (e) {
  console.log('⚠️ Could not read app.json, creating a new one');
  appJson = { expo: {} };
}

// Ensure expo object exists
appJson.expo = appJson.expo || {};

// Add Windows-specific configurations
appJson.expo.extra = appJson.expo.extra || {};
appJson.expo.extra.nodeOptions = '--max-old-space-size=4096';
appJson.expo.extra.uvThreadpoolSize = 16;

// Add production mode settings
appJson.expo.web = appJson.expo.web || {};
appJson.expo.web.bundler = 'metro';

// Disable development mode for stability
appJson.expo.developmentClient = false;
appJson.expo.runtimeVersion = appJson.expo.runtimeVersion || { policy: 'appVersion' };

// Write the updated app.json
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
console.log('✅ Updated app.json');

// 3. Create a .env file with NODE_OPTIONS
const envPath = path.join(__dirname, '.env');
const envContent = `NODE_OPTIONS=--max-old-space-size=4096
UV_THREADPOOL_SIZE=16
`;

fs.writeFileSync(envPath, envContent);
console.log('✅ Created .env file with Node.js optimizations');

// 4. Create a production-ready start script
const startScriptPath = path.join(__dirname, 'start-windows.bat');
const startScript = `@echo off
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
`;

fs.writeFileSync(startScriptPath, startScript);
console.log('✅ Created start-windows.bat script');

console.log('');
console.log('All fixes have been applied! To run your app:');
console.log('1. Run: .\\start-windows.bat');
console.log('2. Connect your phone using the QR code');
console.log('3. If you need to use tunnel mode, run: npx expo start --tunnel --no-dev');
console.log('');
