# Judge0 API Test Script for PowerShell
# This script tests the Judge0 API and shows detailed output

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Judge0 API Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# STEP 1: Set your RapidAPI key here
$RAPIDAPI_KEY = "YOUR_RAPIDAPI_KEY_HERE"  # ← REPLACE THIS with your actual key

if ($RAPIDAPI_KEY -eq "YOUR_RAPIDAPI_KEY_HERE") {
    Write-Host "❌ ERROR: Please replace YOUR_RAPIDAPI_KEY_HERE with your actual RapidAPI key!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get your key:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://rapidapi.com/judge0-official/api/judge0-ce" -ForegroundColor Yellow
    Write-Host "2. Sign up (free)" -ForegroundColor Yellow
    Write-Host "3. Subscribe to 'Basic' plan (free)" -ForegroundColor Yellow
    Write-Host "4. Copy your X-RapidAPI-Key" -ForegroundColor Yellow
    Write-Host "5. Paste it in this script at line 8" -ForegroundColor Yellow
    exit
}

Write-Host "✓ API Key found (length: $($RAPIDAPI_KEY.Length) characters)" -ForegroundColor Green
Write-Host ""

# STEP 2: Prepare the request
Write-Host "Preparing request..." -ForegroundColor Yellow

$headers = @{
    "content-type" = "application/json"
    "X-RapidAPI-Key" = $RAPIDAPI_KEY
    "X-RapidAPI-Host" = "judge0-ce.p.rapidapi.com"
}

$code = @"
print('Hello from Judge0!')
print('Code execution successful!')
print('2 + 2 =', 2 + 2)
"@

$body = @{
    language_id = 71  # Python 3
    source_code = $code
    stdin = ""
} | ConvertTo-Json

Write-Host "✓ Request prepared" -ForegroundColor Green
Write-Host "  Language: Python 3 (ID: 71)" -ForegroundColor Gray
Write-Host "  Code: 3 lines" -ForegroundColor Gray
Write-Host ""

# STEP 3: Send the request
Write-Host "Sending request to Judge0 API..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod `
        -Uri "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✓ Request successful!" -ForegroundColor Green
    Write-Host ""

    # STEP 4: Display the results
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "EXECUTION RESULTS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Show status
    Write-Host "Status:" -ForegroundColor Yellow
    Write-Host "  Description: $($response.status.description)" -ForegroundColor White
    Write-Host "  ID: $($response.status.id)" -ForegroundColor Gray
    Write-Host ""

    # Show output
    if ($response.stdout) {
        Write-Host "Standard Output (stdout):" -ForegroundColor Green
        Write-Host "─────────────────────────────────────" -ForegroundColor Gray
        Write-Host $response.stdout -ForegroundColor White
        Write-Host "─────────────────────────────────────" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "Standard Output: (empty)" -ForegroundColor Yellow
        Write-Host ""
    }

    # Show errors if any
    if ($response.stderr) {
        Write-Host "Standard Error (stderr):" -ForegroundColor Red
        Write-Host "─────────────────────────────────────" -ForegroundColor Gray
        Write-Host $response.stderr -ForegroundColor White
        Write-Host "─────────────────────────────────────" -ForegroundColor Gray
        Write-Host ""
    }

    # Show compilation output if any
    if ($response.compile_output) {
        Write-Host "Compile Output:" -ForegroundColor Yellow
        Write-Host $response.compile_output -ForegroundColor White
        Write-Host ""
    }

    # Show execution time and memory
    Write-Host "Performance:" -ForegroundColor Yellow
    Write-Host "  Time: $($response.time) seconds" -ForegroundColor White
    Write-Host "  Memory: $($response.memory) KB" -ForegroundColor White
    Write-Host ""

    # Show full response for debugging
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "FULL RESPONSE (for debugging)" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "❌ ERROR occurred!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Message:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor White
    Write-Host ""

    if ($_.ErrorDetails) {
        Write-Host "Error Details:" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message -ForegroundColor White
        Write-Host ""
    }

    Write-Host "Possible causes:" -ForegroundColor Yellow
    Write-Host "1. Invalid API key - check your RapidAPI key" -ForegroundColor Gray
    Write-Host "2. Not subscribed to Judge0 CE on RapidAPI" -ForegroundColor Gray
    Write-Host "3. Rate limit exceeded (50 requests/day on free tier)" -ForegroundColor Gray
    Write-Host "4. Network connection issue" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
