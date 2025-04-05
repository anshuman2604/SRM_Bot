// Local configuration to fix timeout issues
const { getDefaultConfig } = require('@expo/metro-config');
const ip = require('ip');

const localIp = ip.address();

module.exports = {
  name: "college-ai-assistant",
  slug: "college-ai-assistant",
  // Network configuration to fix timeout issues
  extra: {
    // Force LAN connection
    hostUri: `${localIp}:8082`,
    // Increase timeout values
    networkTimeout: 60000,
    // Use explicit IP address
    localIp: localIp
  },
  // Ensure Metro uses the right settings
  metro: {
    server: {
      port: 8082
    }
  },
  // Development client configuration
  developmentClient: {
    silentLaunch: true
  },
  // Explicitly set the connection type to LAN
  updates: {
    fallbackToCacheTimeout: 60000
  },
  // Add additional Android configuration
  android: {
    package: "com.collegeaiassistant",
    adaptiveIcon: {
      backgroundColor: "#ffffff"
    }
  },
  // Add iOS configuration
  ios: {
    bundleIdentifier: "com.collegeaiassistant",
    supportsTablet: true
  }
};
