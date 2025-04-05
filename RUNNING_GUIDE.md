# College AI Assistant - Quick Running Guide

This guide provides quick instructions for running the College AI Assistant application in different scenarios.

## Prerequisites

- Node.js (LTS version recommended, v18+ works best)
- npm or yarn
- Expo Go app installed on your mobile device

## Environment Setup

Make sure your `.env` file in the root directory contains:

```
EXPO_PUBLIC_SUPABASE_URL=https://dwjfojchgktxbgnyxdwa.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3amZvamNoZ2t0eGJnbnl4ZHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1MzIwMTksImV4cCI6MjA1NzEwODAxOX0.0oTbeorcxjwvvhiUAmNLLYd5KE7MslTtPx3eHk-KkzU
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyAdG0mkh2Cm74dUxg5qppgZi-UC-OFk4Yk
```

## Quick Start Commands

### Method 1: Standard Local Development (Same Network)

If your phone and computer are on the same WiFi network:

```bash
# Install dependencies (only needed first time or when dependencies change)
npm install --force

# Start the development server
npx expo start
```

Then scan the QR code with your phone's camera (iOS) or the Expo Go app (Android).

### Method 2: LAN Mode (Same Network, Better Connection)

For a more reliable connection when on the same network:

```bash
# Start in LAN mode
npx expo start --lan
```

### Method 3: Production Mode (Recommended for Windows)

For the most stable experience, especially on Windows to avoid "Assertion failed: new_time >= loop->time" errors:

```bash
# Use the batch file we created
.\run-expo.bat

# OR run this command directly
npx expo start --no-dev
```

This method runs the app in production mode, which is more stable and less likely to encounter timing errors.

### Method 4: Tunnel Mode (Different Networks)

When your phone and computer are on different networks:

```bash
# Start with tunnel mode
npx expo start --tunnel
```

**Note for Windows Users:** If you encounter "Assertion failed: new_time >= loop->time" errors when using tunnel mode, try using Method 3 (Production Mode) instead and connect to the app using your local network.

## Troubleshooting Connection Issues

### If you get timeout errors:

1. **For same network connections:**
   - Make sure your phone and computer are on the same WiFi
   - Try disabling firewall temporarily
   - Restart the Expo Go app on your phone

2. **For different network connections:**
   - If tunnel setup fails, install the required dependency:
     ```
     npm install @expo/ngrok --save-dev
     ```
   - Then try running with tunnel again
   
3. **For tunnel connection problems:**
   - Clear the Expo cache completely:
     ```
     npx expo start --clear --tunnel
     ```
   - If using Windows, you may need to delete temporary files:
     ```
     rmdir /s /q "%APPDATA%\Expo"
     rmdir /s /q "%USERPROFILE%\.expo"
     rmdir /s /q ".expo"
     ```
   - Clear the Metro bundler cache:
     ```
     npx react-native start --reset-cache
     ```
   - Then restart with a fresh tunnel:
     ```
     npx expo start --tunnel
     ```

4. **For Windows timing errors:**
   - Use the production mode (Method 3) which is more stable:
     ```
     npx expo start --no-dev
     ```
   - Alternatively, use the provided batch files: `run-expo.bat` or `run-tunnel.bat`

5. **General fixes:**
   - Kill any running Metro processes:
     ```
     npx kill-port 8081
     npx kill-port 8082
     ```
   - Clear Expo Go app cache on your phone
   - Restart your development server

## Remember

- The `--force` flag is necessary during installation due to dependency conflicts
- Tunneling might be slower than LAN mode but works across different networks
- Production mode (`--no-dev`) is more stable but has slower refresh times
- You can always manually enter the URL in Expo Go if scanning doesn't work
