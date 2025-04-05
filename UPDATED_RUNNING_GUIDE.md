# Running Guide

This guide provides instructions for running the College AI Assistant application on different platforms and environments.

## Prerequisites

Before running the application, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v8 or higher)
- [Expo Go](https://expo.dev/client) app on your mobile device

## Environment Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/college-ai-assistant.git
cd college-ai-assistant
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory with the following variables:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

## Running the Application

### Method 1: Windows Optimized Scripts (Recommended for Windows Users)

We've created specialized scripts to avoid common Windows timing errors:

#### For Same Network (Phone and Computer on same WiFi)

```bash
# Run the Windows-optimized script
.\start-windows.bat
```

#### For Different Networks (Tunnel Mode)

```bash
# Run the Windows tunnel script with a different port
.\tunnel-different-port.bat
```

These scripts apply fixes for the common Windows timing error: `Assertion failed: new_time >= loop->time`.

### Method 2: Standard Development Mode

For non-Windows users or if you prefer the standard method:

```bash
# Start the development server
npx expo start
```

### Method 3: Production Mode

For a more stable experience with fewer hot-reloading features:

```bash
# Start in production mode
npx expo start --no-dev
```

### Method 4: Tunnel Mode (Different Networks)

When your phone and computer are on different networks:

```bash
# Start with tunnel mode
npx expo start --tunnel
```

**Note for Windows Users:** If you encounter "Assertion failed: new_time >= loop->time" errors when using tunnel mode, use the Windows-specific scripts mentioned in Method 1.

## Troubleshooting Connection Issues

### If you get timeout errors:

1. **For same network connections:**
   - Make sure your phone and computer are on the same WiFi
   - Try disabling firewall temporarily
   - Restart the Expo Go app on your phone

2. **For different network connections:**
   - If tunnel setup fails, try the `tunnel-different-port.bat` script
   - Make sure your phone has a stable internet connection
   - Clear the Expo Go cache on your phone

### Windows-Specific Issues

If you encounter the error `Assertion failed: new_time >= loop->time`:

1. Use our Windows-specific scripts:
   - `start-windows.bat` for same network connections
   - `tunnel-different-port.bat` for different network connections

2. If you still encounter issues, try:
   - Stopping all Node.js processes before starting
   - Clearing the Metro cache
   - Setting environment variables manually:
     ```
     set NODE_OPTIONS=--max-old-space-size=4096
     set UV_THREADPOOL_SIZE=16
     ```

## Additional Resources

For more detailed troubleshooting, see the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) file.

For information about the application architecture and features, see the [README.md](./README.md) file.
