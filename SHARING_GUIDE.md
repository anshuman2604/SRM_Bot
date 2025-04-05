# Sharing Your College AI Assistant App

This guide provides multiple methods to share your College AI Assistant app with devices not on the same network.

## Method 1: Expo Web Build (Easiest)

You can run your app as a web application, which anyone can access via a URL:

1. Start the web version of your app:
   ```bash
   npx expo start --web
   ```

2. Once running, you can use a service like ngrok to expose your local web server:
   ```bash
   npx ngrok http 8081
   ```

3. Share the ngrok URL with anyone who needs to access your app

## Method 2: Create a Build with Expo EAS

For a native app experience, use Expo Application Services (EAS):

1. Install the EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```

3. Configure your project for EAS:
   ```bash
   eas build:configure
   ```

4. Create a build for Android or iOS:
   ```bash
   eas build --platform android
   ```
   or
   ```bash
   eas build --platform ios
   ```

5. Share the build URL with others

## Method 3: Use a Different Node.js Version

If you're experiencing Node.js timer issues with v22.14.0, try using an older version:

1. Install Node.js v18 LTS (recommended for Expo)
2. Use nvm (Node Version Manager) to switch between versions:
   ```bash
   nvm install 18
   nvm use 18
   ```

3. Then try running with tunnel again:
   ```bash
   npx expo start --tunnel
   ```

## Method 4: Deploy to Expo's Hosting

1. Create an Expo account if you don't have one
2. Publish your app to Expo's servers:
   ```bash
   npx expo publish
   ```
3. Share the published URL with others

## Troubleshooting Windows Timer Issues

If you encounter "Assertion failed: new_time >= loop->time" errors:

1. Try running with the --no-dev flag:
   ```bash
   npx expo start --no-dev
   ```

2. Consider downgrading Node.js to v18 LTS
3. Use the web version of your app instead of native
4. Create a standalone build with EAS

Remember that the futuristic dots animation we implemented should work well with any of these methods, as it's been optimized for performance and visual appeal.
