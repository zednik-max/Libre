#!/usr/bin/env pwsh
# LibreChat User Invitation Script (PowerShell)
# Usage: .\invite-user.ps1 friend@example.com

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Email
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   LibreChat User Invitation Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validate email format
if ($Email -notmatch "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$") {
    Write-Host "ERROR: Invalid email format!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage: .\invite-user.ps1 friend@example.com" -ForegroundColor Yellow
    exit 1
}

Write-Host "Inviting user: $Email" -ForegroundColor Green
Write-Host ""

# Run Docker command
docker exec -it LibreChat npm run invite-user -- $Email

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✓ Invitation sent successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✗ Failed to send invitation!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    exit 1
}
