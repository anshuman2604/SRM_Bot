// Modified by windows-fix.js to resolve Windows timing issues
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project root directory
const projectRoot = __dirname;
const workspaceRoot = projectRoot;

// Create the default Metro config
const config = getDefaultConfig(projectRoot);

// Increase timeouts to prevent timing errors
config.server = config.server || {};
config.server.timeoutInterval = 120000; // 2 minutes

// Disable watchman health check which can cause timing issues
config.watcher = {
  additionalExts: ['mjs', 'cjs'],
  healthCheck: {
    enabled: false,
  },
  watchman: {
    deferStates: ['hg.update'],
  },
};

// Add additional module paths
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Add specific extensions for web support
config.resolver.sourceExts = [
  'web.tsx', 'web.ts', 'web.jsx', 'web.js',
  'tsx', 'ts', 'jsx', 'js',
  'json', 'wasm',
  'cjs'
];

// Add asset extensions
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'html', 'css', 'svg', 'ttf', 'otf'
];

// Add transformer asset plugins
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

module.exports = config;
