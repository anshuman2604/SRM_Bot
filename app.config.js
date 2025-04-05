module.exports = {
  expo: {
    name: "college-ai-assistant",
    slug: "college-ai-assistant",
    scheme: "acme",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourname.collegeaiassistant"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.yourname.collegeaiassistant"
    },
    web: {
      bundler: "metro",
      favicon: "./assets/favicon.png",
      name: "College AI Assistant",
      shortName: "AI Assistant",
      backgroundColor: "#0A1128",
      themeColor: "#304FFE",
      output: "static",
      build: {
        babel: {
          include: ["@ui-kitten/components"]
        }
      }
    },
    plugins: [
      "expo-router"
    ],
    extra: {
      eas: {
        projectId: "your-project-id"
      }
    },
    owner: "your-expo-username",
    newArchEnabled: true,
    // This is the important part for fixing timeout issues
    packagerOpts: {
      hostType: "lan",
      lanType: "ip",
      dev: true,
      minify: false
    },
    // Ensure the development server is accessible on your local network
    developer: {
      tool: "expo-cli",
      projectRoot: "."
    }
  }
};
