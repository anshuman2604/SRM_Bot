# Troubleshooting Guide for College AI Assistant

This guide provides solutions to common issues you might encounter when running the College AI Assistant application.

## Table of Contents
- [Animation and Transform Errors](#animation-and-transform-errors)
- [Connection and Tunneling Issues](#connection-and-tunneling-issues)
- [Dependency Conflicts](#dependency-conflicts)
- [API Rate Limiting](#api-rate-limiting)

## Animation and Transform Errors

### Common Transform Errors

If you encounter any of these errors:
- `Invariant Violation: Transform with key of 'scale' must be a number: {'scale':1}`
- `Exception in HostFunction: TypeError: expected dynamic type 'int/double/bool/string', but had type 'object'`
- `TypeError: Cannot read property 'scale' of undefined`

These are typically caused by animation values not being properly interpolated before being used in transform styles.

### Solution

1. **Avoid Passing Animated.Value Objects Directly to Transforms**

   Always interpolate Animated.Value objects before using them in transform styles:

   ```javascript
   // INCORRECT - Will cause errors
   const scaleAnim = useRef(new Animated.Value(1)).current;
   
   // Later in your style
   style={{
     transform: [{ scale: scaleAnim }] // Error: Passing Animated.Value directly
   }}
   
   // CORRECT - Interpolate first
   const scaleAnim = useRef(new Animated.Value(1)).current;
   
   // Later in your style
   style={{
     transform: [{ 
       scale: scaleAnim.interpolate({
         inputRange: [0, 1],
         outputRange: [0.8, 1]
       }) 
     }]
   }}
   ```

2. **Use Static Values for Problematic Animations**

   If you continue to experience issues, consider replacing animated transforms with static values:

   ```javascript
   // Instead of animated scale
   style={{
     transform: [{ scale: 1 }] // Static value
   }}
   ```

3. **Use Opacity Instead of Scale**

   For simple animations, consider using opacity instead of scale transforms:

   ```javascript
   const opacityAnim = useRef(new Animated.Value(0)).current;
   
   // Later in your style
   style={{
     opacity: opacityAnim
   }}
   ```

### Components with Known Issues

The following components in the app have been modified to prevent transform errors:

1. **AnimatedEye Component**
   - Removed scale animations and replaced with static transforms
   - Modified to use conditional rendering based on props instead of animations

2. **TypingAnimation Component**
   - Replaced scale transforms with opacity animations
   - Simplified animation logic to avoid timing issues

3. **Building3D Component**
   - Removed interpolated scale transforms
   - Used static values for transforms

4. **FuturisticDots Component**
   - Simplified animation logic
   - Removed complex transform chains

## Connection and Tunneling Issues

### Expo Tunnel Connection Failures

If you're having trouble connecting to the Expo development server via tunnel:

1. **Clear Expo Cache**
   ```
   npx expo start --clear --tunnel
   ```

2. **Check Network Connectivity**
   Ensure your computer has a stable internet connection.

3. **Update Expo CLI**
   ```
   npm install -g expo-cli
   ```

4. **Install Required Dependencies**
   ```
   npm install @expo/ngrok --save-dev
   ```

5. **Check Firewall Settings**
   Ensure your firewall is not blocking the connection.

### Windows Timing Error

If you encounter the error `Assertion failed: new_time >= loop->time, file c:\ws\deps\uv\src\win\core.c, line 327`:

1. **Use Windows Stable Mode**
   This is a common issue with Node.js and Expo on Windows. Use the provided `windows-stable.bat` script:
   ```
   .\windows-stable.bat
   ```

2. **Use Production Mode**
   Running in production mode is more stable on Windows:
   ```
   npx expo start --no-dev
   ```

3. **Try a Different Port**
   Sometimes changing the port helps:
   ```
   npx expo start --no-dev --port 19001
   ```

4. **Set Node Environment Variables**
   Before starting Expo, set these environment variables:
   ```
   set NODE_OPTIONS=--max-old-space-size=4096
   set UV_THREADPOOL_SIZE=16
   ```

5. **Avoid Tunnel Mode on Windows**
   Use LAN mode instead if possible, as tunnel mode is more prone to timing errors on Windows.

### Metro Bundler Issues

If the Metro bundler crashes or fails to start:

1. **Clear Metro Cache**
   ```
   npx react-native start --reset-cache
   ```

2. **Check Node.js Version**
   The app works best with Node.js v22.14.0 and npm v10.9.2.

## Dependency Conflicts

The app uses several packages that may have version conflicts, particularly with React Three Fiber and related 3D visualization packages.

### Resolving Dependency Conflicts

1. **Install with Force Flag**
   ```
   npm install --force
   ```

2. **Update Expo SDK**
   If recommended by the Expo CLI, update the Expo SDK version:
   ```
   npx expo install expo
   ```

3. **Check for Peer Dependencies**
   Review the package.json file and ensure all peer dependencies are correctly installed.

## API Rate Limiting

### Google Gemini API Limits

If you encounter rate limiting with the Gemini API:

1. **Check API Usage**
   Visit the Google AI Studio dashboard to check your current usage.

2. **Enable Offline Mode**
   Set `EXPO_PUBLIC_ENABLE_OFFLINE_MODE=true` in your .env file to use cached responses.

3. **Implement Retry Logic**
   The app includes built-in retry logic for API calls. Configure the retry count and timeout in your .env file:
   ```
   EXPO_PUBLIC_AUTH_RETRY_COUNT=3
   EXPO_PUBLIC_AUTH_TIMEOUT_MS=5000
   EXPO_PUBLIC_NETWORK_RETRY=true
   ```

### Supabase Connection Issues

If you experience issues connecting to Supabase:

1. **Verify Credentials**
   Double-check your Supabase URL and anon key in the .env file.

2. **Check Supabase Status**
   Visit the Supabase dashboard to ensure the service is operational.

3. **Enable Network Retry**
   Set `EXPO_PUBLIC_NETWORK_RETRY=true` in your .env file.

## Still Having Issues?

If you continue to experience problems after trying these solutions, please:

1. Check the [Issues](https://github.com/yourusername/college-ai-assistant/issues) section of the GitHub repository
2. Create a new issue with detailed information about your problem
3. Include error logs, screenshots, and steps to reproduce the issue
