#restart Docker
docker-compose -f docker-compose.windows.yml restart

# Wait for containers to start (4 seconds)
Start-Sleep -Seconds 4

# Script to open the default browser with a specific URL
$url = "http://localhost:3080/"
Start-Process $url