Write-Host "Clearing Expo and Metro cache..." -ForegroundColor Cyan

# Stop any running Metro processes
Write-Host "Stopping any running Metro processes..." -ForegroundColor Yellow
taskkill /f /im node.exe 2>$null

# Clear Expo cache
Write-Host "Clearing Expo cache..." -ForegroundColor Yellow
if (Test-Path "$env:APPDATA\Expo") {
    Remove-Item -Path "$env:APPDATA\Expo" -Recurse -Force
}
if (Test-Path "$env:USERPROFILE\.expo") {
    Remove-Item -Path "$env:USERPROFILE\.expo" -Recurse -Force
}

# Clear project-specific cache
Write-Host "Clearing project cache..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item -Path ".expo" -Recurse -Force
}
if (Test-Path ".expo-shared") {
    Remove-Item -Path ".expo-shared" -Recurse -Force
}
if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force
}

# Clear Watchman cache if installed
Write-Host "Clearing Watchman cache..." -ForegroundColor Yellow
watchman watch-del-all 2>$null

# Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "Cache clearing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Now starting Expo with a clean tunnel..." -ForegroundColor Cyan
Write-Host ""

# Start Expo with a clean tunnel
npx expo start --clear --tunnel
