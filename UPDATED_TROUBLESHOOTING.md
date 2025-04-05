# Troubleshooting Guide

This guide provides solutions to common issues you might encounter when running the College AI Assistant application.

## Installation Issues

### Node.js and npm Errors

If you encounter errors during `npm install`:

1. **Clear npm cache**
   ```
   npm cache clean --force
   ```

2. **Use force flag**
   ```
   npm install --force
   ```

3. **Check Node.js version**
   Ensure you're using Node.js v18 or higher:
   ```
   node -v
   ```

### Dependency Conflicts

If you see warnings about dependency conflicts:

1. **Resolve peer dependencies**
   ```
   npm install --legacy-peer-deps
   ```

2. **Update specific packages**
   ```
   npm install expo@~52.0.42 expo-gl@~15.0.5 expo-router@~4.0.20 react-native@0.76.9 --force
   ```

## Windows-Specific Issues

### Timing Errors

If you encounter the error `Assertion failed: new_time >= loop->time, file c:\ws\deps\uv\src\win\core.c, line 327`:

1. **Use Windows-specific scripts**
   - For same network: `.\start-windows.bat`
   - For different networks: `.\tunnel-different-port.bat`

2. **Set environment variables manually**
   ```
   set NODE_OPTIONS=--max-old-space-size=4096
   set UV_THREADPOOL_SIZE=16
   ```

3. **Run in production mode**
   ```
   npx expo start --no-dev
   ```

4. **Clear all caches**
   ```
   rd /s /q "%APPDATA%\Expo"
   rd /s /q "%USERPROFILE%\.expo"
   rd /s /q ".expo"
   rd /s /q ".expo-shared"
   rd /s /q "node_modules\.cache"
   ```

5. **Stop all Node.js processes**
   ```
   taskkill /f /im node.exe
   ```

### Metro Bundler Issues

If Metro bundler crashes or fails to start:

1. **Use a different port**
   ```
   npx expo start --port 8082
   ```

2. **Reset Metro cache**
   ```
   npx expo start --clear
   ```

## Connection and Tunneling Issues

### Expo Tunnel Connection Failures

If you're having trouble connecting to the Expo development server via tunnel:

1. **Use our specialized tunnel script**
   ```
   .\tunnel-different-port.bat
   ```

2. **Check Network Connectivity**
   Ensure your computer has a stable internet connection.

3. **Install Required Dependencies**
   ```
   npm install @expo/ngrok --save-dev
   ```

4. **Check Firewall Settings**
   Ensure your firewall is not blocking the connection.

### Phone Connection Issues

If your phone cannot connect to the Expo server:

1. **Same network connections**
   - Ensure your phone and computer are on the same WiFi network
   - Try disabling firewall temporarily
   - Restart the Expo Go app on your phone

2. **Different network connections**
   - Use the tunnel-different-port.bat script
   - Make sure your phone has a stable internet connection
   - Clear the Expo Go cache on your phone

## App-Specific Issues

### Authentication Problems

If you encounter issues with login or signup:

1. **Check Supabase credentials**
   Ensure your `.env` file has the correct Supabase URL and anon key.

2. **Clear local storage**
   In the Expo Go app, clear the app data or reinstall Expo Go.

### API Connection Issues

If the app cannot connect to external APIs:

1. **Check API keys**
   Ensure your `.env` file has the correct API keys.

2. **Check network connection**
   Ensure your device has a stable internet connection.

3. **Check for rate limiting**
   Some APIs have rate limits that might be exceeded.

## Performance Issues

### Slow App Performance

If the app is running slowly:

1. **Run in production mode**
   ```
   npx expo start --no-dev
   ```

2. **Reduce animations**
   The app includes several animations that might affect performance on older devices.

3. **Clear cache**
   Clear the app cache and restart.
