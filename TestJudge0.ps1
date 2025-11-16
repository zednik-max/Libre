# Replace YOUR_KEY_HERE with your actual RapidAPI key

$headers = @{
    "content-type" = "application/json"
    "X-RapidAPI-Key" = "5bde917630msh944128402dd3918p16a575jsn3800334105b4"
    "X-RapidAPI-Host" = "judge0-ce.p.rapidapi.com"
}

$body = @{
    language_id = 71
    source_code = "print('Hello from Judge0!')"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true" -Method POST -Headers $headers -Body $body

# Show the FULL response
Write-Host "FULL RESPONSE:" -ForegroundColor Cyan
$response | ConvertTo-Json -Depth 5

# Show just the output
Write-Host "`nOUTPUT:" -ForegroundColor Green
$response.stdout