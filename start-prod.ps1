Write-Host "Starting College AI Assistant in production mode..." -ForegroundColor Cyan
Write-Host "This mode is more stable on Windows and should avoid timing errors." -ForegroundColor Yellow
Write-Host ""

# Kill any running node processes first
taskkill /f /im node.exe 2>$null

# Start in production mode (no dev)
npx expo start --no-dev
