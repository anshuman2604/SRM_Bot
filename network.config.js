// network.config.js
// This file helps configure network settings for Expo development server

module.exports = {
  // Force the server to use LAN connection instead of tunnel
  dev: {
    hostType: "lan",
    lanType: "ip",
    minify: false
  },
  // Increase timeout values to prevent connection timeouts
  networkSettings: {
    timeout: 60000, // 60 seconds timeout instead of default
    maxRetries: 5,
    retryDelay: 1000
  }
};
