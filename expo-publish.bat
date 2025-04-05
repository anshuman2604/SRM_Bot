@echo off
echo Preparing to publish your College AI Assistant app...

:: Set environment variables to help with stability
set NODE_OPTIONS=--max-old-space-size=4096

:: Publish to Expo
echo Publishing to Expo (this may take a few minutes)...
npx expo publish

pause
