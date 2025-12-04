# PowerShell script to set up environment variables for Soldierly Nexus
# Run this script in PowerShell before starting the development server

Write-Host "Setting up environment variables for Soldierly Nexus..." -ForegroundColor Green

# Set environment variables for the current session
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/soldierly_nexus"
$env:NEXTAUTH_URL = "http://localhost:3000"
$env:NEXTAUTH_SECRET = "your-secret-key-here-change-this-in-production"
$env:NODE_ENV = "development"

Write-Host "Environment variables set:" -ForegroundColor Yellow
Write-Host "DATABASE_URL: $env:DATABASE_URL" -ForegroundColor Cyan
Write-Host "NEXTAUTH_URL: $env:NEXTAUTH_URL" -ForegroundColor Cyan
Write-Host "NEXTAUTH_SECRET: $env:NEXTAUTH_SECRET" -ForegroundColor Cyan
Write-Host "NODE_ENV: $env:NODE_ENV" -ForegroundColor Cyan

Write-Host "`nTo start the development server, run:" -ForegroundColor Green
Write-Host "npm run dev" -ForegroundColor White

Write-Host "`nNote: If you don't have a PostgreSQL database running, the app will use fallback authentication." -ForegroundColor Yellow
Write-Host "Demo credentials:" -ForegroundColor Yellow
Write-Host "Admin: admin@soldierly-nexus.com / Passw0rd!" -ForegroundColor White
Write-Host "Operator: operator1@soldierly-nexus.com / Passw0rd!" -ForegroundColor White
Write-Host "User: user1@soldierly-nexus.com / Passw0rd!" -ForegroundColor White
