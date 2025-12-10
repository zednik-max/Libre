# Fix Vertex AI Permissions
# This script provides commands to grant required IAM roles to your service account

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  Vertex AI Permission Fix Guide" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Read service account info
$saKeyPath = "D:\java\LibreChat\gcp-sa-key.json"
if (Test-Path $saKeyPath) {
    $saKey = Get-Content $saKeyPath | ConvertFrom-Json
    $projectId = $saKey.project_id
    $serviceAccount = $saKey.client_email
    
    Write-Host "`nDetected Configuration:" -ForegroundColor Yellow
    Write-Host "  Project ID: $projectId" -ForegroundColor White
    Write-Host "  Service Account: $serviceAccount" -ForegroundColor White
} else {
    Write-Host "`n[ERROR] Service account key not found at: $saKeyPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Option 1: Use Google Cloud Console (Web)" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "`n1. Open this URL in your browser:"
Write-Host "   https://console.cloud.google.com/iam-admin/iam?project=$projectId" -ForegroundColor Yellow
Write-Host "`n2. Find your service account:"
Write-Host "   $serviceAccount" -ForegroundColor Yellow
Write-Host "`n3. Click the Edit (pencil) icon"
Write-Host "`n4. Click 'Add Another Role' and add:"
Write-Host "   - Vertex AI User (roles/aiplatform.user)" -ForegroundColor Cyan
Write-Host "`n5. Click 'Save'"
Write-Host "`n6. Run option 7 in LibreChatManager to rebuild Vertex Proxy"

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Option 2: Use gcloud CLI" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "`nCopy and run these commands in Google Cloud Shell:"
Write-Host "`n# Set project" -ForegroundColor Gray
Write-Host "gcloud config set project $projectId" -ForegroundColor Yellow
Write-Host "`n# Grant Vertex AI User role (required)" -ForegroundColor Gray
Write-Host "gcloud projects add-iam-policy-binding $projectId \\" -ForegroundColor Yellow
Write-Host "  --member=`"serviceAccount:$serviceAccount`" \\" -ForegroundColor Yellow
Write-Host "  --role=`"roles/aiplatform.user`"" -ForegroundColor Yellow
Write-Host "`n# Verify permissions" -ForegroundColor Gray
Write-Host "gcloud projects get-iam-policy $projectId \\" -ForegroundColor Yellow
Write-Host "  --flatten=`"bindings[].members`" \\" -ForegroundColor Yellow
Write-Host "  --format=`"table(bindings.role)`" \\" -ForegroundColor Yellow
Write-Host "  --filter=`"bindings.members:$serviceAccount`"" -ForegroundColor Yellow

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "After Granting Permissions:" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "`n1. Run LibreChatManager:" -ForegroundColor White
Write-Host "   .\LibreChatManager.ps1" -ForegroundColor Yellow
Write-Host "`n2. Select option 7 (Rebuild Vertex Proxy)" -ForegroundColor White
Write-Host "`n3. Test with option 14 (Test Vertex Proxy Direct)" -ForegroundColor White

Write-Host "`n================================================`n" -ForegroundColor Cyan

# Ask if user wants to open the IAM page
$openBrowser = Read-Host "Open Google Cloud IAM page in browser? (y/n)"
if ($openBrowser -eq 'y') {
    Start-Process "https://console.cloud.google.com/iam-admin/iam?project=$projectId"
    Write-Host "Browser opened. Please grant the permissions and return here." -ForegroundColor Green
}

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
