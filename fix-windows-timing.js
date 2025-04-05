// This script modifies the Metro configuration to fix the Windows timing error
const fs = require('fs');
const path = require('path');

// Path to the metro.config.js file
const metroConfigPath = path.join(__dirname, 'metro.config.js');

// Check if the file exists
if (!fs.existsSync(metroConfigPath)) {
  console.error('metro.config.js not found. Creating a new one...');
  
  // Create a new metro.config.js file with optimized settings for Windows
  const metroConfig = `
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add the following to fix Windows timing issues
config.watchFolders = [__dirname];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

// Increase timeouts to avoid timing errors
config.server = {
  ...config.server,
  port: 8081,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Increase timeout for Windows
      req.setTimeout(60000);
      middleware(req, res, next);
    };
  }
};

module.exports = config;
`;

  fs.writeFileSync(metroConfigPath, metroConfig);
  console.log('Created new metro.config.js with Windows-friendly settings');
} else {
  // Read the existing metro.config.js
  let metroConfig = fs.readFileSync(metroConfigPath, 'utf8');
  
  // Check if the config already has the Windows fixes
  if (!metroConfig.includes('req.setTimeout(60000)')) {
    console.log('Modifying existing metro.config.js to fix Windows timing issues...');
    
    // Add the Windows fixes
    metroConfig = metroConfig.replace(
      'module.exports = config;',
      `// Add Windows timing fixes
config.server = {
  ...config.server,
  port: 8081,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Increase timeout for Windows
      req.setTimeout(60000);
      middleware(req, res, next);
    };
  }
};

module.exports = config;`
    );
    
    fs.writeFileSync(metroConfigPath, metroConfig);
    console.log('Updated metro.config.js with Windows timing fixes');
  } else {
    console.log('metro.config.js already has Windows timing fixes');
  }
}

// Create a modified app.json with fixes for Windows
const appJsonPath = path.join(__dirname, 'app.json');
if (fs.existsSync(appJsonPath)) {
  console.log('Modifying app.json to fix Windows timing issues...');
  
  let appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  // Add Windows-specific fixes
  appJson.expo = {
    ...appJson.expo,
    packagerOpts: {
      ...appJson.expo?.packagerOpts,
      sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
      nonPersistent: true // This can help with Windows timing issues
    }
  };
  
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log('Updated app.json with Windows timing fixes');
}

console.log('Fixes applied! Now try running the app with:');
console.log('npx expo start --no-dev');
