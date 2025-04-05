# PowerShell script to run Expo with tunnel for College AI Assistant
Write-Host "Starting College AI Assistant with tunnel connection..." -ForegroundColor Green

# Kill any existing processes on port 8081
Write-Host "Freeing port 8081..." -ForegroundColor Yellow
npx kill-port 8081

# Set environment variables
$env:NODE_OPTIONS = "--max-old-space-size=4096"

# Try to run Expo with tunnel directly
Write-Host "Starting Expo with tunnel..." -ForegroundColor Cyan
Write-Host "This may take a minute or two to establish the connection." -ForegroundColor Cyan
Write-Host "If you see a QR code, scan it with Expo Go on your phone." -ForegroundColor Cyan

# Run Expo with tunnel
npx expo start --tunnel

# Keep console open if there's an error
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error occurred. Press any key to exit..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
